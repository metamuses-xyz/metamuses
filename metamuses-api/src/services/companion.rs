use crate::db::{CompanionRepository, UserRepository};
use crate::models::{
    Companion, CompanionStats, CreateCompanionRequest, Traits, UpdateCompanionRequest,
    UpsertUserRequest,
};
use crate::services::traits_gen::{generate_companion_name, generate_traits_from_token_id};
use anyhow::{bail, Context, Result};
use ethers::prelude::*;
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

// MuseAI NFT Contract ABI (minimal interface we need)
abigen!(
    MuseAIContract,
    r#"[
        function ownerOf(uint256 tokenId) external view returns (address)
        function balanceOf(address owner) external view returns (uint256)
        function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)
        function totalSupply() external view returns (uint256)
        function tokenURI(uint256 tokenId) external view returns (string memory)
    ]"#,
);

pub struct CompanionService {
    companion_repo: CompanionRepository,
    user_repo: UserRepository,
    contract: Arc<MuseAIContract<Provider<Http>>>,
}

impl CompanionService {
    /// Create a new CompanionService
    pub fn new(pool: PgPool, rpc_url: &str, contract_address: &str) -> Result<Self> {
        let provider = Provider::<Http>::try_from(rpc_url).context("Failed to create provider")?;

        let contract_addr: Address = contract_address
            .parse()
            .context("Invalid contract address")?;

        let contract = Arc::new(MuseAIContract::new(contract_addr, Arc::new(provider)));

        Ok(Self {
            companion_repo: CompanionRepository::new(pool.clone()),
            user_repo: UserRepository::new(pool),
            contract,
        })
    }

    /// Verify that a user owns a specific NFT
    pub async fn verify_ownership(&self, address: &str, token_id: i64) -> Result<bool> {
        let token_u256 = U256::from(token_id as u64);

        let owner = self
            .contract
            .owner_of(token_u256)
            .call()
            .await
            .context("Failed to call ownerOf")?;

        let owner_str = format!("{:?}", owner).to_lowercase();
        let address_normalized = address.to_lowercase();

        Ok(owner_str == address_normalized)
    }

    /// Get all NFT token IDs owned by an address
    pub async fn get_owned_tokens(&self, address: &str) -> Result<Vec<i64>> {
        let addr: Address = address.parse().context("Invalid wallet address")?;

        let balance = self
            .contract
            .balance_of(addr)
            .call()
            .await
            .context("Failed to get balance")?;

        let mut tokens = Vec::new();
        for i in 0..balance.as_u64() {
            let token_id = self
                .contract
                .token_of_owner_by_index(addr, U256::from(i))
                .call()
                .await
                .context("Failed to get token by index")?;

            tokens.push(token_id.as_u64() as i64);
        }

        Ok(tokens)
    }

    /// Get token URI from contract
    pub async fn get_token_uri(&self, token_id: i64) -> Result<String> {
        let uri = self
            .contract
            .token_uri(U256::from(token_id as u64))
            .call()
            .await
            .context("Failed to get token URI")?;

        Ok(uri)
    }

    /// Initialize a companion from an NFT
    pub async fn initialize_companion(&self, req: &CreateCompanionRequest) -> Result<Companion> {
        // NFT ownership verification removed - allow companion creation for any token ID

        // 1. Check if companion already exists
        if let Some(existing) = self
            .companion_repo
            .get_by_token_id(req.nft_token_id)
            .await?
        {
            // If companion exists but owner changed (NFT was transferred)
            if existing.owner_address.to_lowercase() != req.owner_address.to_lowercase() {
                tracing::info!(
                    "NFT {} transferred from {} to {}",
                    req.nft_token_id,
                    existing.owner_address,
                    req.owner_address
                );
                return Ok(self
                    .companion_repo
                    .update_owner(req.nft_token_id, &req.owner_address)
                    .await?);
            }
            return Ok(existing);
        }

        // 3. Ensure user exists
        let user_req = UpsertUserRequest {
            wallet_address: req.owner_address.clone(),
            username: None,
        };
        self.user_repo.upsert(&user_req).await?;

        // 4. Generate traits and name
        let traits = req
            .traits
            .clone()
            .unwrap_or_else(|| generate_traits_from_token_id(req.nft_token_id));

        let name = req
            .name
            .clone()
            .unwrap_or_else(|| generate_companion_name(req.nft_token_id));

        // 5. Create companion
        let companion = self
            .companion_repo
            .create(req.nft_token_id, &req.owner_address, &name, &traits)
            .await?;

        tracing::info!(
            "Initialized companion {} (token_id: {}, owner: {})",
            companion.name,
            companion.nft_token_id,
            companion.owner_address
        );

        Ok(companion)
    }

    /// Get companion by ID
    pub async fn get_companion(&self, id: Uuid) -> Result<Option<Companion>> {
        self.companion_repo.get_by_id(id).await
    }

    /// Get companion by NFT token ID
    pub async fn get_companion_by_token_id(&self, token_id: i64) -> Result<Option<Companion>> {
        self.companion_repo.get_by_token_id(token_id).await
    }

    /// Get all companions owned by an address
    pub async fn get_user_companions(&self, owner_address: &str) -> Result<Vec<Companion>> {
        // Verify ownership of companions and sync if needed
        let owned_tokens = self.get_owned_tokens(owner_address).await?;
        let mut companions = Vec::new();

        for token_id in owned_tokens {
            match self.companion_repo.get_by_token_id(token_id).await? {
                Some(companion) => {
                    // Check if ownership changed
                    if companion.owner_address.to_lowercase() != owner_address.to_lowercase() {
                        let updated = self
                            .companion_repo
                            .update_owner(token_id, owner_address)
                            .await?;
                        companions.push(updated);
                    } else {
                        companions.push(companion);
                    }
                }
                None => {
                    // Companion doesn't exist yet, initialize it
                    let req = CreateCompanionRequest {
                        nft_token_id: token_id,
                        owner_address: owner_address.to_string(),
                        name: None,
                        traits: None,
                    };
                    let companion = self.initialize_companion(&req).await?;
                    companions.push(companion);
                }
            }
        }

        Ok(companions)
    }

    /// Update companion
    pub async fn update_companion(
        &self,
        id: Uuid,
        req: &UpdateCompanionRequest,
    ) -> Result<Companion> {
        self.companion_repo.update(id, req).await
    }

    /// Add XP to companion
    pub async fn add_xp(&self, id: Uuid, xp: i64) -> Result<Companion> {
        let mut companion = self.companion_repo.add_xp(id, xp).await?;

        // Check if companion should level up
        while companion.can_level_up() {
            companion = self.companion_repo.level_up(companion.id).await?;
            tracing::info!(
                "Companion {} leveled up to level {}!",
                companion.name,
                companion.level
            );
        }

        Ok(companion)
    }

    /// Get companion statistics
    pub async fn get_stats(&self, id: Uuid) -> Result<CompanionStats> {
        self.companion_repo.get_stats(id).await
    }

    /// Update companion traits
    pub async fn update_traits(&self, id: Uuid, traits: &Traits) -> Result<Companion> {
        if !traits.validate() {
            bail!("Invalid traits: values must be between 0 and 100");
        }

        self.companion_repo.update_traits(id, traits).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_contract_struct_exists() {
        // Just verify the contract type compiles
        // We can't easily test the actual ABI without a provider
        let _type_check: Option<MuseAIContract<Provider<Http>>> = None;
    }

    #[tokio::test]
    #[ignore] // Requires database and blockchain connection
    async fn test_verify_ownership() {
        // This would require a real RPC connection and test data
        // Placeholder for integration test
    }
}

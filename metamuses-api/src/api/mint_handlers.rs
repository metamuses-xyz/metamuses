// Gasless Minting Handler
// Handles EIP-712 signature verification and gasless NFT minting

use super::types::*;
use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use ethers::{
    abi::{encode, Token},
    contract::abigen,
    core::k256::ecdsa::SigningKey,
    middleware::SignerMiddleware,
    prelude::*,
    providers::{Http, Provider},
    signers::{LocalWallet, Signer, Wallet},
    types::{transaction::eip712::Eip712, Signature as EthSignature},
    utils::keccak256,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info, warn};

// ============================================================================
// Request/Response Types
// ============================================================================

#[derive(Debug, Deserialize, Serialize)]
pub struct GetNonceRequest {
    pub address: String,
}

#[derive(Debug, Serialize)]
pub struct GetNonceResponse {
    pub nonce: u64,
    pub address: String,
}

#[derive(Debug, Deserialize)]
pub struct GaslessMintRequest {
    pub user_address: String,
    pub signature: String,
}

#[derive(Debug, Serialize)]
pub struct GaslessMintResponse {
    pub success: bool,
    pub tx_hash: String,
    pub token_id: Option<u64>,
    pub explorer_url: String,
}

// EIP-712 Domain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EIP712Domain {
    pub name: String,
    pub version: String,
    pub chain_id: U256,
    pub verifying_contract: Address,
}

// MintRequest type for EIP-712
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MintRequest {
    pub to: Address,
    pub nonce: U256,
}

// ============================================================================
// Contract ABI
// ============================================================================

abigen!(
    MuseAI,
    r#"[
        function getNonce(address user) external view returns (uint256)
        function hasMinted(address user) external view returns (bool)
        function isMintingActive() external view returns (bool)
        function getCurrentTokenId() external view returns (uint256)
        function mintWithSignature(address to, uint256 nonce, bytes memory signature) external
        event GaslessMint(address indexed to, uint256 indexed tokenId, uint256 nonce)
    ]"#
);

// ============================================================================
// Application State for Mint Endpoints
// ============================================================================

#[derive(Clone)]
pub struct MintAppState {
    pub contract_address: Address,
    pub rpc_url: String,
    pub backend_wallet: Arc<LocalWallet>,
    pub chain_id: u64,
    pub explorer_base_url: String,
}

impl MintAppState {
    pub async fn new(
        contract_address: Address,
        rpc_url: String,
        backend_private_key: String,
        chain_id: u64,
        explorer_base_url: String,
    ) -> Result<Self, anyhow::Error> {
        // Parse backend wallet
        let wallet: LocalWallet = backend_private_key.parse()?;
        let wallet = wallet.with_chain_id(chain_id);

        Ok(Self {
            contract_address,
            rpc_url,
            backend_wallet: Arc::new(wallet),
            chain_id,
            explorer_base_url,
        })
    }

    pub async fn get_contract(&self) -> Result<MuseAI<SignerMiddleware<Provider<Http>, LocalWallet>>, anyhow::Error> {
        let provider = Provider::<Http>::try_from(&self.rpc_url)?;
        let wallet = (*self.backend_wallet).clone();
        let client = Arc::new(SignerMiddleware::new(provider, wallet));

        Ok(MuseAI::new(self.contract_address, client))
    }
}

// ============================================================================
// Get Nonce Handler
// ============================================================================

pub async fn get_nonce_handler(
    State(state): State<MintAppState>,
    Json(req): Json<GetNonceRequest>,
) -> Result<Json<GetNonceResponse>, MintError> {
    info!("Getting nonce for address: {}", req.address);

    // Parse address
    let address: Address = req
        .address
        .parse()
        .map_err(|_| MintError::BadRequest("Invalid address format".to_string()))?;

    // Get contract instance
    let contract = state
        .get_contract()
        .await
        .map_err(|e| MintError::InternalError(format!("Failed to connect to contract: {}", e)))?;

    // Get nonce from contract
    let nonce = contract
        .get_nonce(address)
        .call()
        .await
        .map_err(|e| MintError::InternalError(format!("Failed to get nonce: {}", e)))?;

    info!("Nonce for {}: {}", address, nonce);

    Ok(Json(GetNonceResponse {
        nonce: nonce.as_u64(),
        address: req.address,
    }))
}

// ============================================================================
// Gasless Mint Handler
// ============================================================================

pub async fn gasless_mint_handler(
    State(state): State<MintAppState>,
    Json(req): Json<GaslessMintRequest>,
) -> Result<Json<GaslessMintResponse>, MintError> {
    info!("Processing gasless mint request for: {}", req.user_address);

    // Parse user address
    let user_address: Address = req
        .user_address
        .parse()
        .map_err(|_| MintError::BadRequest("Invalid address format".to_string()))?;

    // Parse signature
    let signature_bytes = hex::decode(req.signature.trim_start_matches("0x"))
        .map_err(|_| MintError::BadRequest("Invalid signature format".to_string()))?;

    if signature_bytes.len() != 65 {
        return Err(MintError::BadRequest("Signature must be 65 bytes".to_string()));
    }

    // Get contract instance
    let contract = state
        .get_contract()
        .await
        .map_err(|e| MintError::InternalError(format!("Failed to connect to contract: {}", e)))?;

    // Check if user has already minted
    let has_minted = contract
        .has_minted(user_address)
        .call()
        .await
        .map_err(|e| MintError::InternalError(format!("Failed to check minting status: {}", e)))?;

    if has_minted {
        return Err(MintError::BadRequest("Address has already minted".to_string()));
    }

    // Check if minting is active
    let is_active = contract
        .is_minting_active()
        .call()
        .await
        .map_err(|e| MintError::InternalError(format!("Failed to check minting status: {}", e)))?;

    if !is_active {
        return Err(MintError::BadRequest("Minting is not currently active".to_string()));
    }

    // Get nonce
    let nonce = contract
        .get_nonce(user_address)
        .call()
        .await
        .map_err(|e| MintError::InternalError(format!("Failed to get nonce: {}", e)))?;

    info!("Minting NFT for {} with nonce {}", user_address, nonce);

    // Call mintWithSignature - store the call result first
    let mint_call = contract.mint_with_signature(user_address, nonce, signature_bytes.into());
    let pending_tx = mint_call
        .send()
        .await
        .map_err(|e| {
            error!("Failed to send mint transaction: {}", e);
            MintError::InternalError(format!("Failed to mint: {}", e))
        })?;

    let tx_hash = *pending_tx;
    info!("Transaction sent: {:?}", tx_hash);

    // Wait for confirmation (with timeout)
    let receipt = pending_tx
        .await
        .map_err(|e| {
            error!("Transaction failed: {}", e);
            MintError::InternalError(format!("Transaction failed: {}", e))
        })?;

    let receipt = receipt.ok_or_else(|| {
        error!("No receipt returned");
        MintError::InternalError("Transaction receipt not found".to_string())
    })?;

    // Check transaction status
    if receipt.status != Some(1.into()) {
        error!("Transaction reverted");
        return Err(MintError::InternalError("Transaction reverted".to_string()));
    }

    info!("Transaction confirmed: {:?}", tx_hash);

    // Extract token ID from logs
    let token_id = extract_token_id_from_logs(&receipt);

    let explorer_url = format!("{}/tx/{:?}", state.explorer_base_url, tx_hash);

    Ok(Json(GaslessMintResponse {
        success: true,
        tx_hash: format!("{:?}", tx_hash),
        token_id,
        explorer_url,
    }))
}

// ============================================================================
// Helper Functions
// ============================================================================

fn extract_token_id_from_logs(receipt: &TransactionReceipt) -> Option<u64> {
    // Look for GaslessMint event
    for log in &receipt.logs {
        if log.topics.len() >= 3 {
            // topics[0] = event signature
            // topics[1] = indexed to
            // topics[2] = indexed tokenId
            if let Some(token_id_hash) = log.topics.get(2) {
                // Convert H256 to U256
                let token_id_u256 = U256::from(token_id_hash.as_bytes());

                // Safely convert to u64, checking if it fits
                if token_id_u256 <= U256::from(u64::MAX) {
                    return Some(token_id_u256.as_u64());
                } else {
                    // Token ID is too large for u64, log warning and return None
                    warn!("Token ID {:?} is too large to fit in u64", token_id_u256);
                    return None;
                }
            }
        }
    }
    None
}

// ============================================================================
// Error Handling
// ============================================================================

#[derive(Debug)]
pub enum MintError {
    BadRequest(String),
    InternalError(String),
    NotFound(String),
}

impl IntoResponse for MintError {
    fn into_response(self) -> Response {
        let (status, error_type, message) = match self {
            MintError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "bad_request", msg),
            MintError::InternalError(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "internal_error", msg)
            }
            MintError::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg),
        };

        let error_response = ErrorResponse::new(error_type, &message);

        (status, Json(error_response)).into_response()
    }
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
}

impl ErrorResponse {
    pub fn new(error: &str, message: &str) -> Self {
        Self {
            error: error.to_string(),
            message: message.to_string(),
        }
    }
}

// Chat Authentication Module
// Implements EIP-712 signature verification for chat API requests

use ethers::{
    abi::{encode, Token},
    types::{Address, H256, U256},
    utils::keccak256,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use thiserror::Error;
use tracing::{error, info, warn};

// ============================================================================
// Constants
// ============================================================================

/// Maximum allowed timestamp drift in seconds (5 minutes)
const MAX_TIMESTAMP_DRIFT_SECS: u64 = 300;

/// Nonce TTL in Redis (10 minutes)
const NONCE_TTL_SECS: u64 = 600;

/// Redis key prefix for used nonces
const NONCE_KEY_PREFIX: &str = "chat_nonce";

// ============================================================================
// Error Types
// ============================================================================

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("Missing authentication: signature, timestamp, and nonce are required")]
    MissingAuth,

    #[error("Invalid signature format: {0}")]
    InvalidSignatureFormat(String),

    #[error("Signature verification failed: recovered address does not match")]
    SignatureVerificationFailed,

    #[error("Timestamp expired: request too old (max {MAX_TIMESTAMP_DRIFT_SECS} seconds)")]
    TimestampExpired,

    #[error("Timestamp in future: request timestamp is ahead of server time")]
    TimestampFuture,

    #[error("Nonce already used: replay attack detected")]
    NonceReused,

    #[error("Internal error: {0}")]
    InternalError(String),
}

// ============================================================================
// EIP-712 Types
// ============================================================================

/// EIP-712 Domain Separator for MetaMuses Chat
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatAuthDomain {
    pub name: String,
    pub version: String,
    pub chain_id: U256,
}

impl Default for ChatAuthDomain {
    fn default() -> Self {
        Self {
            name: "MetaMuses".to_string(),
            version: "1".to_string(),
            chain_id: U256::from(133717), // Metis Hyperion Testnet
        }
    }
}

/// EIP-712 ChatAuth typed data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatAuthMessage {
    pub user_address: Address,
    pub timestamp: U256,
    pub nonce: String,
}

// ============================================================================
// Signature Verification
// ============================================================================

/// Verify EIP-712 signature for chat authentication
pub fn verify_chat_signature(
    user_address: &str,
    timestamp: u64,
    nonce: &str,
    signature: &str,
) -> Result<Address, AuthError> {
    // Parse claimed address
    let claimed_address: Address = user_address
        .parse()
        .map_err(|_| AuthError::InvalidSignatureFormat("Invalid user address format".to_string()))?;

    // Parse signature
    let sig_bytes = hex::decode(signature.trim_start_matches("0x"))
        .map_err(|_| AuthError::InvalidSignatureFormat("Invalid hex encoding".to_string()))?;

    if sig_bytes.len() != 65 {
        return Err(AuthError::InvalidSignatureFormat(format!(
            "Signature must be 65 bytes, got {}",
            sig_bytes.len()
        )));
    }

    // Compute EIP-712 typed data hash
    let domain = ChatAuthDomain::default();
    let message_hash = compute_typed_data_hash(&domain, claimed_address, timestamp, nonce)?;

    // Recover signer from signature
    let recovered_address = recover_signer(&message_hash, &sig_bytes)?;

    // Verify recovered address matches claimed address
    if recovered_address != claimed_address {
        warn!(
            "Signature verification failed: claimed={}, recovered={}",
            claimed_address, recovered_address
        );
        return Err(AuthError::SignatureVerificationFailed);
    }

    info!(
        "✓ Signature verified for address: {}",
        recovered_address
    );
    Ok(recovered_address)
}

/// Compute EIP-712 typed data hash
fn compute_typed_data_hash(
    domain: &ChatAuthDomain,
    user_address: Address,
    timestamp: u64,
    nonce: &str,
) -> Result<H256, AuthError> {
    // EIP-712 type hashes
    let domain_type_hash = keccak256(
        b"EIP712Domain(string name,string version,uint256 chainId)"
    );

    let chat_auth_type_hash = keccak256(
        b"ChatAuth(address userAddress,uint256 timestamp,string nonce)"
    );

    // Domain separator hash
    let domain_separator = keccak256(&encode(&[
        Token::FixedBytes(domain_type_hash.to_vec()),
        Token::FixedBytes(keccak256(domain.name.as_bytes()).to_vec()),
        Token::FixedBytes(keccak256(domain.version.as_bytes()).to_vec()),
        Token::Uint(domain.chain_id),
    ]));

    // Message struct hash
    let struct_hash = keccak256(&encode(&[
        Token::FixedBytes(chat_auth_type_hash.to_vec()),
        Token::Address(user_address),
        Token::Uint(U256::from(timestamp)),
        Token::FixedBytes(keccak256(nonce.as_bytes()).to_vec()),
    ]));

    // Final hash: \x19\x01 ++ domain_separator ++ struct_hash
    let mut data = Vec::with_capacity(66);
    data.push(0x19);
    data.push(0x01);
    data.extend_from_slice(&domain_separator);
    data.extend_from_slice(&struct_hash);

    Ok(H256::from(keccak256(&data)))
}

/// Recover signer address from signature
fn recover_signer(message_hash: &H256, signature: &[u8]) -> Result<Address, AuthError> {
    use ethers::core::k256::ecdsa::{RecoveryId, Signature, VerifyingKey};
    use ethers::core::k256::elliptic_curve::sec1::ToEncodedPoint;

    // Extract r, s, v from signature (65 bytes: r(32) + s(32) + v(1))
    let r = &signature[0..32];
    let s = &signature[32..64];
    let v = signature[64];

    // Normalize v value (27/28 -> 0/1)
    // RecoveryId::new takes (is_y_odd: bool, is_x_reduced: bool)
    // For standard Ethereum signatures, is_x_reduced is always false
    let recovery_id = match v {
        27 | 0 => RecoveryId::new(false, false), // is_y_odd = false (v=27 or 0)
        28 | 1 => RecoveryId::new(true, false),  // is_y_odd = true (v=28 or 1)
        _ => return Err(AuthError::InvalidSignatureFormat(format!(
            "Invalid recovery id: {}",
            v
        ))),
    };

    // Construct signature from r and s
    let mut sig_bytes = [0u8; 64];
    sig_bytes[..32].copy_from_slice(r);
    sig_bytes[32..].copy_from_slice(s);

    let signature = Signature::from_bytes((&sig_bytes).into())
        .map_err(|e| AuthError::InvalidSignatureFormat(format!("Invalid signature: {}", e)))?;

    // Recover public key
    let recovered_key = VerifyingKey::recover_from_prehash(
        message_hash.as_bytes(),
        &signature,
        recovery_id,
    )
    .map_err(|e| AuthError::InvalidSignatureFormat(format!("Recovery failed: {}", e)))?;

    // Convert public key to address
    let public_key_bytes = recovered_key.to_encoded_point(false);
    let public_key_hash = keccak256(&public_key_bytes.as_bytes()[1..]); // Skip the 0x04 prefix
    let address = Address::from_slice(&public_key_hash[12..]);

    Ok(address)
}

// ============================================================================
// Timestamp Validation
// ============================================================================

/// Validate timestamp is within acceptable drift
pub fn validate_timestamp(timestamp: u64) -> Result<(), AuthError> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| AuthError::InternalError(format!("System time error: {}", e)))?
        .as_secs();

    // Check if timestamp is too old
    if timestamp + MAX_TIMESTAMP_DRIFT_SECS < now {
        return Err(AuthError::TimestampExpired);
    }

    // Check if timestamp is in the future (with small tolerance)
    if timestamp > now + 60 {
        return Err(AuthError::TimestampFuture);
    }

    Ok(())
}

// ============================================================================
// Nonce Management
// ============================================================================

/// Check and mark nonce as used (prevents replay attacks)
pub async fn check_and_mark_nonce(
    redis_client: &Arc<redis::Client>,
    user_address: &str,
    nonce: &str,
) -> Result<(), AuthError> {
    let key = format!("{}:{}:{}", NONCE_KEY_PREFIX, user_address.to_lowercase(), nonce);

    let mut conn = redis_client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| AuthError::InternalError(format!("Redis connection error: {}", e)))?;

    // Try to set the key with NX (only if not exists)
    let set_result: Option<String> = redis::cmd("SET")
        .arg(&key)
        .arg("1")
        .arg("NX") // Only set if not exists
        .arg("EX") // Expiry in seconds
        .arg(NONCE_TTL_SECS)
        .query_async(&mut conn)
        .await
        .map_err(|e| AuthError::InternalError(format!("Redis SET error: {}", e)))?;

    match set_result {
        Some(_) => {
            info!("✓ Nonce {} marked as used for {}", nonce, user_address);
            Ok(())
        }
        None => {
            warn!("Nonce {} already used for {}", nonce, user_address);
            Err(AuthError::NonceReused)
        }
    }
}

// ============================================================================
// Full Authentication Flow
// ============================================================================

/// Complete authentication: verify signature, validate timestamp, check nonce
pub async fn authenticate_chat_request(
    redis_client: &Arc<redis::Client>,
    user_address: &str,
    timestamp: Option<u64>,
    nonce: Option<&str>,
    signature: Option<&str>,
) -> Result<Address, AuthError> {
    // Check all required fields are present
    let timestamp = timestamp.ok_or(AuthError::MissingAuth)?;
    let nonce = nonce.ok_or(AuthError::MissingAuth)?;
    let signature = signature.ok_or(AuthError::MissingAuth)?;

    // Step 1: Validate timestamp
    validate_timestamp(timestamp)?;

    // Step 2: Verify signature
    let verified_address = verify_chat_signature(user_address, timestamp, nonce, signature)?;

    // Step 3: Check and mark nonce
    check_and_mark_nonce(redis_client, user_address, nonce).await?;

    Ok(verified_address)
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_timestamp_validation_valid() {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        assert!(validate_timestamp(now).is_ok());
        assert!(validate_timestamp(now - 60).is_ok());
        assert!(validate_timestamp(now - 299).is_ok());
    }

    #[test]
    fn test_timestamp_validation_expired() {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        assert!(validate_timestamp(now - 301).is_err());
        assert!(validate_timestamp(now - 600).is_err());
    }

    #[test]
    fn test_timestamp_validation_future() {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Small drift allowed
        assert!(validate_timestamp(now + 30).is_ok());
        // Too far in future
        assert!(validate_timestamp(now + 120).is_err());
    }

    #[test]
    fn test_compute_typed_data_hash() {
        let domain = ChatAuthDomain::default();
        let address: Address = "0x1234567890123456789012345678901234567890".parse().unwrap();
        let timestamp = 1704067200u64; // 2024-01-01 00:00:00 UTC
        let nonce = "test-nonce-123";

        let result = compute_typed_data_hash(&domain, address, timestamp, nonce);
        assert!(result.is_ok());

        // Hash should be deterministic
        let hash1 = result.unwrap();
        let hash2 = compute_typed_data_hash(&domain, address, timestamp, nonce).unwrap();
        assert_eq!(hash1, hash2);
    }
}

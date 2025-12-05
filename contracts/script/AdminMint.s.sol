// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {Script} from "forge-std/Script.sol";
import {MuseAI} from "../src/MuseAI.sol";
import {console} from "forge-std/console.sol";

/**
 * @title AdminMint Script
 * @dev Script for admin minting operations
 * 
 * Usage Examples:
 * 
 * 1. Mint single NFT to address:
 *    forge script script/AdminMint.s.sol:AdminMint \
 *      --sig "mintSingle(address,address)" <contract_address> <recipient_address> \
 *      --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast -vv
 * 
 * 2. Batch mint to single address:
 *    forge script script/AdminMint.s.sol:AdminMint \
 *      --sig "mintBatch(address,address,uint256)" <contract_address> <recipient_address> <quantity> \
 *      --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast -vv
 * 
 * 3. Airdrop to multiple addresses (1 NFT each):
 *    forge script script/AdminMint.s.sol:AdminMint \
 *      --sig "airdrop(address)" <contract_address> \
 *      --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast -vv
 *    (Edit recipients array in airdrop() function before running)
 */
contract AdminMint is Script {
    
    /**
     * @dev Mint a single NFT to recipient
     * @param contractAddress MuseAI contract address
     * @param recipient Address to receive the NFT
     */
    function mintSingle(address contractAddress, address recipient) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        MuseAI museai = MuseAI(contractAddress);
        
        // Check current state
        uint256 currentTokenId = museai.getCurrentTokenId();
        console.log("Current token ID:", currentTokenId);
        console.log("Minting to:", recipient);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Admin mint
        museai.adminMint(recipient);
        
        vm.stopBroadcast();
        
        // Verify
        uint256 newTokenId = museai.getCurrentTokenId();
        console.log("New token ID:", newTokenId);
        console.log("Minted token #:", newTokenId - 1);
        console.log("Success! NFT minted to", recipient);
    }
    
    /**
     * @dev Batch mint multiple NFTs to single recipient
     * @param contractAddress MuseAI contract address
     * @param recipient Address to receive the NFTs
     * @param quantity Number of NFTs to mint
     */
    function mintBatch(
        address contractAddress,
        address recipient,
        uint256 quantity
    ) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        MuseAI museai = MuseAI(contractAddress);
        
        // Check current state
        uint256 currentTokenId = museai.getCurrentTokenId();
        uint256 maxSupply = museai.MAX_SUPPLY();
        console.log("Current token ID:", currentTokenId);
        console.log("Max supply:", maxSupply);
        console.log("Remaining:", maxSupply - currentTokenId);
        console.log("Batch minting", quantity, "NFTs to:", recipient);
        
        require(currentTokenId + quantity <= maxSupply, "Would exceed max supply");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Batch mint
        museai.batchMint(recipient, quantity);
        
        vm.stopBroadcast();
        
        // Verify
        uint256 newTokenId = museai.getCurrentTokenId();
        console.log("New token ID:", newTokenId);
        console.log("Success! Minted", quantity, "NFTs to", recipient);
    }
    
    /**
     * @dev Airdrop to multiple addresses (1 NFT each)
     * @param contractAddress MuseAI contract address
     * 
     * IMPORTANT: Edit the recipients array below before running!
     */
    function airdrop(address contractAddress) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        MuseAI museai = MuseAI(contractAddress);
        
        // ====================================================================
        // EDIT THIS ARRAY WITH RECIPIENT ADDRESSES
        // ====================================================================
        address[] memory recipients = new address[](3);
        recipients[0] = 0x1234567890123456789012345678901234567890; // Replace with actual address
        recipients[1] = 0x2234567890123456789012345678901234567890; // Replace with actual address
        recipients[2] = 0x3234567890123456789012345678901234567890; // Replace with actual address
        // ====================================================================
        
        uint256 currentTokenId = museai.getCurrentTokenId();
        uint256 maxSupply = museai.MAX_SUPPLY();
        
        console.log("=== Airdrop Details ===");
        console.log("Current token ID:", currentTokenId);
        console.log("Recipients:", recipients.length);
        console.log("Remaining supply:", maxSupply - currentTokenId);
        
        require(
            currentTokenId + recipients.length <= maxSupply,
            "Would exceed max supply"
        );
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Mint to each recipient
        for (uint256 i = 0; i < recipients.length; i++) {
            console.log("Minting to:", recipients[i]);
            museai.adminMint(recipients[i]);
        }
        
        vm.stopBroadcast();
        
        uint256 newTokenId = museai.getCurrentTokenId();
        console.log("=== Airdrop Complete ===");
        console.log("New token ID:", newTokenId);
        console.log("Total minted:", recipients.length);
    }
}

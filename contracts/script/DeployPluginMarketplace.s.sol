// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "forge-std/Script.sol";
import "../src/PluginMarketplace.sol";

/**
 * @title DeployPluginMarketplace
 * @notice Deployment script for PluginMarketplace contract on Metis Hyperion Testnet
 *
 * Usage:
 *   forge script script/DeployPluginMarketplace.s.sol:DeployPluginMarketplace \
 *     --rpc-url https://hyperion-testnet.metisdevops.link \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast --legacy -vv
 *
 * Environment Variables:
 *   PRIVATE_KEY        - Deployer's private key
 *   MUSE_NFT_ADDRESS   - Address of deployed MuseAI NFT contract
 *   PLATFORM_WALLET    - Address to receive platform fees
 */
contract DeployPluginMarketplace is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address museNFT = vm.envAddress("MUSE_NFT_ADDRESS");
        address platformWallet = vm.envAddress("PLATFORM_WALLET");

        console.log("=== PluginMarketplace Deployment ===");
        console.log("");
        console.log("Network: Metis Hyperion Testnet");
        console.log("Chain ID:", block.chainid);
        console.log("");
        console.log("Configuration:");
        console.log("  MuseAI NFT:", museNFT);
        console.log("  Platform Wallet:", platformWallet);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy PluginMarketplace
        PluginMarketplace marketplace = new PluginMarketplace(
            museNFT,
            platformWallet
        );

        vm.stopBroadcast();

        console.log("=== Deployment Complete ===");
        console.log("");
        console.log("PluginMarketplace deployed at:");
        console.log(address(marketplace));
        console.log("Owner:", marketplace.owner());
        console.log("Platform Fee (basis points):", marketplace.platformFee());
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Verify contract on explorer");
        console.log("2. Set usage tracker if needed: marketplace.setUsageTracker(address)");
        console.log("3. Update frontend with new contract address");
    }
}

/**
 * @title DeployPluginMarketplaceWithMock
 * @notice Deploy PluginMarketplace with a mock MuseAI for testing
 */
contract DeployPluginMarketplaceWithMock is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== PluginMarketplace Deployment (With New MuseAI) ===");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MuseAI first if needed
        // Note: Import MuseAI if using this script
        // MuseAI museNFT = new MuseAI(...);

        // For now, use zero address (can set later)
        PluginMarketplace marketplace = new PluginMarketplace(
            address(0), // Will set MuseNFT later
            deployer    // Platform wallet = deployer for testing
        );

        vm.stopBroadcast();

        console.log("=== Deployment Complete ===");
        console.log("PluginMarketplace:", address(marketplace));
        console.log("");
        console.log("IMPORTANT: Set MuseNFT address:");
        console.log("  marketplace.setMuseNFT(<MUSE_NFT_ADDRESS>)");
    }
}

/**
 * @title RegisterSamplePlugins
 * @notice Register sample plugins for testing
 */
contract RegisterSamplePlugins is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address marketplaceAddress = vm.envAddress("PLUGIN_MARKETPLACE_ADDRESS");

        PluginMarketplace marketplace = PluginMarketplace(marketplaceAddress);

        console.log("=== Registering Sample Plugins ===");
        console.log("Marketplace:", marketplaceAddress);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Language Tutor (Knowledge)
        uint256 plugin1 = marketplace.registerPlugin(
            "Spanish Language Tutor",
            "ipfs://QmLanguageTutorMetadata",
            "ipfs://QmLanguageTutorWasm",
            IPluginMarketplace.Category.KNOWLEDGE
        );
        marketplace.createListing(
            plugin1,
            IPluginMarketplace.AccessType.SUBSCRIPTION,
            0.01 ether,  // Price
            0,           // No quota
            30 days,     // 30-day subscription
            7 days       // 7-day trial
        );
        console.log("Registered: Spanish Language Tutor, ID:", plugin1);

        // Code Assistant (Skills)
        uint256 plugin2 = marketplace.registerPlugin(
            "Code Assistant Pro",
            "ipfs://QmCodeAssistantMetadata",
            "ipfs://QmCodeAssistantWasm",
            IPluginMarketplace.Category.SKILLS
        );
        marketplace.createListing(
            plugin2,
            IPluginMarketplace.AccessType.PERMANENT,
            0.05 ether,  // One-time purchase
            0,
            0,
            0            // No trial
        );
        console.log("Registered: Code Assistant Pro, ID:", plugin2);

        // Health Coach (Tools)
        uint256 plugin3 = marketplace.registerPlugin(
            "Health Coach",
            "ipfs://QmHealthCoachMetadata",
            "ipfs://QmHealthCoachWasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            plugin3,
            IPluginMarketplace.AccessType.USAGE_BASED,
            0.001 ether, // Per 100 uses
            100,         // 100 uses per purchase
            0,
            0
        );
        console.log("Registered: Health Coach, ID:", plugin3);

        // Creative Writer (Entertainment)
        uint256 plugin4 = marketplace.registerPlugin(
            "Creative Writing Assistant",
            "ipfs://QmCreativeWriterMetadata",
            "ipfs://QmCreativeWriterWasm",
            IPluginMarketplace.Category.ENTERTAINMENT
        );
        marketplace.createListing(
            plugin4,
            IPluginMarketplace.AccessType.SUBSCRIPTION,
            0.02 ether,
            0,
            7 days,      // Weekly subscription
            1 days       // 1-day trial
        );
        console.log("Registered: Creative Writing Assistant, ID:", plugin4);

        // Emotional Intelligence (Personality)
        uint256 plugin5 = marketplace.registerPlugin(
            "Emotional Intelligence Coach",
            "ipfs://QmEmotionalIntelMetadata",
            "ipfs://QmEmotionalIntelWasm",
            IPluginMarketplace.Category.PERSONALITY
        );
        marketplace.createListing(
            plugin5,
            IPluginMarketplace.AccessType.PERMANENT,
            0.03 ether,
            0,
            0,
            3 days       // 3-day trial
        );
        console.log("Registered: Emotional Intelligence Coach, ID:", plugin5);

        vm.stopBroadcast();

        console.log("");
        console.log("=== Sample Plugins Registered ===");
        console.log("Total Plugins:", marketplace.pluginCounter());
    }
}

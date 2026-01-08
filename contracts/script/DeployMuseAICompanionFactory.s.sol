// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "forge-std/Script.sol";
import "../src/companions/MuseAICompanionFactory.sol";
import "../src/companions/MuseAICompanion.sol";
import "../src/companions/IMuseAICompanion.sol";

/**
 * @title DeployMuseAICompanionFactory
 * @notice Deployment script for MuseAICompanionFactory on Metis Hyperion Testnet
 *
 * Usage:
 *   forge script script/DeployMuseAICompanionFactory.s.sol:DeployMuseAICompanionFactory \
 *     --rpc-url https://hyperion-testnet.metis.io \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast --legacy -vv
 *
 * Environment Variables:
 *   PRIVATE_KEY              - Deployer's private key
 *   MUSE_NFT_ADDRESS         - Address of deployed MuseAI NFT contract
 *   PLUGIN_MARKETPLACE_ADDRESS - Address of deployed PluginMarketplace (optional)
 */
contract DeployMuseAICompanionFactory is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address museNFT = vm.envAddress("MUSE_NFT_ADDRESS");

        // Plugin marketplace is optional
        address pluginMarketplace;
        try vm.envAddress("PLUGIN_MARKETPLACE_ADDRESS") returns (address addr) {
            pluginMarketplace = addr;
        } catch {
            pluginMarketplace = address(0);
        }

        console.log("=== MuseAICompanionFactory Deployment ===");
        console.log("");
        console.log("Network: Metis Hyperion Testnet");
        console.log("Chain ID:", block.chainid);
        console.log("");
        console.log("Configuration:");
        console.log("  MuseAI NFT:", museNFT);
        console.log("  Plugin Marketplace:", pluginMarketplace);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MuseAICompanionFactory
        MuseAICompanionFactory factory = new MuseAICompanionFactory(
            museNFT,
            pluginMarketplace
        );

        vm.stopBroadcast();

        console.log("=== Deployment Complete ===");
        console.log("");
        console.log("MuseAICompanionFactory deployed at:");
        console.log(address(factory));
        console.log("Owner:", factory.owner());
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Verify contract on explorer");
        console.log("2. Set plugin marketplace if not set: factory.setPluginMarketplace(address)");
        console.log("3. Update frontend with new contract address");
        console.log("4. Users can now deploy companions via: factory.deployCompanion(tokenId, traits)");
    }
}

/**
 * @title DeployFactoryWithSampleCompanion
 * @notice Deploy factory and create a sample companion for testing
 */
contract DeployFactoryWithSampleCompanion is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address museNFT = vm.envAddress("MUSE_NFT_ADDRESS");
        uint256 tokenId = vm.envUint("TOKEN_ID");

        address pluginMarketplace;
        try vm.envAddress("PLUGIN_MARKETPLACE_ADDRESS") returns (address addr) {
            pluginMarketplace = addr;
        } catch {
            pluginMarketplace = address(0);
        }

        console.log("=== Deploying Factory with Sample Companion ===");
        console.log("");
        console.log("MuseAI NFT:", museNFT);
        console.log("Token ID for sample companion:", tokenId);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Factory
        MuseAICompanionFactory factory = new MuseAICompanionFactory(
            museNFT,
            pluginMarketplace
        );

        // Create sample companion with balanced traits
        IMuseAICompanion.PersonalityTraits memory traits = IMuseAICompanion.PersonalityTraits({
            creativity: 70,
            wisdom: 75,
            humor: 60,
            empathy: 80,
            logic: 65
        });

        address companionAddr = factory.deployCompanionWithName(
            tokenId,
            traits,
            "Sample Companion"
        );

        vm.stopBroadcast();

        console.log("=== Deployment Complete ===");
        console.log("");
        console.log("Factory Address:", address(factory));
        console.log("Sample Companion Address:", companionAddr);
        console.log("");
        console.log("Companion Traits:");
        console.log("  Creativity:", traits.creativity);
        console.log("  Wisdom:", traits.wisdom);
        console.log("  Humor:", traits.humor);
        console.log("  Empathy:", traits.empathy);
        console.log("  Logic:", traits.logic);
    }
}

/**
 * @title UpdateFactoryMarketplace
 * @notice Update the plugin marketplace address on an existing factory
 */
contract UpdateFactoryMarketplace is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        address newMarketplace = vm.envAddress("NEW_MARKETPLACE_ADDRESS");

        console.log("=== Updating Factory Marketplace ===");
        console.log("Factory:", factoryAddress);
        console.log("New Marketplace:", newMarketplace);

        vm.startBroadcast(deployerPrivateKey);

        MuseAICompanionFactory factory = MuseAICompanionFactory(factoryAddress);
        factory.setPluginMarketplace(newMarketplace);

        vm.stopBroadcast();

        console.log("Update complete!");
        console.log("Current Marketplace:", factory.pluginMarketplace());
    }
}

/**
 * @title BatchUpdateCompanionMarketplaces
 * @notice Update marketplace address for multiple companions
 */
contract BatchUpdateCompanionMarketplaces is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        address newMarketplace = vm.envAddress("NEW_MARKETPLACE_ADDRESS");

        // Token IDs to update - modify as needed
        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 0;
        tokenIds[1] = 1;
        tokenIds[2] = 2;

        console.log("=== Batch Updating Companion Marketplaces ===");
        console.log("Factory:", factoryAddress);
        console.log("New Marketplace:", newMarketplace);
        console.log("Token IDs to update:", tokenIds.length);

        vm.startBroadcast(deployerPrivateKey);

        MuseAICompanionFactory factory = MuseAICompanionFactory(factoryAddress);
        factory.batchUpdateCompanionMarketplaces(tokenIds, newMarketplace);

        vm.stopBroadcast();

        console.log("Batch update complete!");
    }
}

/**
 * @title DeployCompanionOnly
 * @notice Deploy a companion using an existing factory
 */
contract DeployCompanionOnly is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        uint256 tokenId = vm.envUint("TOKEN_ID");
        string memory companionName = vm.envOr("COMPANION_NAME", string("My AI Companion"));

        // Trait values (0-100)
        uint8 creativity = uint8(vm.envOr("TRAIT_CREATIVITY", uint256(50)));
        uint8 wisdom = uint8(vm.envOr("TRAIT_WISDOM", uint256(50)));
        uint8 humor = uint8(vm.envOr("TRAIT_HUMOR", uint256(50)));
        uint8 empathy = uint8(vm.envOr("TRAIT_EMPATHY", uint256(50)));
        uint8 logic = uint8(vm.envOr("TRAIT_LOGIC", uint256(50)));

        IMuseAICompanion.PersonalityTraits memory traits = IMuseAICompanion.PersonalityTraits({
            creativity: creativity,
            wisdom: wisdom,
            humor: humor,
            empathy: empathy,
            logic: logic
        });

        console.log("=== Deploying New Companion ===");
        console.log("Factory:", factoryAddress);
        console.log("Token ID:", tokenId);
        console.log("Name:", companionName);
        console.log("");
        console.log("Traits:");
        console.log("  Creativity:", creativity);
        console.log("  Wisdom:", wisdom);
        console.log("  Humor:", humor);
        console.log("  Empathy:", empathy);
        console.log("  Logic:", logic);

        vm.startBroadcast(deployerPrivateKey);

        MuseAICompanionFactory factory = MuseAICompanionFactory(factoryAddress);
        address companionAddr = factory.deployCompanionWithName(tokenId, traits, companionName);

        vm.stopBroadcast();

        console.log("");
        console.log("=== Companion Deployed ===");
        console.log("Companion Address:", companionAddr);
        console.log("");
        console.log("View companion info:");
        console.log("  factory.getCompanionInfo(", tokenId, ")");
    }
}

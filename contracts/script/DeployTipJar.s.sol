// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "forge-std/Script.sol";
import "../src/TipJar.sol";

/**
 * @title DeployTipJar
 * @notice Deployment script for TipJar on Metis Hyperion Testnet
 *
 * Usage:
 *   forge script script/DeployTipJar.s.sol:DeployTipJar \
 *     --rpc-url https://hyperion-testnet.metisdevops.link \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast --legacy -vv
 *
 * Environment Variables:
 *   PRIVATE_KEY       - Deployer's private key
 *   MUSE_NFT_ADDRESS  - Address of deployed MuseAI NFT contract
 *   PLATFORM_WALLET   - Wallet to receive platform fees (optional, defaults to deployer)
 */
contract DeployTipJar is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address museNFT = vm.envAddress("MUSE_NFT_ADDRESS");
        
        // Platform wallet defaults to deployer if not specified
        address platformWallet;
        try vm.envAddress("PLATFORM_WALLET") returns (address addr) {
            platformWallet = addr;
        } catch {
            platformWallet = vm.addr(deployerPrivateKey);
        }

        console.log("=== TipJar Deployment ===");
        console.log("");
        console.log("Network: Metis Hyperion Testnet");
        console.log("Chain ID:", block.chainid);
        console.log("");
        console.log("Configuration:");
        console.log("  MuseAI NFT:", museNFT);
        console.log("  Platform Wallet:", platformWallet);
        console.log("  Creator Share: 90%");
        console.log("  Platform Share: 10%");
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy TipJar
        TipJar tipJar = new TipJar(museNFT, platformWallet);

        vm.stopBroadcast();

        console.log("=== Deployment Complete ===");
        console.log("");
        console.log("TipJar deployed at:");
        console.log(address(tipJar));
        console.log("");
        console.log("Owner:", tipJar.owner());
        console.log("MuseAI:", address(tipJar.museAI()));
        console.log("Platform Wallet:", tipJar.platformWallet());
        console.log("");
        console.log("=== Revenue Split ===");
        console.log("Creator Share:", tipJar.CREATOR_SHARE_BPS(), "bps (90%)");
        console.log("Platform Share:", tipJar.PLATFORM_SHARE_BPS(), "bps (10%)");
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Verify contract on explorer");
        console.log("2. Update frontend with TipJar contract address");
        console.log("3. Users can tip companions via: tipJar.tip(tokenId) or tipJar.tip(tokenId, message)");
        console.log("4. Creators withdraw via: tipJar.withdrawCreatorEarnings()");
    }
}

/**
 * @title UpdateTipJarPlatformWallet
 * @notice Update the platform wallet on an existing TipJar
 */
contract UpdateTipJarPlatformWallet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tipJarAddress = vm.envAddress("TIPJAR_ADDRESS");
        address newPlatformWallet = vm.envAddress("NEW_PLATFORM_WALLET");

        console.log("=== Updating TipJar Platform Wallet ===");
        console.log("TipJar:", tipJarAddress);
        console.log("New Platform Wallet:", newPlatformWallet);

        vm.startBroadcast(deployerPrivateKey);

        TipJar tipJar = TipJar(payable(tipJarAddress));
        tipJar.setPlatformWallet(newPlatformWallet);

        vm.stopBroadcast();

        console.log("Update complete!");
        console.log("Current Platform Wallet:", tipJar.platformWallet());
    }
}

/**
 * @title TipJarStats
 * @notice View TipJar statistics (read-only, no broadcast)
 */
contract TipJarStats is Script {
    function run() external view {
        address tipJarAddress = vm.envAddress("TIPJAR_ADDRESS");
        TipJar tipJar = TipJar(payable(tipJarAddress));

        (
            uint256 totalTips,
            uint256 platformFeesPending,
            uint256 platformFeesWithdrawn
        ) = tipJar.getStats();

        console.log("=== TipJar Statistics ===");
        console.log("TipJar Address:", tipJarAddress);
        console.log("");
        console.log("Total Tips Received:", totalTips);
        console.log("Platform Fees Pending:", platformFeesPending);
        console.log("Platform Fees Withdrawn:", platformFeesWithdrawn);
        console.log("");
        console.log("Platform Wallet:", tipJar.platformWallet());
        console.log("Owner:", tipJar.owner());
    }
}

/**
 * @title WithdrawPlatformFees
 * @notice Withdraw accumulated platform fees
 */
contract WithdrawPlatformFees is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address tipJarAddress = vm.envAddress("TIPJAR_ADDRESS");

        TipJar tipJar = TipJar(payable(tipJarAddress));

        uint256 pendingFees = tipJar.getPendingPlatformFees();
        console.log("=== Withdrawing Platform Fees ===");
        console.log("TipJar:", tipJarAddress);
        console.log("Pending Fees:", pendingFees);
        console.log("Destination:", tipJar.platformWallet());

        require(pendingFees > 0, "No fees to withdraw");

        vm.startBroadcast(deployerPrivateKey);

        tipJar.withdrawPlatformFees();

        vm.stopBroadcast();

        console.log("Withdrawal complete!");
    }
}

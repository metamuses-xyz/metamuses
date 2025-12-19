// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "forge-std/Test.sol";
import "../src/PluginMarketplace.sol";
import "../src/MuseAI.sol";

contract PluginMarketplaceTest is Test {
    PluginMarketplace public marketplace;
    MuseAI public museNFT;

    address public owner = address(this);
    address public platformWallet = address(0x1);
    address public creator = address(0x2);
    address public user = address(0x3);
    address public user2 = address(0x4);

    uint256 public constant PLUGIN_PRICE = 0.1 ether;
    uint256 public constant SUBSCRIPTION_DURATION = 30 days;
    uint256 public constant USAGE_QUOTA = 100;
    uint256 public constant TRIAL_DURATION = 7 days;

    function setUp() public {
        // Deploy MuseAI NFT contract
        museNFT = new MuseAI(
            "https://api.metamuses.io/metadata/",
            block.timestamp,
            block.timestamp + 365 days,
            owner
        );

        // Deploy PluginMarketplace
        marketplace = new PluginMarketplace(address(museNFT), platformWallet);

        // Mint NFTs to users
        museNFT.adminMint(user);
        museNFT.adminMint(user2);

        // Fund users
        vm.deal(user, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(creator, 1 ether);
    }

    // ============ Plugin Registration Tests ============

    function test_RegisterPlugin() public {
        vm.prank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Language Tutor",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.KNOWLEDGE
        );

        assertEq(pluginId, 1);

        IPluginMarketplace.Plugin memory plugin = marketplace.getPlugin(pluginId);
        assertEq(plugin.name, "Language Tutor");
        assertEq(plugin.creator, creator);
        assertEq(plugin.currentVersion, 1);
        assertTrue(plugin.active);
    }

    function test_RegisterPlugin_RevertEmptyName() public {
        vm.prank(creator);
        vm.expectRevert("Empty name");
        marketplace.registerPlugin("", "ipfs://metadata", "ipfs://wasm", IPluginMarketplace.Category.KNOWLEDGE);
    }

    function test_RegisterPlugin_RevertEmptyMetadata() public {
        vm.prank(creator);
        vm.expectRevert("Empty metadata URI");
        marketplace.registerPlugin("Test", "", "ipfs://wasm", IPluginMarketplace.Category.KNOWLEDGE);
    }

    function test_RegisterPlugin_RevertEmptyWasm() public {
        vm.prank(creator);
        vm.expectRevert("Empty WASM hash");
        marketplace.registerPlugin("Test", "ipfs://metadata", "", IPluginMarketplace.Category.KNOWLEDGE);
    }

    // ============ Listing Tests ============

    function test_CreateListing_Permanent() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Code Assistant",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.SKILLS
        );

        uint256 listingId = marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            PLUGIN_PRICE,
            0, // no quota
            0, // no duration
            0  // no trial
        );
        vm.stopPrank();

        assertEq(listingId, 0);

        IPluginMarketplace.PluginListing[] memory listings = marketplace.getPluginListings(pluginId);
        assertEq(listings.length, 1);
        assertEq(listings[0].price, PLUGIN_PRICE);
        assertEq(uint(listings[0].accessType), uint(IPluginMarketplace.AccessType.PERMANENT));
    }

    function test_CreateListing_Subscription() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Health Coach",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );

        uint256 listingId = marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.SUBSCRIPTION,
            PLUGIN_PRICE,
            0,
            SUBSCRIPTION_DURATION,
            TRIAL_DURATION
        );
        vm.stopPrank();

        IPluginMarketplace.PluginListing[] memory listings = marketplace.getPluginListings(pluginId);
        assertEq(listings[0].duration, SUBSCRIPTION_DURATION);
        assertEq(listings[0].trialDuration, TRIAL_DURATION);
    }

    function test_CreateListing_UsageBased() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Math Solver",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.SKILLS
        );

        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.USAGE_BASED,
            PLUGIN_PRICE,
            USAGE_QUOTA,
            0,
            0
        );
        vm.stopPrank();

        IPluginMarketplace.PluginListing[] memory listings = marketplace.getPluginListings(pluginId);
        assertEq(listings[0].usageQuota, USAGE_QUOTA);
    }

    function test_CreateListing_RevertNotCreator() public {
        vm.prank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Test Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );

        vm.prank(user);
        vm.expectRevert("Not plugin creator");
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            PLUGIN_PRICE,
            0,
            0,
            0
        );
    }

    function test_UpdateListing() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Test Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );

        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            PLUGIN_PRICE,
            0,
            0,
            0
        );

        marketplace.updateListing(pluginId, 0, 0.2 ether, false);
        vm.stopPrank();

        IPluginMarketplace.PluginListing[] memory listings = marketplace.getPluginListings(pluginId);
        assertEq(listings[0].price, 0.2 ether);
        assertFalse(listings[0].active);
    }

    // ============ Installation Tests ============

    function test_InstallPlugin_Permanent() public {
        // Setup plugin
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Language Tutor",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.KNOWLEDGE
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            PLUGIN_PRICE,
            0,
            0,
            0
        );
        vm.stopPrank();

        // Install
        uint256 museId = 0; // First NFT minted to user
        vm.prank(user);
        marketplace.installPlugin{value: PLUGIN_PRICE}(museId, pluginId, 0);

        // Verify
        assertTrue(marketplace.hasAccess(museId, pluginId));

        IPluginMarketplace.Installation memory installation = marketplace.getInstallation(museId, pluginId);
        assertEq(installation.pluginId, pluginId);
        assertTrue(installation.active);
        assertEq(uint(installation.accessType), uint(IPluginMarketplace.AccessType.PERMANENT));
    }

    function test_InstallPlugin_Subscription() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Health Coach",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.SUBSCRIPTION,
            PLUGIN_PRICE,
            0,
            SUBSCRIPTION_DURATION,
            0
        );
        vm.stopPrank();

        uint256 museId = 0;
        vm.prank(user);
        marketplace.installPlugin{value: PLUGIN_PRICE}(museId, pluginId, 0);

        IPluginMarketplace.Installation memory installation = marketplace.getInstallation(museId, pluginId);
        assertEq(installation.expiresAt, block.timestamp + SUBSCRIPTION_DURATION);
        assertTrue(marketplace.hasAccess(museId, pluginId));
    }

    function test_InstallPlugin_UsageBased() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Math Solver",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.SKILLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.USAGE_BASED,
            PLUGIN_PRICE,
            USAGE_QUOTA,
            0,
            0
        );
        vm.stopPrank();

        uint256 museId = 0;
        vm.prank(user);
        marketplace.installPlugin{value: PLUGIN_PRICE}(museId, pluginId, 0);

        IPluginMarketplace.Installation memory installation = marketplace.getInstallation(museId, pluginId);
        assertEq(installation.remainingQuota, USAGE_QUOTA);
    }

    function test_InstallPlugin_RevertNotMuseOwner() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Test Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            PLUGIN_PRICE,
            0,
            0,
            0
        );
        vm.stopPrank();

        // user2 trying to install on user's muse (token 0)
        vm.prank(user2);
        vm.expectRevert("Not muse owner");
        marketplace.installPlugin{value: PLUGIN_PRICE}(0, pluginId, 0);
    }

    function test_InstallPlugin_RevertInsufficientPayment() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Test Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            PLUGIN_PRICE,
            0,
            0,
            0
        );
        vm.stopPrank();

        vm.prank(user);
        vm.expectRevert("Insufficient payment");
        marketplace.installPlugin{value: 0.05 ether}(0, pluginId, 0);
    }

    // ============ Trial Tests ============

    function test_StartTrial() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Premium Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.SUBSCRIPTION,
            PLUGIN_PRICE,
            0,
            SUBSCRIPTION_DURATION,
            TRIAL_DURATION
        );
        vm.stopPrank();

        uint256 museId = 0;
        vm.prank(user);
        marketplace.startTrial(museId, pluginId, 0);

        IPluginMarketplace.Installation memory installation = marketplace.getInstallation(museId, pluginId);
        assertEq(installation.trialEndsAt, block.timestamp + TRIAL_DURATION);
        assertTrue(marketplace.hasAccess(museId, pluginId));
    }

    function test_StartTrial_ExpireAfterDuration() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Premium Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.SUBSCRIPTION,
            PLUGIN_PRICE,
            0,
            SUBSCRIPTION_DURATION,
            TRIAL_DURATION
        );
        vm.stopPrank();

        uint256 museId = 0;
        vm.prank(user);
        marketplace.startTrial(museId, pluginId, 0);

        // Fast forward past trial
        vm.warp(block.timestamp + TRIAL_DURATION + 1);

        assertFalse(marketplace.hasAccess(museId, pluginId));
    }

    function test_StartTrial_RevertNoTrialAvailable() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "No Trial Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            PLUGIN_PRICE,
            0,
            0,
            0 // No trial
        );
        vm.stopPrank();

        vm.prank(user);
        vm.expectRevert("No trial available");
        marketplace.startTrial(0, pluginId, 0);
    }

    // ============ Version Tests ============

    function test_PublishVersion() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Evolving Plugin",
            "ipfs://metadata",
            "ipfs://wasm-v1",
            IPluginMarketplace.Category.TOOLS
        );

        uint256 newVersion = marketplace.publishVersion(
            pluginId,
            "ipfs://wasm-v2",
            "Added new features"
        );
        vm.stopPrank();

        assertEq(newVersion, 2);

        IPluginMarketplace.Plugin memory plugin = marketplace.getPlugin(pluginId);
        assertEq(plugin.currentVersion, 2);
        assertEq(plugin.wasmHash, "ipfs://wasm-v2");

        IPluginMarketplace.PluginVersion memory version = marketplace.getPluginVersion(pluginId, 2);
        assertEq(version.wasmHash, "ipfs://wasm-v2");
        assertEq(version.changelog, "Added new features");
    }

    function test_UpgradePlugin() public {
        // Setup and install
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Upgradeable Plugin",
            "ipfs://metadata",
            "ipfs://wasm-v1",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            PLUGIN_PRICE,
            0,
            0,
            0
        );
        vm.stopPrank();

        uint256 museId = 0;
        vm.prank(user);
        marketplace.installPlugin{value: PLUGIN_PRICE}(museId, pluginId, 0);

        // Check initial version
        IPluginMarketplace.Installation memory installBefore = marketplace.getInstallation(museId, pluginId);
        assertEq(installBefore.version, 1);

        // Publish new version
        vm.prank(creator);
        marketplace.publishVersion(pluginId, "ipfs://wasm-v2", "Bug fixes");

        // Upgrade
        vm.prank(user);
        marketplace.upgradePlugin(museId, pluginId);

        IPluginMarketplace.Installation memory installAfter = marketplace.getInstallation(museId, pluginId);
        assertEq(installAfter.version, 2);
    }

    // ============ Usage Tracking Tests ============

    function test_RecordUsage_UsageBased() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Usage Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.SKILLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.USAGE_BASED,
            PLUGIN_PRICE,
            10, // Only 10 uses
            0,
            0
        );
        vm.stopPrank();

        uint256 museId = 0;
        vm.prank(user);
        marketplace.installPlugin{value: PLUGIN_PRICE}(museId, pluginId, 0);

        // Record usage 9 times
        for (uint i = 0; i < 9; i++) {
            marketplace.recordUsage(museId, pluginId);
        }

        IPluginMarketplace.Installation memory installation = marketplace.getInstallation(museId, pluginId);
        assertEq(installation.remainingQuota, 1);
        assertTrue(marketplace.hasAccess(museId, pluginId));

        // Last usage
        marketplace.recordUsage(museId, pluginId);

        installation = marketplace.getInstallation(museId, pluginId);
        assertEq(installation.remainingQuota, 0);
        assertFalse(marketplace.hasAccess(museId, pluginId));
    }

    function test_RecordUsage_SubscriptionExpired() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Sub Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.SUBSCRIPTION,
            PLUGIN_PRICE,
            0,
            1 days,
            0
        );
        vm.stopPrank();

        uint256 museId = 0;
        vm.prank(user);
        marketplace.installPlugin{value: PLUGIN_PRICE}(museId, pluginId, 0);

        // Fast forward past subscription
        vm.warp(block.timestamp + 2 days);

        vm.expectRevert("Subscription expired");
        marketplace.recordUsage(museId, pluginId);
    }

    // ============ Renewal & Quota Purchase Tests ============

    function test_RenewSubscription() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Sub Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.SUBSCRIPTION,
            PLUGIN_PRICE,
            0,
            SUBSCRIPTION_DURATION,
            0
        );
        vm.stopPrank();

        uint256 museId = 0;
        vm.startPrank(user);
        marketplace.installPlugin{value: PLUGIN_PRICE}(museId, pluginId, 0);

        uint256 initialExpiry = marketplace.getInstallation(museId, pluginId).expiresAt;

        // Renew
        marketplace.renewSubscription{value: PLUGIN_PRICE}(museId, pluginId, 0);
        vm.stopPrank();

        uint256 newExpiry = marketplace.getInstallation(museId, pluginId).expiresAt;
        assertEq(newExpiry, initialExpiry + SUBSCRIPTION_DURATION);
    }

    function test_PurchaseQuota() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Usage Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.SKILLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.USAGE_BASED,
            PLUGIN_PRICE,
            USAGE_QUOTA,
            0,
            0
        );
        vm.stopPrank();

        uint256 museId = 0;
        vm.startPrank(user);
        marketplace.installPlugin{value: PLUGIN_PRICE}(museId, pluginId, 0);

        uint256 initialQuota = marketplace.getInstallation(museId, pluginId).remainingQuota;

        // Purchase more quota
        marketplace.purchaseQuota{value: PLUGIN_PRICE}(museId, pluginId, 0);
        vm.stopPrank();

        uint256 newQuota = marketplace.getInstallation(museId, pluginId).remainingQuota;
        assertEq(newQuota, initialQuota + USAGE_QUOTA);
    }

    // ============ Rating Tests ============

    function test_RatePlugin() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Rated Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            PLUGIN_PRICE,
            0,
            0,
            0
        );
        vm.stopPrank();

        // Install first
        vm.prank(user);
        marketplace.installPlugin{value: PLUGIN_PRICE}(0, pluginId, 0);

        // Rate
        vm.prank(user);
        marketplace.ratePlugin(pluginId, 5);

        IPluginMarketplace.Plugin memory plugin = marketplace.getPlugin(pluginId);
        assertEq(plugin.rating, 500); // 5 * 100
        assertEq(plugin.ratingCount, 1);
    }

    function test_RatePlugin_RevertInvalidRating() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Test Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        vm.stopPrank();

        vm.prank(user);
        vm.expectRevert("Rating must be 1-5");
        marketplace.ratePlugin(pluginId, 6);
    }

    // ============ Discovery Tests ============

    function test_GetPluginsByCategory() public {
        vm.startPrank(creator);

        // Register plugins in different categories
        marketplace.registerPlugin("Knowledge 1", "ipfs://1", "ipfs://w1", IPluginMarketplace.Category.KNOWLEDGE);
        marketplace.registerPlugin("Skills 1", "ipfs://2", "ipfs://w2", IPluginMarketplace.Category.SKILLS);
        marketplace.registerPlugin("Knowledge 2", "ipfs://3", "ipfs://w3", IPluginMarketplace.Category.KNOWLEDGE);
        marketplace.registerPlugin("Tools 1", "ipfs://4", "ipfs://w4", IPluginMarketplace.Category.TOOLS);

        vm.stopPrank();

        uint256[] memory knowledgePlugins = marketplace.getPluginsByCategory(IPluginMarketplace.Category.KNOWLEDGE);
        assertEq(knowledgePlugins.length, 2);

        uint256[] memory skillsPlugins = marketplace.getPluginsByCategory(IPluginMarketplace.Category.SKILLS);
        assertEq(skillsPlugins.length, 1);
    }

    function test_GetCreatorPlugins() public {
        vm.startPrank(creator);
        marketplace.registerPlugin("Plugin 1", "ipfs://1", "ipfs://w1", IPluginMarketplace.Category.TOOLS);
        marketplace.registerPlugin("Plugin 2", "ipfs://2", "ipfs://w2", IPluginMarketplace.Category.SKILLS);
        vm.stopPrank();

        uint256[] memory creatorPluginsList = marketplace.getCreatorPlugins(creator);
        assertEq(creatorPluginsList.length, 2);
    }

    function test_GetMusePlugins() public {
        vm.startPrank(creator);
        uint256 plugin1 = marketplace.registerPlugin("Plugin 1", "ipfs://1", "ipfs://w1", IPluginMarketplace.Category.TOOLS);
        marketplace.createListing(plugin1, IPluginMarketplace.AccessType.PERMANENT, PLUGIN_PRICE, 0, 0, 0);

        uint256 plugin2 = marketplace.registerPlugin("Plugin 2", "ipfs://2", "ipfs://w2", IPluginMarketplace.Category.SKILLS);
        marketplace.createListing(plugin2, IPluginMarketplace.AccessType.PERMANENT, PLUGIN_PRICE, 0, 0, 0);
        vm.stopPrank();

        uint256 museId = 0;
        vm.startPrank(user);
        marketplace.installPlugin{value: PLUGIN_PRICE}(museId, plugin1, 0);
        marketplace.installPlugin{value: PLUGIN_PRICE}(museId, plugin2, 0);
        vm.stopPrank();

        uint256[] memory musePlugins = marketplace.getMusePlugins(museId);
        assertEq(musePlugins.length, 2);
    }

    // ============ Earnings Tests ============

    function test_CreatorEarnings() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Paid Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            1 ether,
            0,
            0,
            0
        );
        vm.stopPrank();

        // User buys plugin
        vm.prank(user);
        marketplace.installPlugin{value: 1 ether}(0, pluginId, 0);

        // Check earnings (97.5% after 2.5% platform fee)
        uint256 expectedEarnings = (1 ether * 9750) / 10000;
        assertEq(marketplace.getCreatorEarnings(creator), expectedEarnings);
    }

    function test_WithdrawEarnings() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Paid Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            1 ether,
            0,
            0,
            0
        );
        vm.stopPrank();

        vm.prank(user);
        marketplace.installPlugin{value: 1 ether}(0, pluginId, 0);

        uint256 creatorBalanceBefore = creator.balance;

        vm.prank(creator);
        marketplace.withdrawEarnings();

        uint256 expectedEarnings = (1 ether * 9750) / 10000;
        assertEq(creator.balance, creatorBalanceBefore + expectedEarnings);
        assertEq(marketplace.getCreatorEarnings(creator), 0);
    }

    // ============ Admin Tests ============

    function test_SetPlatformFee() public {
        marketplace.setPlatformFee(500); // 5%
        assertEq(marketplace.platformFee(), 500);
    }

    function test_SetPlatformFee_RevertTooHigh() public {
        vm.expectRevert("Fee too high");
        marketplace.setPlatformFee(1500); // 15%
    }

    function test_DeactivatePlugin() public {
        vm.prank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Test Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );

        vm.prank(creator);
        marketplace.deactivatePlugin(pluginId);

        IPluginMarketplace.Plugin memory plugin = marketplace.getPlugin(pluginId);
        assertFalse(plugin.active);
    }

    function test_UninstallPlugin() public {
        vm.startPrank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Test Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );
        marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            PLUGIN_PRICE,
            0,
            0,
            0
        );
        vm.stopPrank();

        uint256 museId = 0;
        vm.startPrank(user);
        marketplace.installPlugin{value: PLUGIN_PRICE}(museId, pluginId, 0);

        assertTrue(marketplace.hasAccess(museId, pluginId));

        marketplace.uninstallPlugin(museId, pluginId);
        vm.stopPrank();

        assertFalse(marketplace.hasAccess(museId, pluginId));
    }
}

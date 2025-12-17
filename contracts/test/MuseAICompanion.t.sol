// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "forge-std/Test.sol";
import "../src/companions/MuseAICompanionFactory.sol";
import "../src/companions/MuseAICompanion.sol";
import "../src/companions/IMuseAICompanion.sol";
import "../src/PluginMarketplace.sol";
import "../src/MuseAI.sol";

contract MuseAICompanionTest is Test {
    MuseAICompanionFactory public factory;
    MuseAI public museNFT;
    PluginMarketplace public marketplace;

    address public owner = address(this);
    address public platformWallet = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public creator = address(0x4);

    IMuseAICompanion.PersonalityTraits public defaultTraits;

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

        // Deploy Factory
        factory = new MuseAICompanionFactory(address(museNFT), address(marketplace));

        // Set companion factory on marketplace so companions can call it
        marketplace.setCompanionFactory(address(factory));

        // Mint NFTs to users
        museNFT.adminMint(user1); // Token 0
        museNFT.adminMint(user1); // Token 1
        museNFT.adminMint(user2); // Token 2

        // Fund users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(creator, 1 ether);

        // Default personality traits
        defaultTraits = IMuseAICompanion.PersonalityTraits({
            creativity: 75,
            wisdom: 60,
            humor: 80,
            empathy: 90,
            logic: 55
        });
    }

    // ============ Factory Deployment Tests ============

    function test_FactoryDeployment() public view {
        assertEq(factory.museAI(), address(museNFT));
        assertEq(factory.pluginMarketplace(), address(marketplace));
        assertEq(factory.totalCompanions(), 0);
        assertEq(factory.owner(), owner);
    }

    function test_FactoryDeployment_RevertZeroMuseAI() public {
        vm.expectRevert("Invalid MuseAI address");
        new MuseAICompanionFactory(address(0), address(marketplace));
    }

    // ============ Companion Creation Tests ============

    function test_DeployCompanion() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        assertTrue(companionAddr != address(0));
        assertEq(factory.totalCompanions(), 1);
        assertEq(factory.getCompanion(0), companionAddr);
        assertTrue(factory.hasCompanion(0));

        // Verify companion state
        MuseAICompanion companion = MuseAICompanion(payable(companionAddr));
        assertEq(companion.tokenId(), 0);
        assertEq(companion.owner(), user1);
        assertEq(companion.museAI(), address(museNFT));
        assertEq(companion.pluginMarketplace(), address(marketplace));
    }

    function test_DeployCompanionWithName() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanionWithName(0, defaultTraits, "MyCompanion");

        MuseAICompanion companion = MuseAICompanion(payable(companionAddr));
        assertEq(companion.name(), "MyCompanion");
    }

    function test_DeployCompanion_RevertNotOwner() public {
        vm.prank(user2);
        vm.expectRevert("Not token owner");
        factory.deployCompanion(0, defaultTraits);
    }

    function test_DeployCompanion_RevertAlreadyExists() public {
        vm.prank(user1);
        factory.deployCompanion(0, defaultTraits);

        vm.prank(user1);
        vm.expectRevert("Companion already exists");
        factory.deployCompanion(0, defaultTraits);
    }

    function test_DeployCompanion_RevertInvalidTraits() public {
        IMuseAICompanion.PersonalityTraits memory invalidTraits = IMuseAICompanion.PersonalityTraits({
            creativity: 101, // Invalid
            wisdom: 60,
            humor: 80,
            empathy: 90,
            logic: 55
        });

        vm.prank(user1);
        vm.expectRevert("Creativity must be 0-100");
        factory.deployCompanion(0, invalidTraits);
    }

    function test_DeployMultipleCompanions() public {
        vm.startPrank(user1);
        address companion0 = factory.deployCompanion(0, defaultTraits);
        address companion1 = factory.deployCompanion(1, defaultTraits);
        vm.stopPrank();

        assertEq(factory.totalCompanions(), 2);
        assertEq(factory.getCompanion(0), companion0);
        assertEq(factory.getCompanion(1), companion1);
        assertTrue(companion0 != companion1);
    }

    // ============ Personality Tests ============

    function test_GetPersonality() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        IMuseAICompanion.PersonalityTraits memory traits = IMuseAICompanion(companionAddr).getPersonality();
        assertEq(traits.creativity, 75);
        assertEq(traits.wisdom, 60);
        assertEq(traits.humor, 80);
        assertEq(traits.empathy, 90);
        assertEq(traits.logic, 55);
    }

    function test_UpdatePersonality() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        IMuseAICompanion.PersonalityTraits memory newTraits = IMuseAICompanion.PersonalityTraits({
            creativity: 50,
            wisdom: 50,
            humor: 50,
            empathy: 50,
            logic: 50
        });

        vm.prank(user1);
        IMuseAICompanion(companionAddr).updatePersonality(newTraits);

        IMuseAICompanion.PersonalityTraits memory updatedTraits = IMuseAICompanion(companionAddr).getPersonality();
        assertEq(updatedTraits.creativity, 50);
        assertEq(updatedTraits.wisdom, 50);
    }

    function test_UpdatePersonality_RevertNotOwner() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        vm.prank(user2);
        vm.expectRevert("Not companion owner");
        IMuseAICompanion(companionAddr).updatePersonality(defaultTraits);
    }

    function test_UpdatePersonality_RevertInvalidTraits() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        IMuseAICompanion.PersonalityTraits memory invalidTraits = IMuseAICompanion.PersonalityTraits({
            creativity: 50,
            wisdom: 150, // Invalid
            humor: 50,
            empathy: 50,
            logic: 50
        });

        vm.prank(user1);
        vm.expectRevert("Wisdom must be 0-100");
        IMuseAICompanion(companionAddr).updatePersonality(invalidTraits);
    }

    // ============ Name Tests ============

    function test_SetName() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        vm.prank(user1);
        IMuseAICompanion(companionAddr).setName("NewName");

        assertEq(MuseAICompanion(payable(companionAddr)).name(), "NewName");
    }

    function test_SetName_RevertNotOwner() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        vm.prank(user2);
        vm.expectRevert("Not companion owner");
        IMuseAICompanion(companionAddr).setName("Hacked");
    }

    function test_SetName_RevertTooLong() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        // 65 character name (max is 64)
        string memory longName = "12345678901234567890123456789012345678901234567890123456789012345";

        vm.prank(user1);
        vm.expectRevert("Name too long");
        IMuseAICompanion(companionAddr).setName(longName);
    }

    // ============ Auto-Follow Ownership Tests ============

    function test_OwnershipFollowsNFT() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        assertEq(IMuseAICompanion(companionAddr).owner(), user1);

        // Transfer NFT
        vm.prank(user1);
        museNFT.transferFrom(user1, user2, 0);

        // Companion ownership automatically follows
        assertEq(IMuseAICompanion(companionAddr).owner(), user2);
    }

    function test_NewOwnerCanManageCompanion() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        // Transfer NFT to user2
        vm.prank(user1);
        museNFT.transferFrom(user1, user2, 0);

        // user1 can no longer update personality
        vm.prank(user1);
        vm.expectRevert("Not companion owner");
        IMuseAICompanion(companionAddr).updatePersonality(defaultTraits);

        // user2 can update personality
        IMuseAICompanion.PersonalityTraits memory newTraits = IMuseAICompanion.PersonalityTraits({
            creativity: 100,
            wisdom: 100,
            humor: 100,
            empathy: 100,
            logic: 100
        });

        vm.prank(user2);
        IMuseAICompanion(companionAddr).updatePersonality(newTraits);

        IMuseAICompanion.PersonalityTraits memory updatedTraits = IMuseAICompanion(companionAddr).getPersonality();
        assertEq(updatedTraits.creativity, 100);
    }

    // ============ Plugin Management Tests ============

    function test_HasPlugin_NoMarketplace() public {
        // Deploy factory without marketplace
        MuseAICompanionFactory factoryNoMarket = new MuseAICompanionFactory(address(museNFT), address(0));

        vm.prank(user1);
        address companionAddr = factoryNoMarket.deployCompanion(0, defaultTraits);

        // hasPlugin returns false when no marketplace
        assertFalse(IMuseAICompanion(companionAddr).hasPlugin(1));
    }

    function test_InstallPlugin() public {
        // Register a plugin first
        vm.prank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Test Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );

        vm.prank(creator);
        uint256 listingId = marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            0.1 ether,
            0,
            0,
            0
        );

        // Create companion
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        // Install plugin via companion
        vm.prank(user1);
        IMuseAICompanion(companionAddr).installPlugin{value: 0.1 ether}(pluginId, listingId);

        // Verify plugin is installed
        assertTrue(IMuseAICompanion(companionAddr).hasPlugin(pluginId));

        uint256[] memory installedPlugins = IMuseAICompanion(companionAddr).getInstalledPlugins();
        assertEq(installedPlugins.length, 1);
        assertEq(installedPlugins[0], pluginId);
    }

    function test_InstallPlugin_RevertNotOwner() public {
        vm.prank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Test Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );

        vm.prank(creator);
        marketplace.createListing(pluginId, IPluginMarketplace.AccessType.PERMANENT, 0.1 ether, 0, 0, 0);

        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        vm.prank(user2);
        vm.expectRevert("Not companion owner");
        IMuseAICompanion(companionAddr).installPlugin{value: 0.1 ether}(pluginId, 0);
    }

    function test_UninstallPlugin() public {
        vm.prank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Test Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );

        vm.prank(creator);
        uint256 listingId = marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            0.1 ether,
            0,
            0,
            0
        );

        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        vm.prank(user1);
        IMuseAICompanion(companionAddr).installPlugin{value: 0.1 ether}(pluginId, listingId);

        // Uninstall
        vm.prank(user1);
        IMuseAICompanion(companionAddr).uninstallPlugin(pluginId);

        // Local tracking removed
        uint256[] memory installedPlugins = IMuseAICompanion(companionAddr).getInstalledPlugins();
        assertEq(installedPlugins.length, 0);

        // But marketplace access still exists (permanent purchase)
        assertTrue(IMuseAICompanion(companionAddr).hasPlugin(pluginId));
    }

    function test_StartTrial() public {
        vm.prank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Trial Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.KNOWLEDGE
        );

        vm.prank(creator);
        uint256 listingId = marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.SUBSCRIPTION,
            0.05 ether,
            0,
            30 days,
            7 days // Trial enabled
        );

        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        vm.prank(user1);
        IMuseAICompanion(companionAddr).startTrial(pluginId, listingId);

        assertTrue(IMuseAICompanion(companionAddr).hasPlugin(pluginId));
    }

    // ============ View Functions Tests ============

    function test_GetInfo() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanionWithName(0, defaultTraits, "TestCompanion");

        (
            uint256 tokenId,
            address companionOwner,
            string memory companionName,
            IMuseAICompanion.PersonalityTraits memory personality,
            uint256 pluginCount,
            uint256 createdAt
        ) = IMuseAICompanion(companionAddr).getInfo();

        assertEq(tokenId, 0);
        assertEq(companionOwner, user1);
        assertEq(companionName, "TestCompanion");
        assertEq(personality.creativity, 75);
        assertEq(pluginCount, 0);
        assertTrue(createdAt > 0);
    }

    function test_GetCompanionsByOwner() public {
        vm.prank(user1);
        factory.deployCompanion(0, defaultTraits);

        vm.prank(user1);
        factory.deployCompanion(1, defaultTraits);

        address[] memory user1Companions = factory.getCompanionsByOwner(user1);
        assertEq(user1Companions.length, 2);

        address[] memory user2Companions = factory.getCompanionsByOwner(user2);
        assertEq(user2Companions.length, 0);
    }

    function test_GetCompanionInfo() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        (
            bool exists,
            address addr,
            address companionOwner,
            IMuseAICompanion.PersonalityTraits memory personality
        ) = factory.getCompanionInfo(0);

        assertTrue(exists);
        assertEq(addr, companionAddr);
        assertEq(companionOwner, user1);
        assertEq(personality.creativity, 75);
    }

    function test_GetCompanionInfo_NonExistent() public view {
        (
            bool exists,
            address addr,
            address companionOwner,
            IMuseAICompanion.PersonalityTraits memory personality
        ) = factory.getCompanionInfo(999);

        assertFalse(exists);
        assertEq(addr, address(0));
        assertEq(companionOwner, address(0));
        assertEq(personality.creativity, 0);
    }

    function test_GetOwnedTokensWithCompanions() public {
        vm.prank(user1);
        factory.deployCompanion(0, defaultTraits);

        // Don't create companion for token 1

        (uint256[] memory tokenIds, address[] memory addresses) = factory.getOwnedTokensWithCompanions(user1);

        assertEq(tokenIds.length, 1);
        assertEq(tokenIds[0], 0);
        assertEq(addresses.length, 1);
        assertTrue(addresses[0] != address(0));
    }

    function test_GetCompanionByIndex() public {
        vm.prank(user1);
        address companion0 = factory.deployCompanion(0, defaultTraits);

        vm.prank(user1);
        address companion1 = factory.deployCompanion(1, defaultTraits);

        assertEq(factory.getCompanionByIndex(0), companion0);
        assertEq(factory.getCompanionByIndex(1), companion1);
    }

    function test_GetCompanionByIndex_RevertOutOfBounds() public {
        vm.expectRevert("Index out of bounds");
        factory.getCompanionByIndex(0);
    }

    // ============ Admin Functions Tests ============

    function test_SetPluginMarketplace() public {
        address newMarketplace = address(0x999);

        factory.setPluginMarketplace(newMarketplace);

        assertEq(factory.pluginMarketplace(), newMarketplace);
    }

    function test_SetPluginMarketplace_RevertNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        factory.setPluginMarketplace(address(0x999));
    }

    function test_UpdateCompanionMarketplace() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        address newMarketplace = address(0x999);
        factory.updateCompanionMarketplace(0, newMarketplace);

        assertEq(MuseAICompanion(payable(companionAddr)).pluginMarketplace(), newMarketplace);
    }

    function test_UpdateCompanionMarketplace_RevertNotOwner() public {
        vm.prank(user1);
        factory.deployCompanion(0, defaultTraits);

        vm.prank(user1);
        vm.expectRevert();
        factory.updateCompanionMarketplace(0, address(0x999));
    }

    function test_UpdateCompanionMarketplace_RevertNoCompanion() public {
        vm.expectRevert("Companion does not exist");
        factory.updateCompanionMarketplace(999, address(0x999));
    }

    function test_BatchUpdateCompanionMarketplaces() public {
        vm.prank(user1);
        address companion0 = factory.deployCompanion(0, defaultTraits);

        vm.prank(user1);
        address companion1 = factory.deployCompanion(1, defaultTraits);

        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 0;
        tokenIds[1] = 1;

        address newMarketplace = address(0x999);
        factory.batchUpdateCompanionMarketplaces(tokenIds, newMarketplace);

        assertEq(MuseAICompanion(payable(companion0)).pluginMarketplace(), newMarketplace);
        assertEq(MuseAICompanion(payable(companion1)).pluginMarketplace(), newMarketplace);
    }

    function test_SetMuseAI() public {
        address newMuseAI = address(0x888);

        factory.setMuseAI(newMuseAI);

        assertEq(factory.museAI(), newMuseAI);
    }

    function test_SetMuseAI_RevertZeroAddress() public {
        vm.expectRevert("Invalid address");
        factory.setMuseAI(address(0));
    }

    function test_SetMuseAI_RevertNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        factory.setMuseAI(address(0x888));
    }

    // ============ ETH Management Tests ============

    function test_WithdrawETH() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        // Send ETH to companion
        vm.deal(companionAddr, 1 ether);

        uint256 balanceBefore = user1.balance;

        vm.prank(user1);
        MuseAICompanion(payable(companionAddr)).withdrawETH();

        assertEq(user1.balance, balanceBefore + 1 ether);
        assertEq(companionAddr.balance, 0);
    }

    function test_WithdrawETH_RevertNotOwner() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        vm.deal(companionAddr, 1 ether);

        vm.prank(user2);
        vm.expectRevert("Not companion owner");
        MuseAICompanion(payable(companionAddr)).withdrawETH();
    }

    function test_WithdrawETH_RevertNoBalance() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        vm.prank(user1);
        vm.expectRevert("No ETH to withdraw");
        MuseAICompanion(payable(companionAddr)).withdrawETH();
    }

    function test_ReceiveETH() public {
        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        // Send ETH directly
        (bool success,) = companionAddr.call{value: 0.5 ether}("");
        assertTrue(success);
        assertEq(companionAddr.balance, 0.5 ether);
    }

    // ============ Fuzz Tests ============

    function testFuzz_PersonalityTraits(
        uint8 creativity,
        uint8 wisdom,
        uint8 humor,
        uint8 empathy,
        uint8 logic
    ) public {
        vm.assume(creativity <= 100);
        vm.assume(wisdom <= 100);
        vm.assume(humor <= 100);
        vm.assume(empathy <= 100);
        vm.assume(logic <= 100);

        IMuseAICompanion.PersonalityTraits memory traits = IMuseAICompanion.PersonalityTraits({
            creativity: creativity,
            wisdom: wisdom,
            humor: humor,
            empathy: empathy,
            logic: logic
        });

        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, traits);

        IMuseAICompanion.PersonalityTraits memory storedTraits = IMuseAICompanion(companionAddr).getPersonality();

        assertEq(storedTraits.creativity, creativity);
        assertEq(storedTraits.wisdom, wisdom);
        assertEq(storedTraits.humor, humor);
        assertEq(storedTraits.empathy, empathy);
        assertEq(storedTraits.logic, logic);
    }

    function testFuzz_InvalidTrait(uint8 invalidValue) public {
        vm.assume(invalidValue > 100);

        IMuseAICompanion.PersonalityTraits memory traits = IMuseAICompanion.PersonalityTraits({
            creativity: invalidValue,
            wisdom: 50,
            humor: 50,
            empathy: 50,
            logic: 50
        });

        vm.prank(user1);
        vm.expectRevert("Creativity must be 0-100");
        factory.deployCompanion(0, traits);
    }

    // ============ Active Plugin Count Tests ============

    function test_GetActivePluginCount() public {
        vm.prank(creator);
        uint256 pluginId = marketplace.registerPlugin(
            "Test Plugin",
            "ipfs://metadata",
            "ipfs://wasm",
            IPluginMarketplace.Category.TOOLS
        );

        vm.prank(creator);
        uint256 listingId = marketplace.createListing(
            pluginId,
            IPluginMarketplace.AccessType.PERMANENT,
            0.1 ether,
            0,
            0,
            0
        );

        vm.prank(user1);
        address companionAddr = factory.deployCompanion(0, defaultTraits);

        // No plugins yet
        assertEq(MuseAICompanion(payable(companionAddr)).getActivePluginCount(), 0);

        // Install plugin
        vm.prank(user1);
        IMuseAICompanion(companionAddr).installPlugin{value: 0.1 ether}(pluginId, listingId);

        assertEq(MuseAICompanion(payable(companionAddr)).getActivePluginCount(), 1);
    }

    function test_GetActivePluginCount_NoMarketplace() public {
        MuseAICompanionFactory factoryNoMarket = new MuseAICompanionFactory(address(museNFT), address(0));

        vm.prank(user1);
        address companionAddr = factoryNoMarket.deployCompanion(0, defaultTraits);

        assertEq(MuseAICompanion(payable(companionAddr)).getActivePluginCount(), 0);
    }
}

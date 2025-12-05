// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {Test} from "forge-std/Test.sol";
import {MuseAI} from "../src/MuseAI.sol";

contract MuseAITest is Test {
    MuseAI public museai;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public backendMinter = address(999);

    string public baseURI = "https://api.metamuses.io/metadata/";
    uint256 public startTime;
    uint256 public endTime;

    function setUp() public {
        startTime = block.timestamp;
        endTime = block.timestamp + 30 days;

        vm.prank(owner);
        museai = new MuseAI(baseURI, startTime, endTime, backendMinter);
    }

    function test_Deployment() public view {
        assertEq(museai.name(), "MetaMuses AI");
        assertEq(museai.symbol(), "MUSEAI");
        assertEq(museai.owner(), owner);
        assertEq(museai.mintStartTime(), startTime);
        assertEq(museai.mintEndTime(), endTime);
    }

    function test_AdminMint() public {
        vm.prank(owner);
        museai.adminMint(user1);

        assertEq(museai.balanceOf(user1), 1);
        assertEq(museai.ownerOf(0), user1);
        assertEq(museai.getCurrentTokenId(), 1);
        // Note: adminMint does NOT set hasMinted
        assertFalse(museai.hasMinted(user1));
    }

    function test_AdminMintOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        museai.adminMint(user1);
    }

    function test_BatchMint() public {
        vm.prank(owner);
        museai.batchMint(user1, 5);

        assertEq(museai.balanceOf(user1), 5);
        assertEq(museai.getCurrentTokenId(), 5);

        for (uint256 i = 0; i < 5; i++) {
            assertEq(museai.ownerOf(i), user1);
        }
    }

    function test_BatchMintOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        museai.batchMint(user1, 5);
    }

    function test_MaxSupply() public {
        // Mint 5000 NFTs
        for (uint256 i = 0; i < 100; i++) {
            vm.prank(owner);
            museai.batchMint(user1, 50);
        }

        assertEq(museai.getCurrentTokenId(), 5000);

        // Try to mint one more - should fail
        vm.prank(owner);
        vm.expectRevert("Max supply reached");
        museai.adminMint(user2);
    }

    function test_BatchMintExceedsSupply() public {
        vm.prank(owner);
        vm.expectRevert("Exceeds max supply");
        museai.batchMint(user1, 5001);
    }

    function test_AdminMintBypassesTimeRestrictions() public {
        // Create new contract with future start time
        uint256 futureStart = block.timestamp + 1 days;
        uint256 futureEnd = futureStart + 30 days;

        vm.prank(owner);
        MuseAI futureMuseAI = new MuseAI(baseURI, futureStart, futureEnd, backendMinter);

        // Admin can mint even before start time
        vm.prank(owner);
        futureMuseAI.adminMint(user1);

        assertEq(futureMuseAI.balanceOf(user1), 1);
    }

    function test_AdminMintAfterEndTime() public {
        // Fast forward past end time
        vm.warp(endTime + 1);

        // Admin can still mint after end time
        vm.prank(owner);
        museai.adminMint(user1);

        assertEq(museai.balanceOf(user1), 1);
    }

    function test_IsMintingActive() public view {
        assertTrue(museai.isMintingActive());
    }

    function test_IsMintingInactive() public {
        vm.warp(endTime + 1);
        assertFalse(museai.isMintingActive());
    }

    function test_SetBaseURI() public {
        string memory newBaseURI = "https://new-api.metamuses.io/metadata/";

        vm.prank(owner);
        museai.setBaseURI(newBaseURI);

        vm.prank(owner);
        museai.adminMint(user1);

        string memory expectedURI = string(abi.encodePacked(newBaseURI, "0.json"));
        assertEq(museai.tokenURI(0), expectedURI);
    }

    function test_SetBaseURIOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        museai.setBaseURI("https://malicious.com/");
    }

    function test_SetMintTimes() public {
        uint256 newStart = block.timestamp + 1 days;
        uint256 newEnd = newStart + 60 days;

        vm.prank(owner);
        museai.setMintTimes(newStart, newEnd);

        assertEq(museai.mintStartTime(), newStart);
        assertEq(museai.mintEndTime(), newEnd);
    }

    function test_SetMintTimesInvalidRange() public {
        uint256 newStart = block.timestamp + 2 days;
        uint256 newEnd = block.timestamp + 1 days; // End before start

        vm.prank(owner);
        vm.expectRevert("Invalid mint times");
        museai.setMintTimes(newStart, newEnd);
    }

    function test_SetMintTimesOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        museai.setMintTimes(block.timestamp, block.timestamp + 1 days);
    }

    function test_TokenURI() public {
        vm.prank(owner);
        museai.adminMint(user1);

        string memory expectedURI = string(abi.encodePacked(baseURI, "0.json"));
        assertEq(museai.tokenURI(0), expectedURI);
    }

    function test_TokenURINonexistent() public {
        vm.expectRevert();
        museai.tokenURI(0);
    }

    function test_TokensOfOwner() public {
        vm.prank(owner);
        museai.batchMint(user1, 5);

        uint256[] memory tokens = museai.tokensOfOwner(user1);
        assertEq(tokens.length, 5);

        for (uint256 i = 0; i < tokens.length; i++) {
            assertEq(tokens[i], i);
        }
    }

    function test_EnumerableFunctions() public {
        vm.prank(owner);
        museai.batchMint(user1, 3);

        vm.prank(owner);
        museai.batchMint(user2, 2);

        assertEq(museai.totalSupply(), 5);
        assertEq(museai.tokenByIndex(0), 0);
        assertEq(museai.tokenByIndex(4), 4);
        assertEq(museai.tokenOfOwnerByIndex(user1, 0), 0);
        assertEq(museai.tokenOfOwnerByIndex(user2, 1), 4);
    }

    function test_TransferNFT() public {
        vm.prank(owner);
        museai.adminMint(user1);

        vm.prank(user1);
        museai.transferFrom(user1, user2, 0);

        assertEq(museai.ownerOf(0), user2);
        assertEq(museai.balanceOf(user1), 0);
        assertEq(museai.balanceOf(user2), 1);
    }

    function test_AdminMintMultipleToSameAddress() public {
        // Admin can mint multiple NFTs to same address
        vm.prank(owner);
        museai.adminMint(user1);

        vm.prank(owner);
        museai.adminMint(user1);

        assertEq(museai.balanceOf(user1), 2);
        assertEq(museai.getCurrentTokenId(), 2);
        // hasMinted should still be false since adminMint doesn't set it
        assertFalse(museai.hasMinted(user1));
    }

    function testFuzz_MintMultiple(uint8 amount) public {
        vm.assume(amount > 0 && amount <= 100);

        vm.prank(owner);
        museai.batchMint(user1, amount);

        assertEq(museai.balanceOf(user1), amount);
        assertEq(museai.getCurrentTokenId(), amount);
    }
}

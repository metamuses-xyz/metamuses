// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MuseAI} from "../src/MuseAI.sol";

contract MuseAITest is Test {
    MuseAI public museai;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    string public baseURI = "https://api.metamuses.io/metadata/";
    uint256 public startTime;
    uint256 public endTime;

    function setUp() public {
        startTime = block.timestamp;
        endTime = block.timestamp + 30 days;

        vm.prank(owner);
        museai = new MuseAI(baseURI, startTime, endTime);
    }

    function test_Deployment() public view {
        assertEq(museai.name(), "MetaMuses AI");
        assertEq(museai.symbol(), "MUSEAI");
        assertEq(museai.owner(), owner);
        assertEq(museai.mintStartTime(), startTime);
        assertEq(museai.mintEndTime(), endTime);
    }

    function test_Mint() public {
        vm.prank(user1);
        museai.mint(user1);

        assertEq(museai.balanceOf(user1), 1);
        assertEq(museai.ownerOf(0), user1);
        assertEq(museai.getCurrentTokenId(), 1);
        assertTrue(museai.hasMinted(user1));
    }

    function test_MintOnlyOncePerWallet() public {
        vm.prank(user1);
        museai.mint(user1);

        // Try to mint again with same address
        vm.prank(user1);
        vm.expectRevert("Address has already minted");
        museai.mint(user1);
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
        vm.prank(user2);
        vm.expectRevert("Max supply reached");
        museai.mint(user2);
    }

    function test_BatchMintExceedsSupply() public {
        vm.prank(owner);
        vm.expectRevert("Exceeds max supply");
        museai.batchMint(user1, 5001);
    }

    function test_MintBeforeStartTime() public {
        // Create new contract with future start time
        uint256 futureStart = block.timestamp + 1 days;
        uint256 futureEnd = futureStart + 30 days;

        vm.prank(owner);
        MuseAI futureMuseAI = new MuseAI(baseURI, futureStart, futureEnd);

        vm.prank(user1);
        vm.expectRevert("Minting has not started yet");
        futureMuseAI.mint(user1);
    }

    function test_MintAfterEndTime() public {
        // Fast forward past end time
        vm.warp(endTime + 1);

        vm.prank(user1);
        vm.expectRevert("Minting has ended");
        museai.mint(user1);
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

        vm.prank(user1);
        museai.mint(user1);

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
        vm.prank(user1);
        museai.mint(user1);

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
        vm.prank(user1);
        museai.mint(user1);

        vm.prank(user1);
        museai.transferFrom(user1, user2, 0);

        assertEq(museai.ownerOf(0), user2);
        assertEq(museai.balanceOf(user1), 0);
        assertEq(museai.balanceOf(user2), 1);
    }

    function test_MultipleUsersMint() public {
        // User1 mints
        vm.prank(user1);
        museai.mint(user1);

        // User2 mints
        vm.prank(user2);
        museai.mint(user2);

        assertEq(museai.balanceOf(user1), 1);
        assertEq(museai.balanceOf(user2), 1);
        assertEq(museai.getCurrentTokenId(), 2);
        assertTrue(museai.hasMinted(user1));
        assertTrue(museai.hasMinted(user2));
    }

    function testFuzz_MintMultiple(uint8 amount) public {
        vm.assume(amount > 0 && amount <= 100);

        vm.prank(owner);
        museai.batchMint(user1, amount);

        assertEq(museai.balanceOf(user1), amount);
        assertEq(museai.getCurrentTokenId(), amount);
    }
}

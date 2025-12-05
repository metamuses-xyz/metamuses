// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {Script} from "forge-std/Script.sol";
import {MuseAI} from "../src/MuseAI.sol";
import {console} from "forge-std/console.sol";

contract DeployMuseAIGasless is Script {
    function run() external returns (MuseAI) {
        // Configuration
        string memory baseURI = vm.envString("BASE_URI");
        uint256 mintStartTime = vm.envUint("MINT_START_TIME");
        uint256 mintEndTime = vm.envUint("MINT_END_TIME");
        address backendMinter = vm.envAddress("BACKEND_MINTER");

        // Get deployer private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        MuseAI museai = new MuseAI(baseURI, mintStartTime, mintEndTime, backendMinter);

        vm.stopBroadcast();

        // Log deployment info
        console.log("========================================");
        console.log("   MuseAI Gasless Minting Deployed    ");
        console.log("========================================");
        console.log("Contract Address:", address(museai));
        console.log("Base URI:", baseURI);
        console.log("Mint Start Time:", mintStartTime);
        console.log("Mint End Time:", mintEndTime);
        console.log("Backend Minter:", backendMinter);
        console.log("Owner:", museai.owner());
        console.log("Chain ID:", block.chainid);
        console.log("Domain Separator:", vm.toString(museai.DOMAIN_SEPARATOR()));

        return museai;
    }
}

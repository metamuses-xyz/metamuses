// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {MuseAI} from "../src/MuseAI.sol";
import {console} from "forge-std/console.sol";

contract DeployMuseAI is Script {
    function run() external returns (MuseAI) {
        // Configuration
        string memory baseURI = vm.envString("BASE_URI");
        uint256 mintStartTime = vm.envUint("MINT_START_TIME");
        uint256 mintEndTime = vm.envUint("MINT_END_TIME");

        // Get deployer private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        MuseAI museai = new MuseAI(baseURI, mintStartTime, mintEndTime);

        vm.stopBroadcast();

        // Log deployment info
        console.log("MuseAI deployed to:", address(museai));
        console.log("Base URI:", baseURI);
        console.log("Mint Start Time:", mintStartTime);
        console.log("Mint End Time:", mintEndTime);
        console.log("Owner:", museai.owner());

        return museai;
    }
}

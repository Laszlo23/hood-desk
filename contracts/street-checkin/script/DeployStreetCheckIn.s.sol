// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {StreetCheckIn} from "../src/StreetCheckIn.sol";

/**
 * @title DeployStreetCheckIn
 * @notice Deployment script for the Hood Street check-in contract on Robinhood Chain 4663.
 *
 * Usage:
 *   forge script script/DeployStreetCheckIn.s.sol:DeployStreetCheckIn \
 *     --rpc-url robinhood \
 *     --broadcast \
 *     --verify
 *
 * Environment variables:
 *   PRIVATE_KEY - Deployer private key (never commit)
 *   RPC_URL - Robinhood Chain RPC (https://rpc.mainnet.chain.robinhood.com)
 *   ETHERSCAN_API_KEY - Blockscout API key (optional, for verification)
 */
contract DeployStreetCheckIn is Script {
    function run() external {
        console.log("Deploying StreetCheckIn to Robinhood Chain 4663");
        console.log("Deployer:", msg.sender);

        vm.startBroadcast();

        StreetCheckIn checkin = new StreetCheckIn();

        vm.stopBroadcast();

        console.log("StreetCheckIn deployed at:", address(checkin));
        console.log("Current day:", checkin.getCurrentDay());
        console.log("");
        console.log("Save this address to your frontend .env:");
        console.log("VITE_CHECKIN_CONTRACT=%s", address(checkin));
    }
}

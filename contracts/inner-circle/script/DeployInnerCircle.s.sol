// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {InnerCircleSBT} from "../src/InnerCircleSBT.sol";

/**
 * @title DeployInnerCircle
 * @notice Deployment script for the Hood Desk Inner Circle soulbound badge on Robinhood Chain 4663.
 *
 * Environment variables:
 *   PRIVATE_KEY - Deployer private key (never commit)
 *   RPC_URL - Robinhood Chain RPC
 *   INITIAL_OWNER - Contract owner (default: deployer)
 *   ONE_PER_ADDRESS - Restrict each wallet to one badge (default: true)
 */
contract DeployInnerCircle is Script {
    function run() external {
        address initialOwner = vm.envOr("INITIAL_OWNER", msg.sender);
        bool onePerAddress = vm.envOr("ONE_PER_ADDRESS", true);

        console.log("Deploying InnerCircleSBT to Robinhood Chain 4663");
        console.log("Owner:", initialOwner);
        console.log("One per address:", onePerAddress);

        vm.startBroadcast();

        InnerCircleSBT sbt = new InnerCircleSBT(initialOwner, onePerAddress);

        vm.stopBroadcast();

        console.log("InnerCircleSBT deployed at:", address(sbt));
        console.log("Name:", sbt.name());
        console.log("Symbol:", sbt.symbol());
        console.log("Total supply:", sbt.totalSupply());
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {NightTools} from "../src/NightTools.sol";

/**
 * @title DeployNightTools
 * @notice Deployment script for the Hood Street Night Tools 1/1 cosmetic soulbound badges on Robinhood Chain 4663.
 *
 * Environment variables:
 *   PRIVATE_KEY - Deployer private key (never commit)
 *   RPC_URL - Robinhood Chain RPC
 *   INITIAL_OWNER - Contract owner (desk/minter role, default: deployer)
 *   BASE_IMAGE_URI - Base URI for badge images (default: production URL)
 *
 * NOTE: This deployment is manual and intentionally NOT part of automated deployment.
 * Deploy is manual and later, not part of automated PR flow.
 */
contract DeployNightTools is Script {
    function run() external {
        address initialOwner = vm.envOr("INITIAL_OWNER", msg.sender);
        string memory baseImageURI = vm.envOr("BASE_IMAGE_URI", string("https://hoodstreet.example.com/images/night-tools/"));

        console.log("Deploying NightTools to Robinhood Chain 4663");
        console.log("Owner (desk/minter role):", initialOwner);
        console.log("Base image URI:", baseImageURI);

        vm.startBroadcast();

        NightTools nightTools = new NightTools(initialOwner, baseImageURI);

        vm.stopBroadcast();

        console.log("NightTools deployed at:", address(nightTools));
        console.log("Name:", nightTools.name());
        console.log("Symbol:", nightTools.symbol());
        console.log("Base image URI:", nightTools.baseImageURI());
        console.log("");
        console.log("Three 1/1 badges:");
        console.log("- Lantern (ID 0): First wallet with 7-day Vienna check-in streak");
        console.log("- Pick (ID 1): First wallet to dig with a neighbor");
        console.log("- Vein (ID 2): First check-in each Vienna night (requires Lantern)");
        console.log("");
        console.log("NOTE: Deploy is manual. No automated deployment in this PR.");
    }
}

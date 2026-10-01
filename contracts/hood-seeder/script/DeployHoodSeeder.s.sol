// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HoodSeeder} from "../src/HoodSeeder.sol";

/**
 * @title DeployHoodSeeder
 * @notice Deployment script for Hood Seeder NFT on Robinhood Chain 4663
 * 
 * Usage:
 *   source .env
 *   forge script script/DeployHoodSeeder.s.sol:DeployHoodSeeder \
 *     --rpc-url $RPC_URL \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     --verify
 * 
 * Environment variables:
 *   PRIVATE_KEY - Deployer private key (NEVER commit this)
 *   RPC_URL - Robinhood Chain RPC (default: https://rpc.mainnet.chain.robinhood.com)
 *   BASE_URI - Base URI for metadata (default: https://nft.example.com/hood-seeder/)
 *   ROYALTY_RECEIVER - Royalty receiver address (default: deployer)
 *   ROYALTY_FEE - Royalty fee in basis points (default: 500 = 5%)
 */
contract DeployHoodSeeder is Script {
    function run() external {
        // Read config from environment or use defaults
        string memory baseURI = vm.envOr(
            "BASE_URI",
            string("https://doghood.aibusiness.fun/nfts/hood-seeder/")
        );
        address royaltyReceiver = vm.envOr("ROYALTY_RECEIVER", msg.sender);
        uint96 royaltyFee = uint96(vm.envOr("ROYALTY_FEE", uint256(500))); // 5% default
        
        console.log("Deploying HoodSeeder to Robinhood Chain 4663");
        console.log("Deployer:", msg.sender);
        console.log("Base URI:", baseURI);
        console.log("Royalty receiver:", royaltyReceiver);
        console.log("Royalty fee (bps):", royaltyFee);
        
        vm.startBroadcast();
        
        HoodSeeder seeder = new HoodSeeder(
            "Hood Seeder",
            "HSEED",
            baseURI,
            royaltyReceiver,
            royaltyFee
        );
        
        vm.stopBroadcast();
        
        console.log("HoodSeeder deployed at:", address(seeder));
        console.log("Max supply:", seeder.MAX_SUPPLY());
        console.log("Total supply:", seeder.totalSupply());
        console.log("");
        console.log("Next steps:");
        console.log("1. Save contract address to .env as VITE_HOOD_SEEDER_NFT");
        console.log("2. Mint initial batch: cast send", address(seeder), '"batchMint(address,uint256)" <to> <amount> --rpc-url $RPC_URL --private-key $PRIVATE_KEY');
        console.log("3. Update metadata at", baseURI);
    }
}

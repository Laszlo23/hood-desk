// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {HoodSeedRail} from "../src/HoodSeedRail.sol";

contract DeployHoodSeedRail is Script {
    address constant WETH = 0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73;
    address constant HOOD = 0xC7749BCFDC8d06FC246be556f4EAD75Ac7E1320c;
    address constant POOL = 0xf27827ca8600E5c79b371F5B30e5a0e889bC7c44;
    address constant POSITION_MANAGER = 0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3;
    uint256 constant TOKEN_ID = 1359889;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        vm.startBroadcast(pk);
        HoodSeedRail rail = new HoodSeedRail(deployer, WETH, HOOD, POOL, POSITION_MANAGER, TOKEN_ID);
        vm.stopBroadcast();
        console.log("HoodSeedRail", address(rail));
    }
}

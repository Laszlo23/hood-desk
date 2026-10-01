// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {HoodCauses, HoodSeedRail} from "../src/HoodSeedRail.sol";

contract MockWeth {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function deposit() external payable {
        balanceOf[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        balanceOf[msg.sender] -= amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    receive() external payable {}
}

contract MockHood {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract MockPool {
    address public token0;
    address public token1;
    uint24 public fee = 10_000;
    uint160 public sqrtPriceX96 = 788534655574193559782435373403630;

    constructor(address weth_, address hood_) {
        token0 = weth_;
        token1 = hood_;
    }

    function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool) {
        return (sqrtPriceX96, 184121, 0, 1, 1, 102, true);
    }
}

interface INpmIncrease {
    struct IncreaseLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    function increaseLiquidity(IncreaseLiquidityParams calldata params)
        external
        payable
        returns (uint128 liquidity, uint256 amount0, uint256 amount1);
}

contract MockNpmPull is INpmIncrease {
    MockWeth public weth;
    MockHood public hood;
    address public approved;
    address public owner;
    uint256 public takeBps;

    constructor(MockWeth weth_, MockHood hood_, uint256 takeBps_) {
        weth = weth_;
        hood = hood_;
        owner = address(0xBEEF);
        takeBps = takeBps_;
    }

    function setApproved(address operator) external {
        approved = operator;
    }

    function ownerOf(uint256) external view returns (address) {
        return owner;
    }

    function getApproved(uint256) external view returns (address) {
        return approved;
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    function positions(uint256)
        external
        view
        returns (
            uint96,
            address,
            address,
            address,
            uint24,
            int24,
            int24,
            uint128,
            uint256,
            uint256,
            uint128,
            uint128
        )
    {
        return (0, address(0), address(weth), address(hood), 10_000, -887200, 887200, 0, 0, 0, 0, 0);
    }

    function increaseLiquidity(IncreaseLiquidityParams calldata params)
        external
        payable
        returns (uint128 liquidity, uint256 amount0, uint256 amount1)
    {
        amount0 = (params.amount0Desired * takeBps) / 10_000;
        amount1 = (params.amount1Desired * takeBps) / 10_000;
        require(amount0 >= params.amount0Min && amount1 >= params.amount1Min);
        weth.transferFrom(msg.sender, address(this), amount0);
        hood.transferFrom(msg.sender, address(this), amount1);
        liquidity = 1;
    }
}

contract HoodSeedRailTest is Test {
    uint160 constant SPOT = 788534655574193559782435373403630;
    uint256 constant HOOD_FOR_MILLI_ETH = 99056368568353179775858;

    MockWeth weth;
    MockHood hood;
    MockPool pool;
    MockNpmPull npm;
    HoodSeedRail rail;
    HoodCauses causes;
    address treasury = address(0xA11CE);

    function setUp() public {
        weth = new MockWeth();
        hood = new MockHood();
        pool = new MockPool(address(weth), address(hood));
        npm = new MockNpmPull(weth, hood, 10_000);
        causes = new HoodCauses(address(this));
        rail = new HoodSeedRail(address(this), address(weth), address(hood), address(pool), address(npm), 1359889, address(causes));
        rail.setTreasury(treasury);
        npm.setApproved(address(rail));
        hood.mint(treasury, 500_000_000 ether);
        vm.prank(treasury);
        hood.approve(address(rail), type(uint256).max);
        rail.setHoodBudget(500_000_000 ether);
    }

    function test_hoodForWeth_matches_pool_price() public view {
        assertEq(rail.hoodForWeth(0.001 ether, SPOT), HOOD_FOR_MILLI_ETH);
    }

    function test_big_deposit_uses_the_same_ratio() public view {
        uint256 small = rail.hoodForWeth(0.001 ether, SPOT);
        uint256 big = rail.hoodForWeth(10 ether, SPOT);
        assertApproxEqRel(big, small * 10_000, 1e8);
    }

    function test_seed_pairs_eth_and_keeps_two_percent_for_causes() public {
        uint256 treasuryBefore = hood.balanceOf(treasury);
        uint256 pooled = 0.00098 ether;
        uint256 hoodUsed = rail.hoodForWeth(pooled, SPOT) * 10_100 / 10_000;
        rail.seed{value: 0.001 ether}();
        assertEq(address(causes).balance, 0.00002 ether);
        assertEq(causes.totalReceived(), 0.00002 ether);
        assertEq(hood.balanceOf(treasury), treasuryBefore - hoodUsed);
        assertEq(address(rail).balance, 0);
        assertEq(weth.balanceOf(address(rail)), 0);
        assertEq(hood.balanceOf(address(rail)), 0);
    }

    function test_causes_percent_stays_inside_one_to_three() public {
        rail.setCausesBps(100);
        rail.setCausesBps(300);
        vm.expectRevert(HoodSeedRail.BadCauses.selector);
        rail.setCausesBps(400);
    }

    function test_seed_scales_a_deposit_down_to_the_budget() public {
        rail.setHoodBudget(HOOD_FOR_MILLI_ETH);
        uint256 start = 1 ether;
        vm.deal(address(this), start);
        rail.seed{value: 0.01 ether}();
        assertGt(address(this).balance, start - 0.01 ether);
        assertLt(address(this).balance, start);
        assertEq(hood.balanceOf(address(rail)), 0);
        assertEq(rail.hoodBudget(), 0);
    }

    function test_seed_refunds_unused_when_position_takes_less() public {
        MockNpmPull thinner = new MockNpmPull(weth, hood, 9_900);
        HoodSeedRail partialRail = new HoodSeedRail(address(this), address(weth), address(hood), address(pool), address(thinner), 1359889, address(causes));
        partialRail.setTreasury(treasury);
        thinner.setApproved(address(partialRail));
        vm.prank(treasury);
        hood.approve(address(partialRail), type(uint256).max);
        partialRail.setHoodBudget(500_000_000 ether);
        uint256 ethStart = address(this).balance;
        partialRail.seed{value: 0.001 ether}();
        assertGt(address(this).balance, ethStart - 0.001 ether);
        assertEq(address(partialRail).balance, 0);
    }

    function test_seed_reverts_without_position_approval() public {
        npm.setApproved(address(0));
        vm.expectRevert(HoodSeedRail.NotApproved.selector);
        rail.seed{value: 0.001 ether}();
    }

    function test_stranger_cannot_set_the_budget() public {
        vm.prank(address(0xB0B));
        vm.expectRevert(HoodSeedRail.NotOwner.selector);
        rail.setHoodBudget(1);
    }

    receive() external payable {}
}

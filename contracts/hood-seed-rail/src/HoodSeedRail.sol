// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

interface IPool {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function fee() external view returns (uint24);
    function slot0()
        external
        view
        returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool);
}

interface IPositionManager {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function positions(uint256 tokenId)
        external
        view
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        );

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

/**
 * @title HoodSeedRail
 * @notice Pairs incoming ETH with treasury $HOOD and adds both to the existing full-range position.
 *         Size does not change the ratio: a large deposit uses the same pool price as a small one.
 *         This contract cannot remove liquidity, collect fees, or move the position NFT.
 */
contract HoodSeedRail {
    uint256 private constant Q96 = 2 ** 96;
    int24 private constant TICK_LOWER = -887200;
    int24 private constant TICK_UPPER = 887200;
    uint24 private constant FEE = 10_000;
    uint160 private constant SQRT_LOWER_X96 = 4310618291;
    uint160 private constant SQRT_UPPER_X96 = 1456195216270955103182949462556801019286893565306;
    uint16 public constant MAX_SLIPPAGE_BPS = 500;

    address public immutable weth;
    address public immutable hood;
    address public immutable pool;
    address public immutable positionManager;
    uint256 public immutable tokenId;

    address public owner;
    address public treasury;
    uint256 public hoodBudget;
    uint16 public slippageBps;
    bool public paused;
    uint256 private locked;

    event Seeded(
        address indexed payer,
        uint256 ethIn,
        uint256 wethUsed,
        uint256 hoodUsed,
        uint128 liquidity
    );
    event HoodBudgetSet(uint256 budget);
    event TreasurySet(address treasury);
    event SlippageSet(uint16 slippageBps);
    event PausedSet(bool paused);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error Paused();
    error NoValue();
    error NotApproved();
    error NothingToSeed();
    error BadSlippage();
    error ZeroAddress();
    error PriceOutOfRange();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (locked == 1) revert NothingToSeed();
        locked = 1;
        _;
        locked = 0;
    }

    constructor(address owner_, address weth_, address hood_, address pool_, address positionManager_, uint256 tokenId_) {
        if (owner_ == address(0) || weth_ == address(0) || hood_ == address(0) || pool_ == address(0) || positionManager_ == address(0)) {
            revert ZeroAddress();
        }
        if (IPool(pool_).token0() != weth_ || IPool(pool_).token1() != hood_ || IPool(pool_).fee() != FEE) {
            revert PriceOutOfRange();
        }
        (
            ,
            ,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            ,
            ,
            ,
            ,
        ) = IPositionManager(positionManager_).positions(tokenId_);
        if (token0 != weth_ || token1 != hood_ || fee != FEE || tickLower != TICK_LOWER || tickUpper != TICK_UPPER) {
            revert PriceOutOfRange();
        }

        weth = weth_;
        hood = hood_;
        pool = pool_;
        positionManager = positionManager_;
        tokenId = tokenId_;
        owner = owner_;
        treasury = owner_;
        slippageBps = 100;
        emit OwnershipTransferred(address(0), owner_);
    }

    /// @notice ETH used and $HOOD the treasury must supply for this deposit, after the budget cap.
    function quoteSeed(uint256 ethAmount) external view returns (uint256 ethUsed, uint256 hoodPull) {
        (uint160 sqrtPriceX96,, , , , ,) = IPool(pool).slot0();
        (ethUsed, hoodPull) = _plan(ethAmount, sqrtPriceX96);
    }

    /// @notice $HOOD matched to an ETH amount at the current pool price. Ignores the budget cap.
    function hoodForWeth(uint256 wethAmount, uint160 sqrtPriceX96) public pure returns (uint256) {
        if (wethAmount == 0) return 0;
        if (sqrtPriceX96 <= SQRT_LOWER_X96 || sqrtPriceX96 >= SQRT_UPPER_X96) revert PriceOutOfRange();
        uint256 liquidity = _liquidityForWeth(wethAmount, sqrtPriceX96);
        return mulDiv(liquidity, uint256(sqrtPriceX96) - uint256(SQRT_LOWER_X96), Q96);
    }

    /// @notice Wrap ETH, pull the matching $HOOD from the treasury, and add both to the position.
    ///         A deposit larger than the treasury budget seeds what the budget can match and refunds the rest.
    function seed() external payable nonReentrant {
        if (paused) revert Paused();
        if (msg.value == 0) revert NoValue();
        if (!_canAdd()) revert NotApproved();

        IWETH(weth).deposit{value: msg.value}();
        (uint160 sqrtPriceX96,, , , , ,) = IPool(pool).slot0();
        (uint256 ethUsed, uint256 hoodPull) = _plan(msg.value, sqrtPriceX96);
        if (ethUsed == 0 || hoodPull == 0) revert NothingToSeed();

        uint256 fairHood = hoodForWeth(ethUsed, sqrtPriceX96);
        _pull(hood, treasury, hoodPull);
        IERC20(weth).approve(positionManager, ethUsed);
        IERC20(hood).approve(positionManager, hoodPull);

        (uint128 liquidity, uint256 amount0, uint256 amount1) = IPositionManager(positionManager).increaseLiquidity(
            IPositionManager.IncreaseLiquidityParams({
                tokenId: tokenId,
                amount0Desired: ethUsed,
                amount1Desired: hoodPull,
                amount0Min: (ethUsed * (10_000 - slippageBps)) / 10_000,
                amount1Min: (fairHood * (10_000 - slippageBps)) / 10_000,
                deadline: block.timestamp
            })
        );

        IERC20(weth).approve(positionManager, 0);
        IERC20(hood).approve(positionManager, 0);
        if (amount0 == 0 || amount1 == 0 || amount0 > ethUsed || amount1 > hoodPull) revert NothingToSeed();

        hoodBudget -= amount1;
        _refund(IERC20(hood).balanceOf(address(this)), treasury);
        _refundEth(IERC20(weth).balanceOf(address(this)), msg.sender);

        emit Seeded(msg.sender, msg.value, amount0, amount1, liquidity);
    }

    function setHoodBudget(uint256 budget) external onlyOwner {
        hoodBudget = budget;
        emit HoodBudgetSet(budget);
    }

    function setTreasury(address next) external onlyOwner {
        if (next == address(0)) revert ZeroAddress();
        treasury = next;
        emit TreasurySet(next);
    }

    function setSlippageBps(uint16 next) external onlyOwner {
        if (next == 0 || next > MAX_SLIPPAGE_BPS) revert BadSlippage();
        slippageBps = next;
        emit SlippageSet(next);
    }

    function setPaused(bool next) external onlyOwner {
        paused = next;
        emit PausedSet(next);
    }

    function transferOwnership(address next) external onlyOwner {
        if (next == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, next);
        owner = next;
    }

    function _plan(uint256 ethAmount, uint160 sqrtPriceX96) internal view returns (uint256 ethUsed, uint256 hoodPull) {
        if (ethAmount == 0 || hoodBudget == 0 || treasury == address(0)) return (0, 0);
        uint256 available = hoodBudget;
        uint256 allowed = IERC20(hood).allowance(treasury, address(this));
        uint256 balance = IERC20(hood).balanceOf(treasury);
        if (allowed < available) available = allowed;
        if (balance < available) available = balance;
        if (available == 0) return (0, 0);

        uint256 fair = hoodForWeth(ethAmount, sqrtPriceX96);
        hoodPull = (fair * (10_000 + slippageBps)) / 10_000;
        if (hoodPull <= available) return (ethAmount, hoodPull);

        uint256 fairTarget = (available * 10_000) / (10_000 + slippageBps);
        ethUsed = _wethForHood(fairTarget, sqrtPriceX96);
        if (ethUsed > ethAmount) ethUsed = ethAmount;
        return (ethUsed, available);
    }

    function _canAdd() internal view returns (bool) {
        address posOwner = IPositionManager(positionManager).ownerOf(tokenId);
        if (IPositionManager(positionManager).getApproved(tokenId) == address(this)) return true;
        return IPositionManager(positionManager).isApprovedForAll(posOwner, address(this));
    }

    function _liquidityForWeth(uint256 wethAmount, uint160 sqrtPriceX96) internal pure returns (uint256) {
        uint256 intermediate = mulDiv(uint256(sqrtPriceX96), uint256(SQRT_UPPER_X96), Q96);
        return mulDiv(wethAmount, intermediate, uint256(SQRT_UPPER_X96) - uint256(sqrtPriceX96));
    }

    function _wethForHood(uint256 hoodAmount, uint160 sqrtPriceX96) internal pure returns (uint256) {
        if (hoodAmount == 0) return 0;
        uint256 liquidity = mulDiv(hoodAmount, Q96, uint256(sqrtPriceX96) - uint256(SQRT_LOWER_X96));
        uint256 width = uint256(SQRT_UPPER_X96) - uint256(sqrtPriceX96);
        return mulDiv(mulDiv(liquidity, width, uint256(SQRT_UPPER_X96)), Q96, uint256(sqrtPriceX96));
    }

    function _pull(address token, address from, uint256 amount) internal {
        if (!IERC20(token).transferFrom(from, address(this), amount)) revert NothingToSeed();
    }

    function _refund(uint256 amount, address to) internal {
        if (amount == 0) return;
        if (!IERC20(hood).transfer(to, amount)) revert NothingToSeed();
    }

    function _refundEth(uint256 wethAmount, address to) internal {
        if (wethAmount == 0) return;
        IWETH(weth).withdraw(wethAmount);
        (bool ok,) = to.call{value: wethAmount}("");
        if (!ok) revert NothingToSeed();
    }

    receive() external payable {
        if (msg.sender != weth) revert NoValue();
    }

    function mulDiv(uint256 a, uint256 b, uint256 denominator) internal pure returns (uint256 result) {
        unchecked {
            uint256 prod0;
            uint256 prod1;
            assembly {
                let mm := mulmod(a, b, not(0))
                prod0 := mul(a, b)
                prod1 := sub(sub(mm, prod0), lt(mm, prod0))
            }
            if (prod1 == 0) {
                require(denominator > 0);
                assembly {
                    result := div(prod0, denominator)
                }
                return result;
            }
            require(denominator > prod1);
            uint256 remainder;
            assembly {
                remainder := mulmod(a, b, denominator)
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
            }
            uint256 twos = denominator & (~denominator + 1);
            assembly {
                denominator := div(denominator, twos)
                prod0 := div(prod0, twos)
                twos := add(div(sub(0, twos), twos), 1)
            }
            prod0 |= prod1 * twos;
            uint256 inverse = (3 * denominator) ^ 2;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            result = prod0 * inverse;
        }
    }
}

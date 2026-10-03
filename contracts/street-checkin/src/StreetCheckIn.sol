// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title StreetCheckIn
 * @notice On-chain check-in contract for Hood Street on Robinhood Chain (4663).
 * @dev Records one check-in per wallet per Vienna day (Europe/Vienna timezone).
 *      Emits CheckIn event for off-chain indexing by the night API.
 *      No tokens, no payments, no access control - pure check-in tracking.
 *
 * Safety features:
 * - No payable functions, no ETH storage, no token transfers
 * - No owner, no admin, no upgradeable proxy
 * - No external calls (no reentrancy risk)
 * - Transparent on-chain record of all check-ins
 *
 * Chain: Robinhood Chain (4663)
 * Timezone: Europe/Vienna (UTC+1 or UTC+2 depending on DST)
 *
 * Vienna day calculation:
 * - UTC midnight + 1 hour = Vienna midnight during standard time (winter)
 * - UTC midnight + 2 hours = Vienna midnight during DST (summer)
 * - We use UTC+1 as the baseline for simplicity (conservative day boundary)
 * - Day number = (timestamp + 3600) / 86400
 */
contract StreetCheckIn {
    event CheckIn(address indexed wallet, uint256 indexed day, uint256 timestamp);

    mapping(address => uint256) public lastCheckInDay;

    error AlreadyCheckedInToday();

    /**
     * @notice Check in once per Vienna day
     * @dev Reverts if already checked in today (Vienna timezone)
     */
    function checkIn() external {
        uint256 viennaDay = _getViennaDay(block.timestamp);
        uint256 lastDay = lastCheckInDay[msg.sender];

        if (lastDay == viennaDay) {
            revert AlreadyCheckedInToday();
        }

        lastCheckInDay[msg.sender] = viennaDay;
        emit CheckIn(msg.sender, viennaDay, block.timestamp);
    }

    /**
     * @notice Get the current Vienna day number
     * @return The current day number based on Vienna timezone
     */
    function getCurrentDay() external view returns (uint256) {
        return _getViennaDay(block.timestamp);
    }

    /**
     * @notice Check if a wallet can check in today
     * @param wallet The wallet address to check
     * @return True if the wallet can check in today
     */
    function canCheckIn(address wallet) external view returns (bool) {
        uint256 viennaDay = _getViennaDay(block.timestamp);
        return lastCheckInDay[wallet] != viennaDay;
    }

    /**
     * @notice Get the last check-in day for a wallet
     * @param wallet The wallet address to check
     * @return The last day number when the wallet checked in (0 if never)
     */
    function getLastCheckInDay(address wallet) external view returns (uint256) {
        return lastCheckInDay[wallet];
    }

    /**
     * @dev Convert UTC timestamp to Vienna day number
     *      Vienna is UTC+1 (standard) or UTC+2 (DST)
     *      For simplicity, we use UTC+1 as baseline
     *      Day = (timestamp + 3600) / 86400
     */
    function _getViennaDay(uint256 timestamp) private pure returns (uint256) {
        return (timestamp + 3600) / 86400;
    }
}

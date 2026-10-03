// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {StreetCheckIn} from "../src/StreetCheckIn.sol";

contract StreetCheckInTest is Test {
    StreetCheckIn public checkin;
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    event CheckIn(address indexed wallet, uint256 indexed day, uint256 timestamp);

    function setUp() public {
        checkin = new StreetCheckIn();
    }

    function test_InitialState() public view {
        assertEq(checkin.lastCheckInDay(user1), 0);
        assertTrue(checkin.canCheckIn(user1));
    }

    function test_CheckIn() public {
        vm.startPrank(user1);
        
        uint256 currentDay = checkin.getCurrentDay();
        
        vm.expectEmit(true, true, false, true);
        emit CheckIn(user1, currentDay, block.timestamp);
        
        checkin.checkIn();
        
        assertEq(checkin.lastCheckInDay(user1), currentDay);
        assertFalse(checkin.canCheckIn(user1));
        
        vm.stopPrank();
    }

    function test_CannotCheckInTwiceInSameDay() public {
        vm.startPrank(user1);
        
        checkin.checkIn();
        
        vm.expectRevert(StreetCheckIn.AlreadyCheckedInToday.selector);
        checkin.checkIn();
        
        vm.stopPrank();
    }

    function test_CanCheckInNextDay() public {
        vm.startPrank(user1);
        
        checkin.checkIn();
        assertFalse(checkin.canCheckIn(user1));
        
        vm.warp(block.timestamp + 24 hours);
        
        assertTrue(checkin.canCheckIn(user1));
        checkin.checkIn();
        
        vm.stopPrank();
    }

    function test_MultipleUsersCanCheckInSameDay() public {
        vm.prank(user1);
        checkin.checkIn();
        
        vm.prank(user2);
        checkin.checkIn();
        
        assertEq(checkin.lastCheckInDay(user1), checkin.lastCheckInDay(user2));
    }

    function test_ViennaDayCalculation() public {
        uint256 utcMidnight = 1704067200;
        vm.warp(utcMidnight);
        
        uint256 day1 = checkin.getCurrentDay();
        
        vm.warp(utcMidnight + 23 hours);
        uint256 day1Still = checkin.getCurrentDay();
        assertEq(day1, day1Still);
        
        vm.warp(utcMidnight + 24 hours);
        uint256 day2 = checkin.getCurrentDay();
        assertGt(day2, day1);
    }

    function test_CheckInAfterMultipleDays() public {
        vm.startPrank(user1);
        
        checkin.checkIn();
        uint256 day1 = checkin.lastCheckInDay(user1);
        
        vm.warp(block.timestamp + 48 hours);
        
        checkin.checkIn();
        uint256 day3 = checkin.lastCheckInDay(user1);
        
        assertGt(day3, day1);
        
        vm.stopPrank();
    }

    function test_GetLastCheckInDayBeforeAnyCheckIn() public view {
        assertEq(checkin.getLastCheckInDay(user1), 0);
    }

    function test_CanCheckInReturnsTrueForNewUser() public view {
        assertTrue(checkin.canCheckIn(address(0x999)));
    }

    function testFuzz_CheckInWithDifferentAddresses(address randomUser) public {
        vm.assume(randomUser != address(0));
        
        vm.startPrank(randomUser);
        
        assertTrue(checkin.canCheckIn(randomUser));
        checkin.checkIn();
        assertFalse(checkin.canCheckIn(randomUser));
        
        vm.stopPrank();
    }

    function testFuzz_CheckInAfterTimeWarp(uint256 additionalDays) public {
        vm.assume(additionalDays > 0 && additionalDays < 365);
        
        vm.startPrank(user1);
        
        checkin.checkIn();
        uint256 firstDay = checkin.lastCheckInDay(user1);
        
        vm.warp(block.timestamp + (additionalDays * 24 hours));
        
        assertTrue(checkin.canCheckIn(user1));
        checkin.checkIn();
        uint256 laterDay = checkin.lastCheckInDay(user1);
        
        assertGt(laterDay, firstDay);
        
        vm.stopPrank();
    }
}

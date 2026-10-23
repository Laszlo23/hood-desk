// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {NightTools} from "../src/NightTools.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract NightToolsTest is Test {
    NightTools public nightTools;
    address public owner;
    address public alice;
    address public bob;
    address public carol;

    uint256 constant LANTERN_ID = 0;
    uint256 constant PICK_ID = 1;
    uint256 constant VEIN_ID = 2;

    string constant BASE_IMAGE_URI = "https://example.com/images/night-tools/";

    event BadgeClaimed(address indexed finder, uint256 indexed tokenId, string badgeName);
    event BadgeBurned(uint256 indexed tokenId);
    event BaseImageURIUpdated(string newBaseImageURI);
    event OwnershipTransferStarted(
        address indexed previousOwner,
        address indexed newOwner
    );
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        carol = makeAddr("carol");

        vm.prank(owner);
        nightTools = new NightTools(owner, BASE_IMAGE_URI);
    }

    function test_Constructor() public view {
        assertEq(nightTools.name(), "Hood Street Night Tools");
        assertEq(nightTools.symbol(), "HSNT");
        assertEq(nightTools.owner(), owner);
        assertEq(nightTools.baseImageURI(), BASE_IMAGE_URI);
    }

    function test_ClaimLantern() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit BadgeClaimed(alice, LANTERN_ID, "Lantern");
        nightTools.claimBadge(alice, LANTERN_ID);

        assertEq(nightTools.balanceOf(alice), 1);
        assertEq(nightTools.ownerOf(LANTERN_ID), alice);
        assertTrue(nightTools.hasBadge(alice, LANTERN_ID));
        assertFalse(nightTools.hasBadge(alice, PICK_ID));
        assertFalse(nightTools.hasBadge(alice, VEIN_ID));

        (bool claimed, address finder, uint256 claimedAt) = nightTools.getBadgeStatus(LANTERN_ID);
        assertTrue(claimed);
        assertEq(finder, alice);
        assertGt(claimedAt, 0);
    }

    function test_ClaimPick() public {
        vm.prank(owner);
        nightTools.claimBadge(bob, PICK_ID);

        assertEq(nightTools.balanceOf(bob), 1);
        assertEq(nightTools.ownerOf(PICK_ID), bob);
        assertTrue(nightTools.hasBadge(bob, PICK_ID));
        assertFalse(nightTools.hasBadge(bob, LANTERN_ID));
    }

    function test_ClaimVein() public {
        vm.prank(owner);
        nightTools.claimBadge(carol, VEIN_ID);

        assertEq(nightTools.balanceOf(carol), 1);
        assertEq(nightTools.ownerOf(VEIN_ID), carol);
        assertTrue(nightTools.hasBadge(carol, VEIN_ID));
    }

    function test_ClaimAllThreeBadgesToSameWallet() public {
        vm.startPrank(owner);
        nightTools.claimBadge(alice, LANTERN_ID);
        nightTools.claimBadge(alice, PICK_ID);
        nightTools.claimBadge(alice, VEIN_ID);
        vm.stopPrank();

        assertEq(nightTools.balanceOf(alice), 3);
        assertTrue(nightTools.hasBadge(alice, LANTERN_ID));
        assertTrue(nightTools.hasBadge(alice, PICK_ID));
        assertTrue(nightTools.hasBadge(alice, VEIN_ID));
    }

    function test_ClaimBadgesToDifferentWallets() public {
        vm.startPrank(owner);
        nightTools.claimBadge(alice, LANTERN_ID);
        nightTools.claimBadge(bob, PICK_ID);
        nightTools.claimBadge(carol, VEIN_ID);
        vm.stopPrank();

        assertTrue(nightTools.hasBadge(alice, LANTERN_ID));
        assertTrue(nightTools.hasBadge(bob, PICK_ID));
        assertTrue(nightTools.hasBadge(carol, VEIN_ID));

        assertFalse(nightTools.hasBadge(alice, PICK_ID));
        assertFalse(nightTools.hasBadge(bob, VEIN_ID));
        assertFalse(nightTools.hasBadge(carol, LANTERN_ID));
    }

    function test_RevertClaimAlreadyClaimedBadge() public {
        vm.startPrank(owner);
        nightTools.claimBadge(alice, LANTERN_ID);

        vm.expectRevert(
            abi.encodeWithSelector(
                NightTools.BadgeAlreadyClaimed.selector,
                LANTERN_ID
            )
        );
        nightTools.claimBadge(bob, LANTERN_ID);
        vm.stopPrank();

        assertEq(nightTools.ownerOf(LANTERN_ID), alice);
    }

    function test_RevertClaimNotOwner() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice)
        );
        nightTools.claimBadge(bob, LANTERN_ID);
    }

    function test_RevertClaimInvalidBadgeId() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                NightTools.InvalidBadgeId.selector,
                3
            )
        );
        nightTools.claimBadge(alice, 3);
    }

    function test_ClaimToZeroAddressReverts() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC721Errors.ERC721InvalidReceiver.selector,
                address(0)
            )
        );
        nightTools.claimBadge(address(0), LANTERN_ID);
    }

    function test_GetBadgeStatusUnclaimed() public view {
        (bool claimed, address finder, uint256 claimedAt) = nightTools.getBadgeStatus(LANTERN_ID);
        
        assertFalse(claimed);
        assertEq(finder, address(0));
        assertEq(claimedAt, 0);
    }

    function test_GetBadgeStatusClaimed() public {
        vm.prank(owner);
        nightTools.claimBadge(alice, PICK_ID);

        (bool claimed, address finder, uint256 claimedAt) = nightTools.getBadgeStatus(PICK_ID);
        
        assertTrue(claimed);
        assertEq(finder, alice);
        assertGt(claimedAt, 0);
    }

    function test_RevertGetBadgeStatusInvalidId() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                NightTools.InvalidBadgeId.selector,
                99
            )
        );
        nightTools.getBadgeStatus(99);
    }

    function test_HasBadgeUnclaimedReturns False() public view {
        assertFalse(nightTools.hasBadge(alice, LANTERN_ID));
        assertFalse(nightTools.hasBadge(bob, PICK_ID));
        assertFalse(nightTools.hasBadge(carol, VEIN_ID));
    }

    function test_HasBadgeInvalidIdReturnsFalse() public view {
        assertFalse(nightTools.hasBadge(alice, 99));
    }

    function test_SetBaseImageURI() public {
        string memory newURI = "https://newdomain.com/images/";
        
        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit BaseImageURIUpdated(newURI);
        nightTools.setBaseImageURI(newURI);

        assertEq(nightTools.baseImageURI(), newURI);
    }

    function test_RevertSetBaseImageURINotOwner() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice)
        );
        nightTools.setBaseImageURI("https://malicious.com/");
    }

    function test_TransferFromReverts() public {
        vm.prank(owner);
        nightTools.claimBadge(alice, LANTERN_ID);

        vm.prank(alice);
        vm.expectRevert(NightTools.TransfersDisabled.selector);
        nightTools.transferFrom(alice, bob, LANTERN_ID);
    }

    function test_SafeTransferFromReverts() public {
        vm.prank(owner);
        nightTools.claimBadge(alice, PICK_ID);

        vm.prank(alice);
        vm.expectRevert(NightTools.TransfersDisabled.selector);
        nightTools.safeTransferFrom(alice, bob, PICK_ID);
    }

    function test_SafeTransferFromWithDataReverts() public {
        vm.prank(owner);
        nightTools.claimBadge(alice, VEIN_ID);

        vm.prank(alice);
        vm.expectRevert(NightTools.TransfersDisabled.selector);
        nightTools.safeTransferFrom(alice, bob, VEIN_ID, "");
    }

    function test_ApproveAndTransferFromReverts() public {
        vm.prank(owner);
        nightTools.claimBadge(alice, LANTERN_ID);

        vm.prank(alice);
        nightTools.approve(bob, LANTERN_ID);

        assertEq(nightTools.getApproved(LANTERN_ID), bob);

        vm.prank(bob);
        vm.expectRevert(NightTools.TransfersDisabled.selector);
        nightTools.transferFrom(alice, carol, LANTERN_ID);

        assertEq(nightTools.ownerOf(LANTERN_ID), alice);
    }

    function test_SetApprovalForAllAndTransferReverts() public {
        vm.prank(owner);
        nightTools.claimBadge(alice, PICK_ID);

        vm.prank(alice);
        nightTools.setApprovalForAll(bob, true);

        assertTrue(nightTools.isApprovedForAll(alice, bob));

        vm.prank(bob);
        vm.expectRevert(NightTools.TransfersDisabled.selector);
        nightTools.transferFrom(alice, carol, PICK_ID);

        assertEq(nightTools.ownerOf(PICK_ID), alice);
    }

    function test_OwnerBurn() public {
        vm.prank(owner);
        nightTools.claimBadge(alice, LANTERN_ID);

        assertEq(nightTools.balanceOf(alice), 1);
        assertEq(nightTools.ownerOf(LANTERN_ID), alice);
        assertTrue(nightTools.hasBadge(alice, LANTERN_ID));

        (bool claimedBefore, , ) = nightTools.getBadgeStatus(LANTERN_ID);
        assertTrue(claimedBefore);

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit BadgeBurned(LANTERN_ID);
        nightTools.burn(LANTERN_ID);

        assertEq(nightTools.balanceOf(alice), 0);
        assertFalse(nightTools.hasBadge(alice, LANTERN_ID));
        
        (bool claimedAfter, address finder, uint256 claimedAt) = nightTools.getBadgeStatus(LANTERN_ID);
        assertFalse(claimedAfter);
        assertEq(finder, address(0));
        assertEq(claimedAt, 0);

        vm.expectRevert(
            abi.encodeWithSelector(
                IERC721Errors.ERC721NonexistentToken.selector,
                LANTERN_ID
            )
        );
        nightTools.ownerOf(LANTERN_ID);
    }

    function test_BurnAndReclaimBadge() public {
        vm.startPrank(owner);
        nightTools.claimBadge(alice, PICK_ID);
        nightTools.burn(PICK_ID);
        nightTools.claimBadge(bob, PICK_ID);
        vm.stopPrank();

        assertEq(nightTools.ownerOf(PICK_ID), bob);
        assertFalse(nightTools.hasBadge(alice, PICK_ID));
        assertTrue(nightTools.hasBadge(bob, PICK_ID));
    }

    function test_RevertBurnNotOwner() public {
        vm.prank(owner);
        nightTools.claimBadge(alice, PICK_ID);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice)
        );
        nightTools.burn(PICK_ID);

        assertEq(nightTools.ownerOf(PICK_ID), alice);
    }

    function test_Ownable2StepTransfer() public {
        address newOwner = makeAddr("newOwner");

        assertEq(nightTools.owner(), owner);
        assertEq(nightTools.pendingOwner(), address(0));

        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferStarted(owner, newOwner);
        nightTools.transferOwnership(newOwner);

        assertEq(nightTools.owner(), owner);
        assertEq(nightTools.pendingOwner(), newOwner);

        vm.prank(newOwner);
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(owner, newOwner);
        nightTools.acceptOwnership();

        assertEq(nightTools.owner(), newOwner);
        assertEq(nightTools.pendingOwner(), address(0));
    }

    function test_Ownable2StepCannotClaimUntilAccepted() public {
        address newOwner = makeAddr("newOwner");

        vm.prank(owner);
        nightTools.transferOwnership(newOwner);

        vm.prank(newOwner);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                newOwner
            )
        );
        nightTools.claimBadge(alice, LANTERN_ID);

        vm.prank(newOwner);
        nightTools.acceptOwnership();

        vm.prank(newOwner);
        nightTools.claimBadge(alice, LANTERN_ID);
        assertEq(nightTools.balanceOf(alice), 1);
    }

    function test_TokenURILantern() public {
        vm.prank(owner);
        nightTools.claimBadge(alice, LANTERN_ID);

        string memory uri = nightTools.tokenURI(LANTERN_ID);
        assertTrue(bytes(uri).length > 0);
        assertTrue(
            _contains(uri, "data:application/json;utf8,"),
            "Should be utf8 JSON"
        );
        assertTrue(
            _contains(uri, "Lantern"),
            "Should contain Lantern"
        );
        assertTrue(
            _contains(uri, "lantern.jpg"),
            "Should reference lantern.jpg"
        );
    }

    function test_TokenURIPick() public {
        vm.prank(owner);
        nightTools.claimBadge(bob, PICK_ID);

        string memory uri = nightTools.tokenURI(PICK_ID);
        assertTrue(_contains(uri, "Pick"));
        assertTrue(_contains(uri, "pick.jpg"));
    }

    function test_TokenURIVein() public {
        vm.prank(owner);
        nightTools.claimBadge(carol, VEIN_ID);

        string memory uri = nightTools.tokenURI(VEIN_ID);
        assertTrue(_contains(uri, "Vein"));
        assertTrue(_contains(uri, "vein.jpg"));
    }

    function test_TokenURINonexistentReverts() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC721Errors.ERC721NonexistentToken.selector,
                LANTERN_ID
            )
        );
        nightTools.tokenURI(LANTERN_ID);
    }

    function test_SupportsInterface() public view {
        assertTrue(nightTools.supportsInterface(0x01ffc9a7));
        assertTrue(nightTools.supportsInterface(0x80ac58cd));
        assertTrue(nightTools.supportsInterface(0x5b5e139f));
    }

    function test_NoPayableFunction() public {
        (bool success, ) = address(nightTools).call{value: 1 ether}("");
        assertFalse(success, "Should reject ether");
    }

    function _contains(
        string memory haystack,
        string memory needle
    ) internal pure returns (bool) {
        return bytes(haystack).length >= bytes(needle).length && 
               _indexOf(haystack, needle) != type(uint256).max;
    }

    function _indexOf(
        string memory haystack,
        string memory needle
    ) internal pure returns (uint256) {
        bytes memory h = bytes(haystack);
        bytes memory n = bytes(needle);
        if (h.length < n.length) return type(uint256).max;

        for (uint256 i = 0; i <= h.length - n.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (h[i + j] != n[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return i;
        }
        return type(uint256).max;
    }
}

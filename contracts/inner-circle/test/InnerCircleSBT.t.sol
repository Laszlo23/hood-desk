// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {InnerCircleSBT} from "../src/InnerCircleSBT.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract InnerCircleSBTTest is Test {
    InnerCircleSBT public sbt;
    address public owner;
    address public alice;
    address public bob;
    address public carol;

    event Minted(address indexed to, uint256 indexed tokenId);
    event Burned(uint256 indexed tokenId);
    event OnePerAddressUpdated(bool enabled);
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
        sbt = new InnerCircleSBT(owner, false);
    }

    function test_Constructor() public view {
        assertEq(sbt.name(), "Hood Desk Inner Circle");
        assertEq(sbt.symbol(), "HDIC");
        assertEq(sbt.owner(), owner);
        assertEq(sbt.totalSupply(), 0);
        assertFalse(sbt.onePerAddress());
    }

    function test_ConstructorWithOnePerAddress() public {
        vm.prank(owner);
        InnerCircleSBT sbtRestricted = new InnerCircleSBT(owner, true);
        assertTrue(sbtRestricted.onePerAddress());
    }

    function test_MintSingle() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit Minted(alice, 0);
        sbt.mint(alice);

        assertEq(sbt.balanceOf(alice), 1);
        assertEq(sbt.ownerOf(0), alice);
        assertEq(sbt.totalSupply(), 1);
    }

    function test_MintMultiple() public {
        vm.startPrank(owner);
        sbt.mint(alice);
        sbt.mint(bob);
        sbt.mint(alice);
        vm.stopPrank();

        assertEq(sbt.balanceOf(alice), 2);
        assertEq(sbt.balanceOf(bob), 1);
        assertEq(sbt.totalSupply(), 3);
        assertEq(sbt.ownerOf(0), alice);
        assertEq(sbt.ownerOf(1), bob);
        assertEq(sbt.ownerOf(2), alice);
    }

    function test_RevertMintNotOwner() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice)
        );
        sbt.mint(bob);
    }

    function test_MintToZeroAddressReverts() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC721Errors.ERC721InvalidReceiver.selector,
                address(0)
            )
        );
        sbt.mint(address(0));
    }

    function test_BatchMint() public {
        address[] memory recipients = new address[](3);
        recipients[0] = alice;
        recipients[1] = bob;
        recipients[2] = carol;

        vm.prank(owner);
        sbt.batchMint(recipients);

        assertEq(sbt.balanceOf(alice), 1);
        assertEq(sbt.balanceOf(bob), 1);
        assertEq(sbt.balanceOf(carol), 1);
        assertEq(sbt.totalSupply(), 3);
    }

    function test_BatchMintEmpty() public {
        address[] memory recipients = new address[](0);

        vm.prank(owner);
        sbt.batchMint(recipients);

        assertEq(sbt.totalSupply(), 0);
    }

    function test_RevertBatchMintNotOwner() public {
        address[] memory recipients = new address[](1);
        recipients[0] = alice;

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice)
        );
        sbt.batchMint(recipients);
    }

    function test_TransferFromReverts() public {
        vm.prank(owner);
        sbt.mint(alice);

        vm.prank(alice);
        vm.expectRevert(InnerCircleSBT.TransfersDisabled.selector);
        sbt.transferFrom(alice, bob, 0);
    }

    function test_SafeTransferFromReverts() public {
        vm.prank(owner);
        sbt.mint(alice);

        vm.prank(alice);
        vm.expectRevert(InnerCircleSBT.TransfersDisabled.selector);
        sbt.safeTransferFrom(alice, bob, 0);
    }

    function test_SafeTransferFromWithDataReverts() public {
        vm.prank(owner);
        sbt.mint(alice);

        vm.prank(alice);
        vm.expectRevert(InnerCircleSBT.TransfersDisabled.selector);
        sbt.safeTransferFrom(alice, bob, 0, "");
    }

    function test_ApproveAndTransferFromReverts() public {
        vm.prank(owner);
        sbt.mint(alice);

        vm.prank(alice);
        sbt.approve(bob, 0);

        assertEq(sbt.getApproved(0), bob);

        vm.prank(bob);
        vm.expectRevert(InnerCircleSBT.TransfersDisabled.selector);
        sbt.transferFrom(alice, carol, 0);

        assertEq(sbt.ownerOf(0), alice);
    }

    function test_SetApprovalForAllAndTransferReverts() public {
        vm.prank(owner);
        sbt.mint(alice);

        vm.prank(alice);
        sbt.setApprovalForAll(bob, true);

        assertTrue(sbt.isApprovedForAll(alice, bob));

        vm.prank(bob);
        vm.expectRevert(InnerCircleSBT.TransfersDisabled.selector);
        sbt.transferFrom(alice, carol, 0);

        assertEq(sbt.ownerOf(0), alice);
    }

    function test_OwnerBurn() public {
        vm.prank(owner);
        sbt.mint(alice);

        assertEq(sbt.balanceOf(alice), 1);
        assertEq(sbt.ownerOf(0), alice);

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit Burned(0);
        sbt.burn(0);

        assertEq(sbt.balanceOf(alice), 0);
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC721Errors.ERC721NonexistentToken.selector,
                0
            )
        );
        sbt.ownerOf(0);

        assertEq(sbt.totalSupply(), 1);
    }

    function test_RevertBurnNotOwner() public {
        vm.prank(owner);
        sbt.mint(alice);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice)
        );
        sbt.burn(0);

        assertEq(sbt.ownerOf(0), alice);
    }

    function test_Ownable2StepTransfer() public {
        address newOwner = makeAddr("newOwner");

        assertEq(sbt.owner(), owner);
        assertEq(sbt.pendingOwner(), address(0));

        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferStarted(owner, newOwner);
        sbt.transferOwnership(newOwner);

        assertEq(sbt.owner(), owner);
        assertEq(sbt.pendingOwner(), newOwner);

        vm.prank(newOwner);
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(owner, newOwner);
        sbt.acceptOwnership();

        assertEq(sbt.owner(), newOwner);
        assertEq(sbt.pendingOwner(), address(0));
    }

    function test_Ownable2StepCannotMintUntilAccepted() public {
        address newOwner = makeAddr("newOwner");

        vm.prank(owner);
        sbt.transferOwnership(newOwner);

        vm.prank(newOwner);
        vm.expectRevert(
            abi.encodeWithSignature(
                "OwnableUnauthorizedAccount(address)",
                newOwner
            )
        );
        sbt.mint(alice);

        vm.prank(newOwner);
        sbt.acceptOwnership();

        vm.prank(newOwner);
        sbt.mint(alice);
        assertEq(sbt.balanceOf(alice), 1);
    }

    function test_OnePerAddressEnforcement() public {
        vm.prank(owner);
        InnerCircleSBT sbtRestricted = new InnerCircleSBT(owner, true);

        vm.startPrank(owner);
        sbtRestricted.mint(alice);

        vm.expectRevert(InnerCircleSBT.AlreadyHoldsToken.selector);
        sbtRestricted.mint(alice);

        sbtRestricted.mint(bob);
        vm.stopPrank();

        assertEq(sbtRestricted.balanceOf(alice), 1);
        assertEq(sbtRestricted.balanceOf(bob), 1);
    }

    function test_OnePerAddressBatchMintEnforcement() public {
        vm.prank(owner);
        InnerCircleSBT sbtRestricted = new InnerCircleSBT(owner, true);

        address[] memory recipients = new address[](3);
        recipients[0] = alice;
        recipients[1] = bob;
        recipients[2] = alice;

        vm.prank(owner);
        vm.expectRevert(InnerCircleSBT.AlreadyHoldsToken.selector);
        sbtRestricted.batchMint(recipients);

        assertEq(sbtRestricted.balanceOf(alice), 0);
        assertEq(sbtRestricted.balanceOf(bob), 0);
        assertEq(sbtRestricted.totalSupply(), 0);
    }

    function test_SetOnePerAddress() public {
        assertFalse(sbt.onePerAddress());

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit OnePerAddressUpdated(true);
        sbt.setOnePerAddress(true);

        assertTrue(sbt.onePerAddress());

        vm.prank(owner);
        sbt.mint(alice);

        vm.prank(owner);
        vm.expectRevert(InnerCircleSBT.AlreadyHoldsToken.selector);
        sbt.mint(alice);

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit OnePerAddressUpdated(false);
        sbt.setOnePerAddress(false);

        assertFalse(sbt.onePerAddress());

        vm.prank(owner);
        sbt.mint(alice);
        assertEq(sbt.balanceOf(alice), 2);
    }

    function test_RevertSetOnePerAddressNotOwner() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice)
        );
        sbt.setOnePerAddress(true);
    }

    function test_TokenURI() public {
        vm.prank(owner);
        sbt.mint(alice);

        string memory uri = sbt.tokenURI(0);
        assertTrue(bytes(uri).length > 0);
        assertTrue(
            _contains(uri, "data:application/json;base64,"),
            "Should be base64 JSON"
        );
    }

    function test_TokenURINonexistentReverts() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC721Errors.ERC721NonexistentToken.selector,
                0
            )
        );
        sbt.tokenURI(0);
    }

    function test_SupportsInterface() public view {
        assertTrue(sbt.supportsInterface(0x01ffc9a7));
        assertTrue(sbt.supportsInterface(0x80ac58cd));
        assertTrue(sbt.supportsInterface(0x5b5e139f));
    }

    function test_NoPayableFunction() public {
        (bool success, ) = address(sbt).call{value: 1 ether}("");
        assertFalse(success, "Should reject ether");
    }

    function test_GasEfficiencyBatchMint() public {
        address[] memory recipients = new address[](100);
        for (uint256 i = 0; i < 100; i++) {
            recipients[i] = makeAddr(string(abi.encodePacked("user", i)));
        }

        vm.prank(owner);
        uint256 gasBefore = gasleft();
        sbt.batchMint(recipients);
        uint256 gasUsed = gasBefore - gasleft();

        assertEq(sbt.totalSupply(), 100);
        assertTrue(gasUsed > 0);
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

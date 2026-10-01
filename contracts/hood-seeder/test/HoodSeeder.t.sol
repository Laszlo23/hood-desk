// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {HoodSeeder} from "../src/HoodSeeder.sol";

contract HoodSeederTest is Test {
    HoodSeeder public seeder;
    address public owner;
    address public user1;
    address public user2;
    
    string constant BASE_URI = "https://nft.example.com/hood-seeder/";
    uint96 constant ROYALTY_FEE = 500; // 5%

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        seeder = new HoodSeeder(
            "Hood Seeder",
            "HSEED",
            BASE_URI,
            owner,
            ROYALTY_FEE
        );
    }

    function test_InitialState() public view {
        assertEq(seeder.name(), "Hood Seeder");
        assertEq(seeder.symbol(), "HSEED");
        assertEq(seeder.MAX_SUPPLY(), 3333);
        assertEq(seeder.totalSupply(), 0);
        assertEq(seeder.owner(), owner);
        assertFalse(seeder.claimEnabled());
    }

    function test_Mint() public {
        uint256 tokenId = seeder.mint(user1);
        
        assertEq(tokenId, 1);
        assertEq(seeder.totalSupply(), 1);
        assertEq(seeder.ownerOf(tokenId), user1);
        assertEq(seeder.balanceOf(user1), 1);
    }

    function test_BatchMint() public {
        uint256 firstTokenId = seeder.batchMint(user1, 10);
        
        assertEq(firstTokenId, 1);
        assertEq(seeder.totalSupply(), 10);
        assertEq(seeder.balanceOf(user1), 10);
        
        for (uint256 i = 1; i <= 10; i++) {
            assertEq(seeder.ownerOf(i), user1);
        }
    }

    function test_RevertMintWhenMaxSupply() public {
        seeder.batchMint(user1, 3333);
        
        vm.expectRevert("HoodSeeder: max supply reached");
        seeder.mint(user2);
    }

    function test_RevertBatchMintExceedsMaxSupply() public {
        vm.expectRevert("HoodSeeder: exceeds max supply");
        seeder.batchMint(user1, 3334);
    }

    function test_RevertMintNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        seeder.mint(user1);
    }

    function test_SetBaseURI() public {
        string memory newBaseURI = "https://new.example.com/metadata/";
        seeder.setBaseURI(newBaseURI);
        
        seeder.mint(user1);
        string memory uri = seeder.tokenURI(1);
        assertEq(uri, "https://new.example.com/metadata/1.json");
    }

    function test_TokenURI() public {
        seeder.mint(user1);
        string memory uri = seeder.tokenURI(1);
        assertEq(uri, string(abi.encodePacked(BASE_URI, "1.json")));
    }

    function test_SetClaimEnabled() public {
        assertFalse(seeder.claimEnabled());
        
        seeder.setClaimEnabled(true);
        assertTrue(seeder.claimEnabled());
        
        seeder.setClaimEnabled(false);
        assertFalse(seeder.claimEnabled());
    }

    function test_Royalty() public view {
        (address receiver, uint256 royaltyAmount) = seeder.royaltyInfo(1, 10000);
        
        assertEq(receiver, owner);
        assertEq(royaltyAmount, 500); // 5% of 10000
    }

    function test_SetDefaultRoyalty() public {
        address newReceiver = user2;
        uint96 newFee = 1000; // 10%
        
        seeder.setDefaultRoyalty(newReceiver, newFee);
        
        (address receiver, uint256 royaltyAmount) = seeder.royaltyInfo(1, 10000);
        assertEq(receiver, newReceiver);
        assertEq(royaltyAmount, 1000);
    }

    function test_SupportsInterface() public view {
        assertTrue(seeder.supportsInterface(0x01ffc9a7)); // ERC165
        assertTrue(seeder.supportsInterface(0x80ac58cd)); // ERC721
        assertTrue(seeder.supportsInterface(0x2a55205a)); // ERC2981
        assertTrue(seeder.supportsInterface(0x780e9d63)); // ERC721Enumerable
    }

    function test_Transfer() public {
        seeder.mint(user1);
        
        vm.prank(user1);
        seeder.transferFrom(user1, user2, 1);
        
        assertEq(seeder.ownerOf(1), user2);
        assertEq(seeder.balanceOf(user1), 0);
        assertEq(seeder.balanceOf(user2), 1);
    }
}

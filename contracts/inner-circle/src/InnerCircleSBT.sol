// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title InnerCircleSBT
 * @notice Soulbound (non-transferable) ERC-721 badge for Hood Desk Inner Circle on Robinhood Chain (4663).
 * @dev Safe, transparent, owner-only mint pattern using OpenZeppelin ERC721 + Ownable2Step.
 *
 * Safety features:
 * - Soulbound: blocks all transfers after mint (only mint by owner and optional burn work)
 * - Owner-only mint (single + batch)
 * - Optional one-per-address enforcement
 * - No payable mint, no fees, no tax, no blacklist, no upgradeable proxy, no hidden roles
 * - No reentrancy-sensitive external calls on mint
 * - On-chain SVG metadata for transparency
 *
 * Chain: Robinhood Chain (4663)
 * Separate from: DogiHood (0x9273f6d13c45a18c9664cecf0e7ff1f7aa9440fa) and Hood Seeder
 */
contract InnerCircleSBT is ERC721, Ownable2Step {
    using Strings for uint256;

    uint256 private _nextTokenId;
    bool public onePerAddress;

    event Minted(address indexed to, uint256 indexed tokenId);
    event Burned(uint256 indexed tokenId);
    event OnePerAddressUpdated(bool enabled);

    error TransfersDisabled();
    error AlreadyHoldsToken();

    /**
     * @notice Deploy the Inner Circle soulbound NFT
     * @param initialOwner Address that will own the contract and have minting rights
     * @param _onePerAddress If true, each address can only hold one token
     */
    constructor(
        address initialOwner,
        bool _onePerAddress
    ) ERC721("Hood Desk Inner Circle", "HDIC") Ownable(initialOwner) {
        onePerAddress = _onePerAddress;
    }

    /**
     * @notice Mint a single soulbound token to an address
     * @dev Only owner can call. No payment required. No external calls (no reentrancy risk).
     * @param to Address to mint to (cannot be zero address, enforced by ERC721)
     */
    function mint(address to) external onlyOwner {
        if (onePerAddress && balanceOf(to) > 0) {
            revert AlreadyHoldsToken();
        }
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        emit Minted(to, tokenId);
    }

    /**
     * @notice Mint multiple soulbound tokens to different addresses
     * @dev Only owner can call. Gas-efficient batch mint.
     * @param recipients Array of addresses to mint to
     */
    function batchMint(address[] calldata recipients) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            address to = recipients[i];
            if (onePerAddress && balanceOf(to) > 0) {
                revert AlreadyHoldsToken();
            }
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
            emit Minted(to, tokenId);
        }
    }

    /**
     * @notice Owner can burn a token (for moderation/mistakes)
     * @param tokenId The token ID to burn
     */
    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
        emit Burned(tokenId);
    }

    /**
     * @notice Update one-per-address enforcement setting
     * @param enabled If true, each address can only hold one token
     */
    function setOnePerAddress(bool enabled) external onlyOwner {
        onePerAddress = enabled;
        emit OnePerAddressUpdated(enabled);
    }

    /**
     * @notice Get total supply of minted tokens (includes burned)
     * @return The next token ID (equals total minted count)
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice Override _update to block all transfers except mint and burn
     * @dev Soulbound implementation: only address(0) → recipient (mint) or owner → address(0) (burn) are allowed
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0)) {
            revert TransfersDisabled();
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Generate on-chain SVG metadata
     * @param tokenId The token ID
     * @return Base64-encoded JSON metadata with embedded SVG
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">',
                '<rect width="400" height="400" fill="#000"/>',
                '<circle cx="200" cy="180" r="80" fill="none" stroke="#CCFF00" stroke-width="4"/>',
                '<text x="200" y="120" font-family="monospace" font-size="14" fill="#CCFF00" text-anchor="middle">HOOD DESK</text>',
                '<text x="200" y="195" font-family="monospace" font-size="28" font-weight="bold" fill="#CCFF00" text-anchor="middle">INNER</text>',
                '<text x="200" y="220" font-family="monospace" font-size="28" font-weight="bold" fill="#CCFF00" text-anchor="middle">CIRCLE</text>',
                '<text x="200" y="280" font-family="monospace" font-size="12" fill="#888" text-anchor="middle">#',
                tokenId.toString(),
                "</text>",
                '<text x="200" y="300" font-family="monospace" font-size="10" fill="#666" text-anchor="middle">SOULBOUND \xC2\xB7 RH 4663</text>',
                '<rect x="160" y="320" width="80" height="2" fill="#CCFF00"/>',
                '<text x="200" y="345" font-family="monospace" font-size="9" fill="#555" text-anchor="middle">\xF0\x9F\xA6\x8A Hood Street</text>',
                "</svg>"
            )
        );

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"Hood Desk Inner Circle #',
                        tokenId.toString(),
                        '","description":"Soulbound badge for Hood Desk Inner Circle on Robinhood Chain. Non-transferable proof of membership. No promises, no roadmap \\u2014 culture first.","image":"data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '","attributes":[{"trait_type":"Type","value":"Soulbound"},{"trait_type":"Network","value":"Robinhood Chain"},{"trait_type":"Chain ID","value":"4663"},{"trait_type":"Collection","value":"Inner Circle"},{"trait_type":"Token ID","value":"',
                        tokenId.toString(),
                        '"}]}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}

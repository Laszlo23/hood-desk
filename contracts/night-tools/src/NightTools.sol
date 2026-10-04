// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title NightTools
 * @notice Three 1/1 soulbound (non-transferable) cosmetic badges for Hood Street on Robinhood Chain (4663).
 * @dev Safe, transparent, desk-role mint pattern using OpenZeppelin ERC721 + Ownable2Step.
 *
 * Three unique 1/1 badges (token IDs are fixed):
 * - Lantern (tokenId 0): First wallet to achieve seven real Vienna-day check-ins in a row finds it
 * - Pick (tokenId 1): First wallet to complete a dig with a real neighbor finds it
 * - Vein (tokenId 2): At most one per Vienna night, first check-in of the day IF that wallet already found the Lantern
 *
 * Each badge can only be claimed once by the first eligible wallet. Once found, the green hood wax seal
 * appears on that badge. Unfound badges are shown without the seal.
 *
 * Safety features:
 * - Soulbound: blocks all transfers after mint (only mint by owner and optional burn work)
 * - Desk/minter role (owner) assigns badges to first eligible wallet
 * - Off-chain night ledger is source of truth for eligibility
 * - No payable mint, no fees, no tax, no blacklist, no upgradeable proxy, no hidden roles
 * - No reentrancy-sensitive external calls on mint
 * - Image references point to committed artwork in public/images/night-tools/
 *
 * Chain: Robinhood Chain (4663)
 * These are cosmetics on the street. They must not change payouts, odds, desk-point amounts, or token balances.
 */
contract NightTools is ERC721, Ownable2Step {
    using Strings for uint256;

    uint256 private constant LANTERN_ID = 0;
    uint256 private constant PICK_ID = 1;
    uint256 private constant VEIN_ID = 2;

    mapping(uint256 => uint256) private _claimedAt;
    string private _baseImageURI;

    event BadgeClaimed(address indexed finder, uint256 indexed tokenId, string badgeName);
    event BadgeBurned(uint256 indexed tokenId);
    event BaseImageURIUpdated(string newBaseImageURI);

    error TransfersDisabled();
    error BadgeAlreadyClaimed(uint256 tokenId);
    error InvalidBadgeId(uint256 tokenId);

    /**
     * @notice Deploy the Night Tools 1/1 soulbound badge contract
     * @param initialOwner Address that will own the contract and have minting rights (desk role)
     * @param baseImageURI Base URI for badge images (e.g., "https://example.com/images/night-tools/")
     */
    constructor(
        address initialOwner,
        string memory baseImageURI
    ) ERC721("Hood Street Night Tools", "HSNT") Ownable(initialOwner) {
        _baseImageURI = baseImageURI;
    }

    /**
     * @notice Claim a 1/1 badge for the first eligible wallet (desk/minter role only)
     * @dev Only owner can call. No payment required. No external calls (no reentrancy risk).
     * @param to Address of the first wallet that met the eligibility criteria (cannot be zero address)
     * @param tokenId The badge ID (0=Lantern, 1=Pick, 2=Vein)
     */
    function claimBadge(address to, uint256 tokenId) external onlyOwner {
        if (tokenId > VEIN_ID) {
            revert InvalidBadgeId(tokenId);
        }
        if (_claimedAt[tokenId] != 0) {
            revert BadgeAlreadyClaimed(tokenId);
        }

        _claimedAt[tokenId] = block.timestamp;
        _safeMint(to, tokenId);

        string memory badgeName = _getBadgeName(tokenId);
        emit BadgeClaimed(to, tokenId, badgeName);
    }

    /**
     * @notice Owner can burn a badge (for moderation/mistakes only - allows re-minting)
     * @param tokenId The badge ID to burn
     */
    function burn(uint256 tokenId) external onlyOwner {
        _claimedAt[tokenId] = 0;
        _burn(tokenId);
        emit BadgeBurned(tokenId);
    }

    /**
     * @notice Check if a badge has been claimed
     * @param tokenId The badge ID (0=Lantern, 1=Pick, 2=Vein)
     * @return claimed True if the badge has been claimed by someone
     * @return finder The address that found the badge (zero address if not claimed)
     * @return claimedAt Timestamp when the badge was claimed (0 if not claimed)
     */
    function getBadgeStatus(uint256 tokenId) external view returns (bool claimed, address finder, uint256 claimedAt) {
        if (tokenId > VEIN_ID) {
            revert InvalidBadgeId(tokenId);
        }
        
        claimedAt = _claimedAt[tokenId];
        claimed = claimedAt != 0;
        
        if (claimed) {
            finder = _ownerOf(tokenId);
        } else {
            finder = address(0);
        }
    }

    /**
     * @notice Check if a specific wallet holds a specific badge
     * @param wallet The wallet address to check
     * @param tokenId The badge ID (0=Lantern, 1=Pick, 2=Vein)
     * @return bool True if the wallet holds this badge
     */
    function hasBadge(address wallet, uint256 tokenId) external view returns (bool) {
        if (tokenId > VEIN_ID) {
            return false;
        }
        if (_claimedAt[tokenId] == 0) {
            return false;
        }
        return _ownerOf(tokenId) == wallet;
    }

    /**
     * @notice Update the base image URI for badge metadata
     * @param baseImageURI New base URI (e.g., "https://example.com/images/night-tools/")
     */
    function setBaseImageURI(string memory baseImageURI) external onlyOwner {
        _baseImageURI = baseImageURI;
        emit BaseImageURIUpdated(baseImageURI);
    }

    /**
     * @notice Get the base image URI
     */
    function baseImageURI() external view returns (string memory) {
        return _baseImageURI;
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
     * @notice Generate on-chain metadata with image reference
     * @param tokenId The badge ID (0=Lantern, 1=Pick, 2=Vein)
     * @return JSON metadata string
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory badgeName = _getBadgeName(tokenId);
        string memory imageFileName = _getImageFileName(tokenId);
        string memory description = _getBadgeDescription(tokenId);
        
        return string(
            abi.encodePacked(
                'data:application/json;utf8,{"name":"',
                badgeName,
                '","description":"',
                description,
                '","image":"',
                _baseImageURI,
                imageFileName,
                '","attributes":[{"trait_type":"Type","value":"1/1 Badge"},{"trait_type":"Badge","value":"',
                badgeName,
                '"},{"trait_type":"Network","value":"Robinhood Chain"},{"trait_type":"Chain ID","value":"4663"},{"trait_type":"Claimed At","value":"',
                _claimedAt[tokenId].toString(),
                '"}]}'
            )
        );
    }

    /**
     * @dev Internal helper to get badge name
     */
    function _getBadgeName(uint256 tokenId) private pure returns (string memory) {
        if (tokenId == LANTERN_ID) return "Lantern";
        if (tokenId == PICK_ID) return "Pick";
        if (tokenId == VEIN_ID) return "Vein";
        return "Unknown";
    }

    /**
     * @dev Internal helper to get image file name
     */
    function _getImageFileName(uint256 tokenId) private pure returns (string memory) {
        if (tokenId == LANTERN_ID) return "lantern.jpg";
        if (tokenId == PICK_ID) return "pick.jpg";
        if (tokenId == VEIN_ID) return "vein.jpg";
        return "";
    }

    /**
     * @dev Internal helper to get badge-specific descriptions
     */
    function _getBadgeDescription(uint256 tokenId) private pure returns (string memory) {
        if (tokenId == LANTERN_ID) {
            return "1/1 cosmetic badge earned on Hood Street. Found by the first wallet to achieve seven real Vienna-day check-ins in a row. Non-transferable, no promises, no roadmap. Culture first.";
        } else if (tokenId == PICK_ID) {
            return "1/1 cosmetic badge earned on Hood Street. Found by the first wallet to complete a dig with a real neighbor. Non-transferable, no promises, no roadmap. Culture first.";
        } else {
            return "1/1 cosmetic badge earned on Hood Street. At most one per Vienna night, awarded to the first check-in of the day if that wallet already found the Lantern. Non-transferable, no promises, no roadmap. Culture first.";
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title HoodSeeder
 * @notice Hood Seeder Pass — early supporters who help seed $HOOD liquidity
 * @dev Robin Hood / forest / fox / #CCFF00 themed NFT on Robinhood Chain 4663
 * 
 * Features:
 * - ERC-721 NFT with metadata
 * - Max supply 3333 
 * - Owner-controlled minting
 * - Configurable base URI
 * - ERC-2981 royalty support (optional)
 * - Future claim utility stub (must be enabled + funded by owner separately)
 */
contract HoodSeeder is ERC721, ERC721Enumerable, ERC2981, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 3333;
    uint256 private _nextTokenId = 1;
    
    string private _baseTokenURI;
    bool public claimEnabled = false;
    
    event Minted(address indexed to, uint256 indexed tokenId);
    event BaseURIUpdated(string newBaseURI);
    event ClaimStatusUpdated(bool enabled);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address royaltyReceiver_,
        uint96 royaltyFeeNumerator_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        _baseTokenURI = baseURI_;
        if (royaltyReceiver_ != address(0)) {
            _setDefaultRoyalty(royaltyReceiver_, royaltyFeeNumerator_);
        }
    }

    /**
     * @notice Mint a single Hood Seeder Pass to the specified address
     * @param to Recipient address
     * @return tokenId The minted token ID
     */
    function mint(address to) external onlyOwner returns (uint256) {
        require(totalSupply() < MAX_SUPPLY, "HoodSeeder: max supply reached");
        require(to != address(0), "HoodSeeder: mint to zero address");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        emit Minted(to, tokenId);
        return tokenId;
    }

    /**
     * @notice Batch mint multiple Hood Seeder Passes
     * @param to Recipient address
     * @param amount Number of tokens to mint
     * @return firstTokenId The first token ID minted in the batch
     */
    function batchMint(address to, uint256 amount) external onlyOwner returns (uint256 firstTokenId) {
        require(totalSupply() + amount <= MAX_SUPPLY, "HoodSeeder: exceeds max supply");
        require(to != address(0), "HoodSeeder: mint to zero address");
        require(amount > 0, "HoodSeeder: amount must be positive");
        
        firstTokenId = _nextTokenId;
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
            emit Minted(to, tokenId);
        }
    }

    /**
     * @notice Update the base URI for token metadata
     * @param baseURI_ New base URI
     */
    function setBaseURI(string memory baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    /**
     * @notice Enable or disable future claim functionality
     * @dev This is a placeholder for future $HOOD drip utility
     * @param enabled Whether claims are enabled
     */
    function setClaimEnabled(bool enabled) external onlyOwner {
        claimEnabled = enabled;
        emit ClaimStatusUpdated(enabled);
    }

    /**
     * @notice Update royalty information
     * @param receiver Royalty receiver address
     * @param feeNumerator Fee numerator (denominator is 10000)
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /**
     * @notice Get the base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Get the token URI for a specific token
     * @param tokenId Token ID
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 
            ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
            : "";
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

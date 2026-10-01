# Hood Seeder NFT

**ERC-721 NFT collection** for early supporters who help seed $HOOD liquidity on Robinhood Chain 4663.

## Overview

- **Name:** Hood Seeder
- **Symbol:** HSEED
- **Max Supply:** 3333
- **Chain:** Robinhood Chain (4663)
- **Theme:** Robin Hood / forest / fox / #CCFF00 accent
- **Standards:** ERC-721, ERC-721Enumerable, ERC-2981 (royalty)

## Features

- ✅ Owner-controlled minting (single + batch)
- ✅ Configurable base URI for metadata
- ✅ ERC-2981 royalty support (default 5%)
- ✅ Max supply cap (3333)
- ✅ Claim enabled flag (future $HOOD drip utility, off by default)
- ✅ Full test suite

## Quick Start

### Prerequisites

```bash
# Install Foundry if not already installed
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set:
# - PRIVATE_KEY: your deployer private key (NEVER commit)
# - RPC_URL: Robinhood Chain RPC (defaults to mainnet)
# - BASE_URI: your metadata endpoint
# - ROYALTY_RECEIVER: address for royalties (defaults to deployer)
# - ROYALTY_FEE: royalty in basis points (default 500 = 5%)
```

### Build & Test

```bash
# Install dependencies
forge install

# Compile contracts
forge build

# Run tests
forge test

# Run tests with gas report
forge test --gas-report

# Run tests with detailed output
forge test -vvv
```

### Deploy

```bash
# Load environment variables
source .env

# Deploy to Robinhood Chain 4663
forge script script/DeployHoodSeeder.s.sol:DeployHoodSeeder \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Optional: verify on Robinscout (if API key available)
forge script script/DeployHoodSeeder.s.sol:DeployHoodSeeder \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

The deployment will output:
```
HoodSeeder deployed at: 0x...
Max supply: 3333
Total supply: 0
```

**Save this contract address** — you'll need it for the Desk UI and minting.

## Post-Deployment

### 1. Update Hood Desk Environment

Add the deployed contract address to the main Hood Desk `.env` file:

```bash
# In /workspace/.env
VITE_HOOD_SEEDER_NFT=0x<your-deployed-address>
```

Restart the dev server to see the featured card on `#/nfts`.

### 2. Mint Initial Passes

```bash
# Mint single pass
cast send <CONTRACT_ADDRESS> \
  "mint(address)" <RECIPIENT_ADDRESS> \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Batch mint (e.g. 10 passes)
cast send <CONTRACT_ADDRESS> \
  "batchMint(address,uint256)" <RECIPIENT_ADDRESS> 10 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Check total supply
cast call <CONTRACT_ADDRESS> "totalSupply()" --rpc-url $RPC_URL

# Check holder balance
cast call <CONTRACT_ADDRESS> \
  "balanceOf(address)" <HOLDER_ADDRESS> \
  --rpc-url $RPC_URL
```

### 3. Setup Metadata

Host metadata JSON files at `<BASE_URI>/<tokenId>.json` with standard ERC-721 format:

```json
{
  "name": "Hood Seeder #1",
  "description": "Early supporter who seeded $HOOD liquidity on Robinhood Chain. Forest guardian with fox spirit.",
  "image": "https://yourcdn.com/hood-seeder/1.svg",
  "external_url": "https://hood-desk.example.com",
  "attributes": [
    {
      "trait_type": "Role",
      "value": "Seeder"
    },
    {
      "trait_type": "Theme",
      "value": "Forest Guardian"
    },
    {
      "trait_type": "Rarity",
      "value": "Common"
    }
  ]
}
```

Update base URI if needed:

```bash
cast send <CONTRACT_ADDRESS> \
  "setBaseURI(string)" "https://nft.example.com/hood-seeder/" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 4. Configure Royalties (Optional)

Update royalty receiver or fee:

```bash
# Set new royalty (500 = 5%, 1000 = 10%)
cast send <CONTRACT_ADDRESS> \
  "setDefaultRoyalty(address,uint96)" <RECEIVER> 500 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

## Contract Functions

### Owner Functions

```solidity
// Mint single token
function mint(address to) external onlyOwner returns (uint256)

// Batch mint multiple tokens
function batchMint(address to, uint256 amount) external onlyOwner returns (uint256)

// Update metadata base URI
function setBaseURI(string memory baseURI_) external onlyOwner

// Enable/disable future claim utility
function setClaimEnabled(bool enabled) external onlyOwner

// Update royalty info
function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner
```

### View Functions

```solidity
// Standard ERC-721
function balanceOf(address owner) external view returns (uint256)
function ownerOf(uint256 tokenId) external view returns (address)
function tokenURI(uint256 tokenId) external view returns (string memory)

// Enumerable
function totalSupply() external view returns (uint256)
function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)
function tokenByIndex(uint256 index) external view returns (uint256)

// Hood Seeder specific
function MAX_SUPPLY() external view returns (uint256)  // 3333
function claimEnabled() external view returns (bool)

// Royalty (ERC-2981)
function royaltyInfo(uint256 tokenId, uint256 salePrice) 
  external view returns (address receiver, uint256 royaltyAmount)
```

## Future Utility: $HOOD Claim

The contract includes a `claimEnabled` flag for future claim utility. To implement:

1. **Deploy separate claim contract** that:
   - Checks Hood Seeder `balanceOf`
   - Rate-limits claims (e.g. weekly)
   - Transfers $HOOD from funded treasury
   
2. **Enable claim flag** (optional signal):

```bash
cast send <CONTRACT_ADDRESS> \
  "setClaimEnabled(bool)" true \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

**Important:** The NFT contract does NOT distribute tokens. You must:
- Deploy a separate claim contract
- Fund it with $HOOD tokens
- Implement claim logic with proper access controls

Never enable `claimEnabled` without actual funding and infrastructure.

## Liquidity Seeding

The "seeder" theme honors early supporters who help bootstrap $HOOD liquidity:

- Create micro $HOOD/WETH pool on RH 4663 (when DEX is live)
- Liquidity pool is **separate** from NFT contract
- Deploy pool manually or via Foundry script
- Never create pools in browser with private keys

## Security

- ✅ OpenZeppelin audited contracts (ERC721, Ownable, ERC2981)
- ✅ Max supply enforced
- ✅ Owner-only minting
- ✅ No transfer restrictions
- ✅ Standard interfaces for marketplaces

### Test Coverage

```bash
forge test -vv

[PASS] test_BatchMint()
[PASS] test_InitialState()
[PASS] test_Mint()
[PASS] test_RevertBatchMintExceedsMaxSupply()
[PASS] test_RevertMintNotOwner()
[PASS] test_RevertMintWhenMaxSupply()
[PASS] test_Royalty()
[PASS] test_SetBaseURI()
[PASS] test_SetClaimEnabled()
[PASS] test_SetDefaultRoyalty()
[PASS] test_SupportsInterface()
[PASS] test_TokenURI()
[PASS] test_Transfer()
```

## Verification

Verify on Robinscout (Robinhood Chain block explorer):

```bash
forge verify-contract \
  --chain-id 4663 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(string,string,string,address,uint96)" \
    "Hood Seeder" "HSEED" "https://nft.example.com/hood-seeder/" <RECEIVER> 500) \
  <CONTRACT_ADDRESS> \
  src/HoodSeeder.sol:HoodSeeder
```

Note: Robinscout may have limited verification support. Check [robinscout.gitlawb.com](https://robinscout.gitlawb.com) for current status.

## Troubleshooting

### Build Issues

If you get OpenZeppelin import errors:

```bash
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge build
```

### RPC Issues

Default RPC: `https://rpc.mainnet.chain.robinhood.com`

If you encounter rate limits, consider:
- Using your own Robinhood Chain node
- Adding delays between calls
- Batching requests where possible

### Gas Issues

Ensure deployer account has sufficient RH 4663 ETH:
- Single mint: ~150k gas
- Batch mint (10): ~1.3M gas
- Deploy: ~3M gas

## Resources

- [Robinhood Chain Docs](https://docs.chain.robinhood.com)
- [Robinscout Explorer](https://robinscout.gitlawb.com)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Foundry Book](https://book.getfoundry.sh/)

## License

MIT

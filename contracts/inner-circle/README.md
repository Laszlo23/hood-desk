# Hood Desk Contracts

Foundry smart contracts for Hood Desk on Robinhood Chain (4663).

## Contracts

### InnerCircleSBT

**Soulbound (non-transferable) ERC-721 badge for Hood Desk Inner Circle.**

- **Network:** Robinhood Chain (4663)
- **Standard:** ERC-721 (soulbound variant)
- **Safety:** OpenZeppelin ERC721 + Ownable2Step

#### Features

- ✅ **Soulbound:** Tokens cannot be transferred after mint (only mint by owner and burn work)
- ✅ **Owner-only mint:** Single and batch minting restricted to contract owner
- ✅ **Optional one-per-address:** Configurable enforcement to limit each address to one token
- ✅ **Owner burn:** Owner can burn tokens for moderation/corrections
- ✅ **On-chain SVG metadata:** Fully on-chain metadata with embedded SVG artwork
- ✅ **Transparent:** No payable mint, no fees, no tax, no blacklist, no upgradeable proxy, no hidden roles
- ✅ **Safe:** No reentrancy-sensitive external calls on mint, uses OpenZeppelin battle-tested code

#### Usage

```bash
# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test

# Run tests with gas reporting
forge test --gas-report

# Test coverage
forge coverage
```

#### Deployment

```bash
# Set environment variables
export PRIVATE_KEY="your-private-key"
export RPC_URL="https://rpc.mainnet.chain.robinhood.com"

# Deploy (example - adjust constructor args)
forge script script/DeployInnerCircle.s.sol:DeployInnerCircle \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify

# Or deploy directly
forge create src/InnerCircleSBT.sol:InnerCircleSBT \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args "YOUR_OWNER_ADDRESS" false
```

#### Safety Guarantees

✅ No transfers after mint (soulbound via `_update` override)  
✅ OpenZeppelin ERC721 + Ownable2Step (same pattern as $HOOD)  
✅ Owner-only mint (single + batch)  
✅ No payable functions  
✅ No fees or taxes  
✅ No blacklist  
✅ No upgradeable proxy  
✅ No hidden mint roles beyond Ownable2Step  
✅ No reentrancy-sensitive external calls  
✅ Comprehensive test coverage  

#### Tests

All safety-critical functionality is tested:

- ✅ Mint (single + batch)
- ✅ Cannot transfer (transferFrom, safeTransferFrom)
- ✅ Cannot approve + transferFrom
- ✅ Owner burn
- ✅ Ownable2Step ownership transfer
- ✅ One-per-address enforcement
- ✅ Token URI generation
- ✅ No payable functions
- ✅ Access control

Run tests: `forge test -vv`

#### Contract Verification

After deployment, verify on Robinhood Chain Blockscout:

```bash
forge verify-contract \
  --chain-id 4663 \
  --etherscan-api-key YOUR_BLOCKSCOUT_API_KEY \
  --verifier-url "https://robinhoodchain.blockscout.com/api" \
  CONTRACT_ADDRESS \
  src/InnerCircleSBT.sol:InnerCircleSBT \
  --constructor-args $(cast abi-encode "constructor(address,bool)" "OWNER_ADDRESS" false)
```

## Project Structure

```
contracts/
├── foundry.toml       # Foundry configuration
├── src/               # Smart contracts
│   └── InnerCircleSBT.sol
├── test/              # Contract tests
│   └── InnerCircleSBT.t.sol
├── lib/               # Dependencies (forge-std, OpenZeppelin)
└── README.md          # This file
```

## Dependencies

- [Foundry](https://github.com/foundry-rs/foundry) - Ethereum development toolkit
- [OpenZeppelin Contracts v5.3.0](https://github.com/OpenZeppelin/openzeppelin-contracts) - Secure smart contract library
- [forge-std](https://github.com/foundry-rs/forge-std) - Foundry testing utilities

## Security

This contract prioritizes safety and transparency:

- Uses well-audited OpenZeppelin libraries
- Implements soulbound via explicit transfer blocking (no workarounds)
- Owner-only mint with two-step ownership transfer
- Comprehensive test coverage
- No payable functions or hidden backdoors
- No upgradeable proxy (immutable logic)

**This is a badge/membership token, not a financial instrument. No promises, no roadmap.**

## License

MIT

# Night Tools - 1/1 Cosmetic Badges

Three unique soulbound (non-transferable) 1/1 badges for Hood Street on Robinhood Chain (4663).

## Overview

Night Tools are cosmetic badges earned through real activity on Hood Street. Each badge can only be **claimed once** by the **first eligible wallet**. These are **not** a collection where everyone can earn a copy—there is exactly **one** Lantern, **one** Pick, and **one** Vein in existence.

### The Three Badges

| Badge | Token ID | Earning Criteria | Supply |
|-------|----------|------------------|--------|
| **Lantern** | 0 | First wallet to achieve seven real Vienna-day check-ins in a row | 1/1 |
| **Pick** | 1 | First wallet to complete a dig with a real neighbor | 1/1 |
| **Vein** | 2 | At most one per Vienna night, awarded to the first check-in of the day IF that wallet already found the Lantern | 1/1 |

### Visual Design

Each badge features:
- Iron frame with rivets
- Round window showing the tool
- Tiny "1/1" marking on the frame
- **Green hood wax seal** pressed into the picture when found
- Unfound badges are shown without the seal

### Rules & Properties

**Cosmetic Only**
- No effect on payouts, odds, desk-point amounts, or token balances
- Cannot be bought or sold
- No price, no public mint, no USDC, no HOOD reward
- Pure culture, no promises, no roadmap

**1/1 Scarcity**
- Each badge can only be claimed **once**
- First eligible wallet gets it permanently
- Soulbound (non-transferable after claim)
- Off-chain night ledger is the source of truth

**Desk Role**
- Contract owner (desk/minter role) records claims
- No automated on-chain eligibility checking
- Contract does not pretend to see streaks or the pot

## Contract

### Deployment

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export RPC_URL=https://rpc.mainnet.chain.robinhood.com
export INITIAL_OWNER=0x...
export BASE_IMAGE_URI=https://your-domain.com/images/night-tools/

# Deploy (when ready)
forge script script/DeployNightTools.s.sol:DeployNightTools --rpc-url $RPC_URL --broadcast --verify
```

**NOTE:** Deployment is **manual** and will be done separately. Not part of this PR.

### Testing

```bash
forge test
```

### Key Functions

- `claimBadge(address to, uint256 tokenId)` - Desk mints a 1/1 badge to the first eligible wallet
- `getBadgeStatus(uint256 tokenId)` - Check if a badge is claimed and by whom
- `hasBadge(address wallet, uint256 tokenId)` - Check if a specific wallet holds a badge
- `burn(uint256 tokenId)` - Owner can burn for moderation (allows re-claim)

### Safety Features

- ✅ Soulbound (transfers disabled after mint)
- ✅ No payable functions
- ✅ No fees, no tax, no hidden roles
- ✅ No upgradeable proxy
- ✅ No reentrancy risk (no external calls on mint)
- ✅ Ownable2Step for safe ownership transfer
- ✅ OpenZeppelin ERC-721 base

## Artwork

Badge images are stored in `/public/images/night-tools/`:
- `lantern.jpg` - Lantern badge with seal pressed in
- `pick.jpg` - Pick badge with seal pressed in
- `vein.jpg` - Vein badge with seal pressed in

## License

MIT

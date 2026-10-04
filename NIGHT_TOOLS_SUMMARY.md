# Night Tools Implementation Summary

## What Was Built

Three unique **1/1 soulbound cosmetic NFT badges** for Hood Street:

1. **Lantern** - First wallet with 7-day Vienna check-in streak
2. **Pick** - First wallet to dig with a neighbor  
3. **Vein** - Single first wallet that checks in AND already holds Lantern (only one ever)

## Key Design Decisions

### 1/1 Scarcity (Course Correction Applied)
- ✅ Each badge exists exactly **once**
- ✅ First eligible wallet finds it permanently
- ✅ No copies, no editions, no "everyone gets one"
- ✅ Once found, cannot be claimed by anyone else

### Soulbound Pattern
- ✅ Followed `InnerCircleSBT.sol` non-transferable design
- ✅ Transfers disabled after mint
- ✅ Only desk/minter role can claim badges
- ✅ Burn allowed (for moderation, enables re-claim)

### Cosmetic Only
- ✅ No effect on payouts, odds, desk-points, or token balances
- ✅ No public mint, no price, no USDC, no HOOD reward
- ✅ No copy saying "you can buy one"
- ✅ Off-chain night ledger is source of truth
- ✅ Contract does not pretend to see streaks or pot

### Visual Design
- ✅ Iron frame with round window showing tool
- ✅ Tiny "1/1" marking on frame
- ✅ Green hood wax seal **pressed into** found badges
- ✅ Unfound badges shown without seal (greyed out)
- ✅ Badge images committed at `/public/images/night-tools/`

## Files Created

### Contract
```
contracts/night-tools/
├── src/NightTools.sol              # 1/1 soulbound NFT contract
├── test/NightTools.t.sol           # Comprehensive test suite
├── script/DeployNightTools.s.sol   # Deployment script (manual only)
├── foundry.toml                    # Foundry config
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore patterns
└── README.md                       # Contract documentation
```

### UI Components
```
src/components/
├── NightToolsBadges.tsx            # Badge display component
└── NightToolsBadges.css            # Badge styling
```

### Artwork
```
public/images/night-tools/
├── lantern.jpg                     # Lantern badge with seal
├── pick.jpg                        # Pick badge with seal
└── vein.jpg                        # Vein badge (unchanged)
```

### Server
- Added `/api/night-tools/status` endpoint to `server/index.js`
- Returns badge status for a wallet (stub for now)
- TODO: Connect to real night ledger

### Integration
- Modified `src/pages/Street.tsx` to show badges
- Badges appear in personal stats section when connected
- Grey overlay when not earned, full display when earned

## Contract Key Functions

```solidity
// Claim a 1/1 badge for first eligible wallet (desk/minter role only)
function claimBadge(address to, uint256 tokenId) external onlyOwner

// Check if badge is claimed and by whom
function getBadgeStatus(uint256 tokenId) 
  external view returns (bool claimed, address finder, uint256 claimedAt)

// Check if specific wallet holds specific badge
function hasBadge(address wallet, uint256 tokenId) 
  external view returns (bool)

// Burn for moderation (allows re-claim)
function burn(uint256 tokenId) external onlyOwner
```

## Tests Coverage

✅ Constructor initialization  
✅ Claiming badges (Lantern, Pick, Vein)  
✅ Claiming all three to same wallet  
✅ Claiming to different wallets  
✅ Preventing duplicate claims  
✅ Badge status queries  
✅ Transfer blocking (soulbound)  
✅ Approval + transfer blocking  
✅ Owner burn and re-claim  
✅ Token URI generation  
✅ Base image URI updates  
✅ Ownable2Step ownership transfer  
✅ Interface support (ERC-721, ERC-165)  
✅ No payable functions  

## What's NOT Included

🚫 **No deployment** - Manual and later, not part of this PR  
🚫 **No deployer key** - Never committed to repo  
🚫 **No automated deploy** - Intentionally excluded  
🚫 **No live ledger integration** - API is stub for now  
🚫 **No badge tracking** - Night ledger connection needed  

## Deployment Instructions (When Ready)

```bash
cd contracts/night-tools

# Set environment variables
export PRIVATE_KEY=<never_commit_this>
export RPC_URL=https://rpc.mainnet.chain.robinhood.com
export INITIAL_OWNER=<desk_wallet_address>
export BASE_IMAGE_URI=<production_image_url>

# Deploy
forge script script/DeployNightTools.s.sol:DeployNightTools \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify
```

## Next Steps (Not in This PR)

1. **Connect to night ledger** - Hook up real badge tracking
2. **Deploy contract** - Manual deployment when ready
3. **Update API endpoint** - Connect `/api/night-tools/status` to ledger
4. **Test on testnet** - Verify contract before mainnet
5. **Update image URLs** - Point to production CDN if needed

## Pull Request

📦 **PR #20**: https://github.com/Laszlo23/hood-desk/pull/20  
🌿 **Branch**: `cursor/night-tools-1of1-badges-8da1`  
📝 **Status**: Draft (ready for review)

## Final Note

✅ **Contract and UI are complete**  
✅ **Tests at same level as other NFT contracts**  
✅ **Badge images committed**  
✅ **Deploy is manual and later**  
✅ **No deployer key in repo**  

This PR adds the infrastructure for Night Tools 1/1 badges. Deployment and ledger integration will be handled separately.

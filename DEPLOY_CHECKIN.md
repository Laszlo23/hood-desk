# Deploy and Verify Hood Street Check-In Contract

This guide walks through deploying the Hood Street check-in contract to Robinhood Chain (4663) and getting it verified on Blockscout.

## Current Status

**NOT YET DEPLOYED** — This PR includes:
- ✅ Check-in contract (`contracts/street-checkin/src/StreetCheckIn.sol`)
- ✅ Tests (`contracts/street-checkin/test/StreetCheckIn.t.sol`)
- ✅ Deployment script (`contracts/street-checkin/script/DeployStreetCheckIn.s.sol`)
- ✅ Frontend integration (`src/pages/Street.tsx`)
- ❌ Contract NOT deployed (requires deployer private key and gas)
- ❌ Contract NOT verified (requires manual Blockscout UI verification after deploy)

## Prerequisites

1. **Foundry installed** — https://book.getfoundry.sh/getting-started/installation
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **ETH on Robinhood Chain (4663)** for gas
   - Bridge ETH to Robinhood Chain
   - Chain ID: 4663
   - RPC: https://rpc.mainnet.chain.robinhood.com

3. **Deployer wallet private key** (NEVER commit this)

## Step 1: Configure Environment

```bash
cd contracts/street-checkin

# Create .env from template
cp .env.example .env

# Edit .env and set your PRIVATE_KEY
# PRIVATE_KEY=0x...
```

## Step 2: Build and Test

```bash
# Build the contract
forge build

# Run tests
forge test -vvv

# Optional: Gas report
forge test --gas-report
```

All tests should pass before deployment.

## Step 3: Deploy to Robinhood Chain

```bash
# Deploy (make sure .env has PRIVATE_KEY)
forge script script/DeployStreetCheckIn.s.sol:DeployStreetCheckIn \
  --rpc-url https://rpc.mainnet.chain.robinhood.com \
  --broadcast \
  --legacy

# SAVE THE DEPLOYED CONTRACT ADDRESS!
# Example output:
# StreetCheckIn deployed at: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4
```

**Why `--legacy`?** Robinhood Chain may not support EIP-1559, so we use legacy transactions to avoid gas estimation errors.

The deployed address will be in:
- Console output (look for "StreetCheckIn deployed at:")
- `broadcast/DeployStreetCheckIn.s.sol/4663/run-latest.json`

## Step 4: Verify on Blockscout

**Problem:** `forge verify-contract` fails because Cloudflare blocks Foundry's user-agent when calling the Blockscout API.

**Solution:** Manual verification via Blockscout UI.

### Manual Verification Steps

1. **Go to Blockscout:**  
   https://robinhoodchain.blockscout.com

2. **Search for your contract address**  
   Paste the deployed address in the search bar

3. **Click "Verify & Publish"**  
   Found in the "Code" tab or a button near the top

4. **Select verification method:**  
   Choose **"Solidity (Single file)"**

5. **Enter contract details:**
   - **Compiler:** `0.8.28`
   - **Optimization:** Enabled
   - **Runs:** `200`
   - **EVM Version:** default
   - **Contract name:** `StreetCheckIn`
   - **Solidity code:** Copy all of `src/StreetCheckIn.sol`
   - **Constructor arguments:** Leave empty (no constructor params)

6. **Submit for verification**

7. **Confirm success:**  
   - The "Code" tab should show the verified source
   - "Read Contract" and "Write Contract" tabs should appear
   - A green checkmark appears next to the contract address

### Alternative: Flatten Method

If single-file verification has issues:

```bash
# Flatten the contract
forge flatten src/StreetCheckIn.sol > StreetCheckIn-flattened.sol

# Remove duplicate SPDX lines (keep only one at the top)
# Then paste into Blockscout UI
```

### What to Check

After verification succeeds, visit:
```
https://robinhoodchain.blockscout.com/address/<YOUR_CONTRACT_ADDRESS>
```

You should see:
- ✅ Green verified checkmark
- ✅ Source code visible in "Code" tab
- ✅ "Read Contract" tab with view functions
- ✅ "Write Contract" tab with checkIn function

## Step 5: Configure Frontend

Once deployed **AND verified**, add the contract address to the frontend:

```bash
# In project root
echo "VITE_CHECKIN_CONTRACT=<YOUR_CONTRACT_ADDRESS>" >> .env.production

# Example:
# echo "VITE_CHECKIN_CONTRACT=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4" >> .env.production
```

Then rebuild:
```bash
npm run build
```

The frontend will automatically:
- Send on-chain check-in transactions when contract address is configured
- Show "Sign transaction..." and "Waiting for confirmation..." states
- Display transaction link to Blockscout after confirmation
- Update the night ledger after successful on-chain check-in
- Fall back to off-chain mode if contract address is not set

## Step 6: Test Check-In

1. Visit https://doghood.aibusiness.fun/#/street (or your deployment URL)
2. Connect your wallet (Robinhood Chain, chain 4663)
3. Click "Check in"
4. Sign the transaction in your wallet
5. Wait for confirmation
6. You should see:
   - "✓ Checked in" message
   - "View transaction" link to Blockscout
   - Your check-in recorded on the board

Check the contract on Blockscout:
```
https://robinhoodchain.blockscout.com/address/<CONTRACT_ADDRESS>#events
```

You should see a `CheckIn` event with your wallet address.

## Troubleshooting

### Deployment fails with "insufficient funds"
- Make sure you have ETH on Robinhood Chain (4663)
- Try adding `--legacy` flag if not already using it
- Check your wallet has enough gas (≈0.001 ETH should be plenty)

### Verification fails via forge verify-contract
- Use the Blockscout UI instead (see Step 4)
- Cloudflare blocks Foundry's API calls

### Frontend doesn't send transaction
- Check `VITE_CHECKIN_CONTRACT` is set in `.env.production`
- Rebuild with `npm run build`
- Check browser console for errors
- Make sure wallet is on Robinhood Chain (4663)

### Transaction reverts with "AlreadyCheckedInToday"
- You already checked in today (Vienna timezone)
- Wait until next Vienna day (UTC+1/UTC+2)
- Check `canCheckIn(address)` on Blockscout to see if you can check in

## Contract Interface

```solidity
// Write function
function checkIn() external

// Read functions
function canCheckIn(address wallet) external view returns (bool)
function getCurrentDay() external view returns (uint256)
function getLastCheckInDay(address wallet) external view returns (uint256)

// Event
event CheckIn(address indexed wallet, uint256 indexed day, uint256 timestamp)
```

## Security

- ✅ No owner, no admin, no upgradeability
- ✅ No payable functions
- ✅ No external calls
- ✅ Simple, auditable logic
- ✅ Tested extensively

## Links

- **Robinhood Chain RPC:** https://rpc.mainnet.chain.robinhood.com
- **Blockscout Explorer:** https://robinhoodchain.blockscout.com
- **Chain ID:** 4663
- **Foundry Book:** https://book.getfoundry.sh

## Questions?

Check the contract README:
```
contracts/street-checkin/README.md
```

Or review the contract source:
```
contracts/street-checkin/src/StreetCheckIn.sol
```

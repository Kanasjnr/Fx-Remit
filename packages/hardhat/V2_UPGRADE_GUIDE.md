# FXRemit V2 Upgrade Guide

## What's New in V2?

### Revolutionary Features:

**1. Permit2 Integration (1-Click Swaps)**
- No more separate approval transactions
- Sign a message, send tokens - done!
- Best-in-class user experience
- Same UX for single-hop and multi-hop swaps

**2. Upgradeable Swap Adapters**
- Add new DEXes without redeployment
- Switch between DEXes seamlessly
- Multi-chain ready (same contract, different adapters)
- Future-proof architecture

**3. USDT & USDC Support**
- Native support for major stablecoins
- Works with existing Mento infrastructure
- No bridges needed on Celo

---

## Architecture Overview

```
User
  ↓ (Signs Permit2 message - instant, gasless!)
FXRemitV2 Contract
  ↓ (Pulls tokens via Permit2)
  ↓ (Routes to appropriate adapter)
Swap Adapter (Mento/Uniswap/etc.)
  ↓ (Executes swap)
Recipient receives tokens
```

**All in ONE transaction!**

---

## Permit2: The Game Changer

### What is Permit2?

Permit2 is Uniswap's universal token approval system that works across ALL EVM chains.

**Universal Address:** `0x000000000022D473030F116dDEE9F6B43aC78BA3`
(Same address on Celo, Base, Arbitrum, Ethereum, etc.)

### Old Way vs. New Way

**Before (2 transactions):**
```
1. User: token.approve(fxRemit, amount) → Wait for confirmation
2. User: fxRemit.swapAndSend(...) → Wait for confirmation
Total: 2 tx, double gas, slower
```

**With Permit2 (1 transaction):**
```
1. User: Signs message (instant, free!)
2. User: fxRemit.swapAndSend(..., signature) → Done!
Total: 1 tx, half gas, instant
```

### First-Time Setup

**One-time per token:**
```
User approves Permit2 to manage their tokens
(This approval lasts forever)
```

**Then forever after:**
```
Sign message → Send
(No more approvals needed!)
```

---

## Adapter System

### What are Adapters?

Adapters are modular swap engines that connect FXRemit to different DEXes.

```solidity
interface ISwapAdapter {
    function swapSingle(...) external returns (uint256);
    function swapMultiHop(...) external returns (uint256);
}
```

### Current Adapters

**MentoAdapter** (Celo)
- Connects to Mento Protocol
- Supports all Mento stable pairs
- Optimized for multi-hop swaps
- Deployed with V2

### Adding New Adapters

**Example: Adding Uniswap Support**

1. Deploy UniswapAdapter
2. Call `addSwapAdapter(uniswapAddr)`
3. Call `setDefaultAdapter(uniswapAddr)`
4. Done! Now using Uniswap

**No redeployment. No migration. Just swap!**

---

## Contract Structure

### FXRemitV2.sol (Main Contract)
- Handles Permit2 transfers
- Manages token approvals
- Routes to adapters
- Collects fees
- Stores remittance data

### MentoAdapter.sol
- Wraps Mento broker calls
- Handles single-hop swaps
- Handles multi-hop swaps
- Returns output to FXRemit

### ISwapAdapter.sol (Interface)
- Standard for all adapters
- Ensures compatibility
- Makes adding DEXes easy

---

## Deployment

### Full Deployment Process

```bash
cd packages/hardhat
npx hardhat run scripts/deployV2.ts --network celo
```

### What It Does:

1. Deploys FXRemitV2 (main contract)
2. Deploys MentoAdapter
3. Connects adapter to FXRemit
4. Adds all 17 tokens (including USDT/USDC)
5. Verifies configuration

### Output:

```
FXRemitV2: 0x...
MentoAdapter: 0x...
Permit2: 0x000000000022D473030F116dDEE9F6B43aC78BA3
```

---

## Supported Tokens

### Mento Stablecoins (15):
- cUSD, cEUR, cGBP, cCAD, cAUD
- cCHF, cJPY, cREAL, cCOP
- cKES, cNGN, cZAR, cGHS
- eXOF, PUSO

### NEW Stablecoins (2):
- USDT (Tether)
- USDC (USD Coin)

**Total: 17 tokens ready to use!**

---

## Usage Examples

### Single-Hop Swap (USDT → cUSD)

**Contract Call:**
```solidity
fxRemitV2.swapAndSend(
    recipient,
    USDT_ADDRESS,
    cUSD_ADDRESS,
    amount,
    minOut,
    "USDT",
    "cUSD",
    "USDT-cUSD",
    providerAddr,
    exchangeId,
    deadline,
    permitSignature  // User signed this off-chain!
);
```

**User Experience:**
1. Click "Send"
2. Sign message (instant)
3. Transaction confirmed
4. Done!

### Multi-Hop Swap (USDT → cUSD → cKES)

**Contract Call:**
```solidity
fxRemitV2.swapAndSendPath(
    recipient,
    USDT_ADDRESS,
    cUSD_ADDRESS,  // Intermediate
    cKES_ADDRESS,
    amount,
    minOut,
    "USDT",
    "cKES",
    "USDT-cKES",
    providerAddr1,
    exchangeId1,
    providerAddr2,
    exchangeId2,
    deadline,
    permitSignature
);
```

**User Experience:** Same as single-hop!
1. Click "Send"
2. Sign message
3. Done!

---

## Adapter Management

### List All Adapters

```bash
npx hardhat run scripts/adapters/listAdapters.ts --network celo
```

### Add New Adapter

```bash
export FX_REMIT_V2_ADDRESS="0x..."
export NEW_ADAPTER_ADDRESS="0x..."
npx hardhat run scripts/adapters/addAdapter.ts --network celo
```

### Set Default Adapter

```bash
export FX_REMIT_V2_ADDRESS="0x..."
export ADAPTER_ADDRESS="0x..."
npx hardhat run scripts/adapters/setDefault.ts --network celo
```

### Owner Functions

```solidity
// Add adapter (makes it available)
function addSwapAdapter(address adapter) external onlyOwner

// Remove adapter (must not be default)
function removeSwapAdapter(address adapter) external onlyOwner

// Set active adapter
function setDefaultAdapter(address adapter) external onlyOwner
```

---

## Multi-Chain Deployment

### Deploy on Multiple Chains

**Celo:**
```bash
npx hardhat run scripts/deployV2.ts --network celo
# Uses MentoAdapter
```

**Base:**
```bash
npx hardhat run scripts/deployV2.ts --network base
# Deploy with UniswapAdapter or AerodromeAdapter
```

**Arbitrum:**
```bash
npx hardhat run scripts/deployV2.ts --network arbitrum
# Deploy with CamelotAdapter or UniswapAdapter
```

**Same contract code, different adapters!**

### Multi-Chain Benefits

- Permit2 works everywhere (universal address)
- Same contract logic
- Chain-specific adapters
- Easy expansion

---

## Frontend Integration

### Detecting Permit2 Approval

```typescript
const permit2Address = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const userApproval = await token.allowance(userAddress, permit2Address);

if (userApproval < amount) {
    // Show "Enable 1-click swaps" button
    await token.approve(permit2Address, MAX_UINT256);
}
```

### Generating Permit2 Signature

```typescript
const domain = {
    name: "Permit2",
    chainId: 42220,
    verifyingContract: permit2Address
};

const types = {
    PermitTransferFrom: [
        { name: "permitted", type: "TokenPermissions" },
        { name: "spender", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
    ],
    TokenPermissions: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" }
    ]
};

const value = {
    permitted: {
        token: tokenAddress,
        amount: amountIn
    },
    spender: fxRemitV2Address,
    nonce: nonceValue,
    deadline: deadlineTimestamp
};

const signature = await signer._signTypedData(domain, types, value);
```

### Making the Swap

```typescript
await fxRemitV2.swapAndSend(
    recipient,
    fromToken,
    toToken,
    amount,
    minOut,
    fromCurrency,
    toCurrency,
    corridor,
    providerAddr,
    exchangeId,
    deadline,
    signature  // Pass the signature!
);
```

---

## Token Management

### Add New Token

```solidity
fxRemitV2.addSupportedToken(
    "0xTOKEN_ADDRESS",
    "SYMBOL"
);
```

### Batch Add Tokens

```solidity
fxRemitV2.batchAddTokens(
    ["0xADDR1", "0xADDR2"],
    ["TOKEN1", "TOKEN2"]
);
```

### Remove Token

```solidity
fxRemitV2.removeSupportedToken("0xTOKEN_ADDRESS");
```

---

## Benefits

### For Users:
- Faster swaps (1 transaction)
- Lower gas costs (half the gas)
- Better UX (sign and send)
- No waiting for approvals

### For You (Owner):
- Add tokens anytime (no redeploy)
- Add DEXes anytime (no redeploy)
- Multi-chain expansion easy
- Future-proof design

### Technical:
- Industry-standard Permit2
- Modular adapter system
- Clean separation of concerns
- Easy to maintain and upgrade

---

## Migration from V1

### For Users:
- V1 transactions still visible
- V1 contract still accessible
- No action required
- V2 optional upgrade

### For Owner:
1. Deploy V2 alongside V1
2. Update frontend to support both
3. New swaps go through V2
4. Old history stays in V1
5. Seamless transition

### Frontend Strategy:

```typescript
const contracts = {
    v1: "0xOLD_ADDRESS",
    v2: "0xNEW_ADDRESS"
};

// Read history from both
const v1History = await fetchHistory(contracts.v1);
const v2History = await fetchHistory(contracts.v2);
const allHistory = [...v1History, ...v2History];

// New swaps use V2
await swapOnV2(...);
```

---

## Security Considerations

### Permit2 Security:
- Audited by Trail of Bits
- Used by Uniswap, 1inch, etc.
- Industry standard
- No known exploits

### Adapter Security:
- Each adapter isolated
- Adapters can't access FXRemit funds
- Owner controls adapter list
- Can pause/remove malicious adapters

### Contract Security:
- ReentrancyGuard on all functions
- Ownable for admin functions
- Pausable for emergencies
- SafeERC20 for token transfers

---

## Emergency Procedures

### Pause Contract

```solidity
fxRemitV2.pause();
```
Stops all swaps immediately.

### Remove Malicious Adapter

```solidity
fxRemitV2.setDefaultAdapter(safeAdapter);
fxRemitV2.removeSwapAdapter(maliciousAdapter);
```

### Unpause

```solidity
fxRemitV2.unpause();
```

---

## Testing Checklist

Before mainnet:

- [ ] Deploy to Alfajores testnet
- [ ] Test Permit2 approval flow
- [ ] Test single-hop swap
- [ ] Test multi-hop swap
- [ ] Test USDT → cUSD
- [ ] Test USDC → cUSD
- [ ] Test adapter switching
- [ ] Test adding new token
- [ ] Test fee collection
- [ ] Test pause/unpause
- [ ] Frontend integration
- [ ] Load testing

---

## FAQ

**Q: Does Permit2 work on all chains?**
A: Yes! Same address on all EVM chains.

**Q: Can I still use V1?**
A: Yes! V1 stays live, V2 is an upgrade.

**Q: Do I need to migrate V1 data?**
A: No! Just read from both contracts.

**Q: Can I add non-Mento DEXes?**
A: Yes! Deploy an adapter and add it.

**Q: What if Permit2 has issues?**
A: Permit2 is battle-tested and used by major protocols.

**Q: Can I have multiple adapters active?**
A: One default adapter, but can switch anytime.

**Q: Does multi-hop still work?**
A: Yes! Same functionality, better UX.

**Q: What about non-EVM chains?**
A: Use bridges. V2 works on source EVM chain.

---

## Roadmap

### V2.0 (Now)
- Permit2 integration
- Mento adapter
- USDT/USDC support
- Upgradeable adapters

### V2.1 (Next)
- UniswapV3 adapter
- Base chain deployment
- Cross-chain aggregation
- More stablecoins

### V2.2 (Future)
- Bridge integrations
- Non-EVM chain support
- Advanced routing
- Gas optimizations

---

## Support

**Documentation:** This guide  
**Contract:** FXRemitV2.sol  
**Adapters:** /contracts/adapters/  
**Scripts:** /scripts/  

**Questions?** Review this guide and contract code.

---

**Version:** 2.0.0  
**Date:** 2025  
**Author:** FX Remit Team

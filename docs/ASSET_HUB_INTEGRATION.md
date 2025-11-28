# Asset Hub Integration: USDC and USDT in FX Remit

**Last Updated: November 2025**

## Executive Summary

Polkadot completed a major migration to Asset Hub in November 2025, making it the central hub for asset management. This document outlines how FX Remit can integrate native USDC and USDT from Asset Hub.

**Key Update (November 2025):**
- Migration completed November 4, 2025
- Asset Hub now manages balances, staking, and governance (moved from Relay Chain)
- 1.63 billion DOT transferred across 1.5M+ accounts
- Lower fees: existential deposit reduced from 1 DOT to 0.01 DOT
- Can pay transaction fees in any supported asset (USDC, USDT, etc.)
- Enhanced cross-chain interoperability

---

## Current Status: Asset Hub (November 2025)

### What Changed

**Migration Impact:**
- Asset Hub is now the primary asset management chain for Polkadot
- Native USDC and USDT are fully supported and actively used
- Lower transaction costs make it more viable for remittances
- Flexible fee payment (pay in USDC/USDT instead of DOT)

**Technical Status:**
- **NEW (2025)**: Polkadot Hub now supports PolkaVM smart contracts with Ethereum compatibility
- PolkaVM is in **Preview Release** - early stage, may be unstable
- Supports Solidity contracts (see [Polkadot Smart Contracts Tutorial](https://docs.polkadot.com/tutorials/smart-contracts/launch-your-first-project/create-contracts/))
- Built on Substrate (Rust runtime)
- Uses XCM for cross-chain communication
- Native asset conversion available for supported pairs

---

## Integration Approach for FX Remit

### Option 1: Direct Deployment on Polkadot Hub (NEW - Preview)

**NEW Possibility:**
Polkadot Hub now supports Solidity smart contracts via PolkaVM! This means we could potentially deploy FX Remit contracts directly on Polkadot Hub.

**Current Status:**
- PolkaVM is in **Preview Release** (early-stage, may be unstable)
- Supports Solidity with Ethereum compatibility
- Tutorial available for contract development
- Production readiness: TBD

**If Production-Ready:**
1. Deploy FX Remit contracts directly on Polkadot Hub
2. Access native USDC/USDT directly (no XCM needed)
3. Execute swaps on-chain or via Asset Hub conversion
4. Bridge results to Celo for recipients

**Advantages:**
- Direct access to native USDC/USDT
- No XCM complexity for initial transfer
- Lower fees (no intermediate chain)
- Simpler architecture

**Considerations:**
- Still in preview stability concerns
- Need to verify production readiness
- May require contract adaptations for PolkaVM
- Limited ecosystem/tooling compared to Moonbeam

### Option 2: Hybrid Architecture (Fallback/Alternative)

**If PolkaVM Not Ready:**
1. Deploy FX Remit contracts on Moonbeam (EVM-compatible Polkadot parachain)
2. Use XCM to transfer USDC/USDT from Asset Hub to Moonbeam
3. Execute swaps on Moonbeam using DEX integrations
4. Bridge results to Celo (or other chains) for recipients

**Why This Works:**
- Moonbeam supports Solidity (can reuse existing contracts)
- XCM enables seamless Asset Hub → Moonbeam transfers
- Access to native Asset Hub USDC/USDT
- Lower fees post-migration
- Proven, production-ready infrastructure

---

## Integration Flow

### User Journey: Asset Hub USDC → Celo cNGN

1. **User on Asset Hub**
   - Holds native USDC
   - Initiates remittance via FX Remit interface

2. **XCM Transfer**
   - USDC transferred from Asset Hub to Moonbeam via XCM
   - Takes 2-5 minutes
   - User pays fees in USDC (new post-migration feature)

3. **Swap Execution**
   - FX Remit contract on Moonbeam receives USDC
   - Swaps USDC to target currency via Moonbeam DEX
   - Or bridges to Celo first, then swaps via Mento

4. **Final Delivery**
   - Currency sent to recipient on destination chain
   - Transaction complete

---

## Key Considerations

### Advantages

- **Native Assets**: Access to real USDC/USDT, not wrapped versions
- **Lower Fees**: Post-migration fee reductions benefit users
- **Flexible Payments**: Users can pay fees in USDC/USDT
- **Cross-Chain**: Enables remittances from Polkadot to Celo and beyond
- **Ecosystem Access**: Tap into Polkadot's user base

### Challenges

- **PolkaVM Maturity**: Still in preview - stability and production readiness unknown
- **XCM Complexity**: Requires XCM integration knowledge (if using Moonbeam)
- **Multi-Chain UX**: Users need to understand cross-chain flow
- **Bridge Delays**: XCM/bridge transfers add 2-5 minutes (if using Moonbeam)
- **Gas Tokens**: Need DOT for transactions, may need other tokens for bridges

### Solutions

- **Option 1**: Deploy directly on Polkadot Hub using PolkaVM (if production-ready)
- **Option 2**: Deploy on Moonbeam (EVM-compatible) with XCM for Asset Hub transfers
- Build clear UX showing progress for each step
- Provide fee breakdown (XCM + swap + platform, or just swap + platform if direct)
- Support both Polkadot.js and MetaMask wallets

---

## Implementation Steps

### Phase 1: Research & Setup
- **Evaluate PolkaVM**: Test PolkaVM on Polkadot Hub testnet
- **Deploy Test Contracts**: Try deploying FX Remit contracts on Polkadot Hub
- **Assess Stability**: Determine if PolkaVM is production-ready
- **Fallback Plan**: If not ready, test XCM transfers and Moonbeam deployment
- **Evaluate DEX Options**: Check swap liquidity on Polkadot Hub vs Moonbeam
- **Test Bridge to Celo**: Verify cross-chain bridge functionality

### Phase 2: Development
- **If PolkaVM Ready**: Adapt FX Remit contracts for Polkadot Hub/PolkaVM
- **If Moonbeam**: Adapt FX Remit contracts for Moonbeam
- Build XCM integration layer (only if using Moonbeam)
- Create bridge adapter for Celo
- Update frontend for multi-chain support

### Phase 3: Testing
- **If PolkaVM**: End-to-end test on Polkadot Hub → Celo
- **If Moonbeam**: End-to-end test: Asset Hub → Moonbeam → Celo
- Test all currency corridors
- Security audit
- Performance testing

### Phase 4: Launch
- Gradual rollout
- Monitor XCM transfers
- User support
- Iterate based on feedback

---

## Technical Architecture

### Option 1: Direct on Polkadot Hub (If PolkaVM Ready)

```
┌──────────────────┐              Bridge              ┌──────────────┐
│  Polkadot Hub    │─────────────────────────────────►│     Celo     │
│                  │                                   │              │
│ Native USDC/USDT│                                   │   Recipient  │
│ FX Remit Contract│                                   │   Receives   │
│ Direct Swaps     │                                   │   cNGN/etc   │
└──────────────────┘                                   └──────────────┘
```

**Components:**
- **Polkadot Hub**: Native USDC/USDT, FX Remit contracts, swap execution
- **Celo**: Final destination, Mento Protocol integration (if needed)

### Option 2: Hybrid via Moonbeam (Fallback)

```
┌──────────────┐    XCM     ┌──────────────┐    Bridge    ┌──────────────┐
│  Asset Hub   │──────────►│  Moonbeam    │─────────────►│     Celo     │
│              │            │              │              │              │
│ Native USDC  │            │ FX Remit    │              │   Recipient  │
│ Native USDT  │            │ Contracts   │              │   Receives   │
│              │            │ DEX Swaps   │              │   cNGN/etc   │
└──────────────┘            └──────────────┘              └──────────────┘
```

**Components:**
- **Asset Hub**: Native USDC/USDT storage, XCM initiation
- **Moonbeam**: FX Remit contracts, swap execution, XCM receiver
- **Celo**: Final destination, Mento Protocol integration (if needed)

---

## User Experience

### What Users See

1. **Initiation**: Select USDC on Asset Hub, choose destination currency
2. **Fees**: See breakdown (XCM fee + swap fee + platform fee)
3. **Progress**: Track 3 steps (XCM transfer → Swap → Delivery)
4. **Completion**: Receive confirmation with all transaction hashes

### Key UX Features

- Clear chain indicators (Asset Hub, Moonbeam, Celo)
- Real-time progress for each step
- Estimated time (3-5 minutes total)
- Transaction hash links for each chain
- Background processing (can close tab, get notification)

---

## Economic Model

### Fee Structure

- **Platform Fee**: 1.5% (maintained)
- **XCM Transfer**: ~$0.50-2.00 (varies)
- **Swap Fee**: Variable (DEX-dependent)
- **Bridge Fee**: ~$2-5 (if bridging to Celo)
- **Total**: Higher than single-chain, but competitive for cross-chain

### Revenue Opportunities

- Access to Polkadot ecosystem users
- New remittance corridors
- Premium routing options
- Volume-based pricing

---

## Security Considerations

- Use audited XCM implementations
- Security audit for Moonbeam contracts
- Bridge security (use reputable bridges)
- Multi-chain state management
- Error handling and recovery

---

## Next Steps

1. **Immediate**: 
   - Test PolkaVM on Polkadot Hub testnet
   - Deploy simple test contract following [Polkadot Smart Contracts Tutorial](https://docs.polkadot.com/tutorials/smart-contracts/launch-your-first-project/create-contracts/)
   - Assess PolkaVM production readiness
   
2. **Short-term**: 
   - If PolkaVM ready: Deploy POC on Polkadot Hub
   - If not ready: Deploy POC on Moonbeam testnet
   - Test with native USDC/USDT
   
3. **Medium-term**: Full development and testing
4. **Long-term**: Mainnet launch and iteration

---

## Conclusion

The November 2025 migration makes Asset Hub integration more viable:
- Lower fees improve economics
- Flexible fee payment enhances UX
- Centralized asset management simplifies integration
- Native USDC/USDT provides real value
- **NEW**: PolkaVM smart contract support (Preview Release)

**Recommended Path:** 
1. **First**: Evaluate PolkaVM on Polkadot Hub - if production-ready, deploy directly there (simplest path)
2. **Fallback**: If PolkaVM not ready, deploy on Moonbeam with XCM integration to Asset Hub

**Key Decision Point:** Assess PolkaVM stability and production readiness. If stable, direct deployment on Polkadot Hub eliminates XCM complexity and provides the best user experience.

**Reference:** [Polkadot Smart Contracts Tutorial](https://docs.polkadot.com/tutorials/smart-contracts/launch-your-first-project/create-contracts/)

---

*For questions or updates, refer to the FX Remit development team.*

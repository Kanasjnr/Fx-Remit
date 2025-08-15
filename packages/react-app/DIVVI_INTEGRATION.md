# Divvi Referral SDK Integration

This document describes the Divvi referral tracking integration in the FX-Remit dapp.

## Overview

The FX-Remit dapp has been integrated with the Divvi Referral SDK to enable referral tracking for all blockchain transactions. This allows users to earn rewards for referring others to the platform.

## Consumer Address

- **Consumer Address**: `0x817c19bD1Ba4eD47e180a3219d12d1462C8fABDC`

## Integration Details

### 1. Hook Implementation (`useDivvi.ts`)

The `useDivvi` hook provides three main functions:

- `generateReferralTag()`: Generates a referral tag for the current user
- `addReferralTagToTransaction(transactionData)`: Appends the referral tag to transaction data
- `submitReferralTransaction(txHash)`: Submits the transaction hash to Divvi for tracking

### 2. Transaction Integration

#### Swap Transactions (`useEthersSwap.ts`)
- All Mento swap transactions include referral tags
- Both single-hop and multi-hop swaps are tracked
- Referral submission happens after transaction confirmation

#### Contract Transactions (`useContract.ts`)
- FX-Remit contract interactions (logRemittance) include referral tracking
- Uses wagmi's `useWriteContract` with automatic referral submission

### 3. Error Handling

The integration includes robust error handling:
- If referral tag generation fails, transactions proceed without referral tracking
- If referral submission fails, it doesn't break the main transaction flow
- All errors are logged for debugging but don't affect user experience

## How It Works

1. **Before Transaction**: A referral tag is generated for the user
2. **During Transaction**: The referral tag is appended to the transaction data
3. **After Transaction**: The transaction hash is submitted to Divvi for tracking

## Testing

Run the Divvi integration tests:

```bash
npm test -- useDivvi.test.ts
```

## Benefits

- **User Rewards**: Users can earn rewards for referring others
- **Analytics**: Track referral performance and user acquisition
- **Seamless Integration**: No impact on existing transaction flows
- **Error Resilience**: Graceful handling of any Divvi service issues

## Technical Notes

- Uses Divvi Referral SDK v2.2.0
- Compatible with Celo mainnet (chain ID 42220)
- Supports all transaction types in the dapp
- Follows Divvi's recommended integration patterns 
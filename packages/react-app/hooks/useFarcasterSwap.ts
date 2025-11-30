/**
 * Farcaster-specific swap logic
 * 
 * This file contains ONLY Farcaster Mini App transaction logic.
 * It uses EIP-5792 wallet_sendCalls for batch transactions with Permit2.
 * Uses V2 contract with Permit2 integration.
 * 
 * IMPORTANT: This is ONLY for Farcaster Mini App.
 * 
 * DO NOT modify this file unless you're specifically fixing Farcaster issues.
 */

import { useAccount, useWalletClient, useSendCalls, useChainId } from 'wagmi';
import { useMemo } from 'react';
import { Mento } from '@mento-protocol/mento-sdk';
import { providers, Contract, ethers } from 'ethers';
import { encodeFunctionData } from 'viem';
import {
  Currency,
  getTokenAddress,
  getContractV2Address,
} from '../lib/contracts';
import { useDivvi } from './useDivvi';
import FXRemitV2ABI from '../ABI/FXRemitV2.json';
import {
  PERMIT2_TYPES,
  getPermit2Domain,
  createPermit2Message,
  checkPermit2Approval,
  getPermit2Nonce,
  PERMIT2_ADDRESS,
} from '../lib/permit2';

const CELO_CHAIN_ID = 42220;
const CELO_RPC = 'https://forno.celo.org';
const SLIPPAGE_TOLERANCE = 98;
const PERMIT_DEADLINE_HOURS = 1;

const DECIMALS_ABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const ERC20_APPROVE_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

interface SwapParams {
  fromCurrency: Currency;
  toCurrency: Currency;
  amount: string;
  minAmountOut?: string;
  recipientAddress?: string;
}

interface SwapResult {
  success: boolean;
  pending?: boolean;
  callsId?: string;
  amountOut: string;
  recipient: string;
  message: string;
}

async function getTokenDecimals(
  tokenAddress: string,
  provider: providers.JsonRpcProvider
) {
  const tokenContract = new Contract(tokenAddress, DECIMALS_ABI, provider);
  return await tokenContract.decimals();
}

async function calculateSwapAmounts(
  mento: Mento,
  fromToken: string,
  toToken: string,
  amount: string,
  fromDecimals: number,
  toDecimals: number,
  minAmountOut?: string
) {
  const amountInWei = ethers.utils.parseUnits(amount, fromDecimals);
  const quoteAmountOut = await mento.getAmountOut(
    fromToken,
    toToken,
    amountInWei.toString()
  );

  const quoteBigInt = BigInt(quoteAmountOut.toString());
  const expectedAmountOut = minAmountOut
    ? ethers.utils.parseUnits(minAmountOut, toDecimals).toString()
    : ((quoteBigInt * BigInt(SLIPPAGE_TOLERANCE)) / BigInt(100)).toString();

  const formattedAmountOut = ethers.utils.formatUnits(
    expectedAmountOut,
    toDecimals
  );

  return {
    amountInWei,
    expectedAmountOut,
    formattedAmountOut,
  };
}

async function preparePermit2ForFarcaster(
  provider: providers.JsonRpcProvider,
  fromTokenAddress: string,
  signerAddress: string,
  amountInWei: ethers.BigNumber,
  fxRemitV2Address: string,
  chainId: number,
  walletClient: any
) {
  const deadline = Math.floor(Date.now() / 1000) + PERMIT_DEADLINE_HOURS * 3600;
  const nonce = await getPermit2Nonce(provider, signerAddress);
  const permit2Message = createPermit2Message(
    fromTokenAddress,
    amountInWei.toString(),
    fxRemitV2Address,
    nonce,
    deadline.toString()
  );
  const permit2Domain = getPermit2Domain(chainId);

  const permitSignature = await walletClient.signTypedData({
    account: signerAddress as `0x${string}`,
    domain: permit2Domain,
    types: PERMIT2_TYPES,
    primaryType: 'PermitTransferFrom',
    message: permit2Message,
  } as any);

  return { permitSignature, nonce, deadline };
}

function findMultiHopPath(
  tradablePair: any,
  fromTokenAddress: string,
  toTokenAddress: string
) {
  if (tradablePair.path.length !== 2) return null;

  const firstHop = tradablePair.path[0].assets.includes(fromTokenAddress)
    ? tradablePair.path[0]
    : tradablePair.path[1];
  const secondHop =
    firstHop === tradablePair.path[0]
      ? tradablePair.path[1]
      : tradablePair.path[0];

  if (
    !firstHop.assets.includes(fromTokenAddress) ||
    !secondHop.assets.includes(toTokenAddress)
  ) {
    return null;
  }

  const intermediateToken = firstHop.assets.find(
    (asset: string) =>
      secondHop.assets.includes(asset) &&
      asset !== fromTokenAddress &&
      asset !== toTokenAddress
  );

  if (!intermediateToken) return null;

  return { firstHop, secondHop, intermediateToken };
}

export function useFarcasterSwap() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { sendCallsAsync } = useSendCalls();
  const chainId = useChainId();
  const { addReferralTagToTransaction } = useDivvi();

  const walletReadiness = useMemo(
    () => ({
      isConnected: isConnected && !!address,
      hasWalletClient: !!walletClient,
      hasSendCallsAsync: !!sendCallsAsync,
      isFullyReady:
        isConnected && !!address && !!walletClient && !!sendCallsAsync,
    }),
    [isConnected, address, walletClient, sendCallsAsync]
  );

  const swap = async (
    fromCurrency: Currency,
    toCurrency: Currency,
    amount: string,
    minAmountOut?: string,
    recipientAddress?: string
  ): Promise<SwapResult> => {
    if (!walletReadiness.isConnected) {
      throw new Error('Wallet not connected');
    }

    if (!walletClient) {
      throw new Error('Wallet client not available');
    }

    if (!sendCallsAsync) {
      throw new Error('Farcaster Mini App requires sendCallsAsync capability');
    }

    if (!address) {
      throw new Error('Wallet address not available');
    }

    try {
      const currentChainId = await walletClient.getChainId();
      if (currentChainId !== CELO_CHAIN_ID) {
        await walletClient.switchChain({ id: CELO_CHAIN_ID });
      }
    } catch (e) {
      console.error('Chain switch failed:', e);
      throw new Error('Please switch your wallet to Celo network');
    }

    // Ensure we're on Celo (chainId 42220)
    if (chainId !== CELO_CHAIN_ID) {
      throw new Error(`Invalid chain. Expected Celo (${CELO_CHAIN_ID}), got ${chainId}`);
    }

    const celoChainId = CELO_CHAIN_ID;
    const fromTokenAddress = getTokenAddress(celoChainId, fromCurrency);
    const toTokenAddress = getTokenAddress(celoChainId, toCurrency);

    const provider = new providers.JsonRpcProvider(CELO_RPC);
    const signerAddress = address;

    const mento = await Mento.create(provider);
    const exchanges = await mento.getExchanges();

    if (exchanges.length === 0) {
      throw new Error('No exchanges available');
    }

    const [fromDecimals, toDecimals] = await Promise.all([
      getTokenDecimals(fromTokenAddress, provider),
      getTokenDecimals(toTokenAddress, provider),
    ]);

    const { amountInWei, expectedAmountOut, formattedAmountOut } =
      await calculateSwapAmounts(
        mento,
        fromTokenAddress,
        toTokenAddress,
        amount,
        fromDecimals,
        toDecimals,
        minAmountOut
      );

    const fxRemitV2Address = getContractV2Address(celoChainId);
    if (!fxRemitV2Address) {
      throw new Error('FXRemitV2 address not configured');
    }

    const permit2Allowance = await checkPermit2Approval(
      provider,
      fromTokenAddress,
      signerAddress,
      ethers
    );

    const batchedCalls: { to: `0x${string}`; data: `0x${string}` }[] = [];

    if (permit2Allowance < BigInt(amountInWei.toString())) {
      const approvalData = encodeFunctionData({
        abi: ERC20_APPROVE_ABI as any,
        functionName: 'approve',
        args: [
          PERMIT2_ADDRESS as `0x${string}`,
          ethers.constants.MaxUint256,
        ],
      });

      batchedCalls.push({
        to: fromTokenAddress as `0x${string}`,
        data: approvalData as `0x${string}`,
      });
    }

    // Prepare Permit2 signature
    const { permitSignature, nonce, deadline } = await preparePermit2ForFarcaster(
      provider,
      fromTokenAddress,
      signerAddress,
      amountInWei,
      fxRemitV2Address,
      celoChainId,
      walletClient
    );

    // Get token symbols from contract
    const fxRemitContract = new Contract(fxRemitV2Address, FXRemitV2ABI, provider);
    const [contractFromSymbol, contractToSymbol] = await Promise.all([
      fxRemitContract.getTokenSymbol(fromTokenAddress),
      fxRemitContract.getTokenSymbol(toTokenAddress),
    ]);

    const tradablePair = await mento.findPairForTokens(
      fromTokenAddress,
      toTokenAddress
    );

    if (!tradablePair) {
      throw new Error(
        `No tradable pair found for ${fromCurrency} → ${toCurrency}`
      );
    }

    const corridor = `${contractFromSymbol}-${contractToSymbol}`;
    const finalRecipient = recipientAddress ?? signerAddress;

    if (tradablePair.path.length === 1) {
      // Single-hop swap
      const hop = tradablePair.path[0];
      const rawSwapData = encodeFunctionData({
        abi: FXRemitV2ABI as any,
        functionName: 'swapAndSend',
        args: [
          finalRecipient as `0x${string}`,
          fromTokenAddress as `0x${string}`,
          toTokenAddress as `0x${string}`,
          BigInt(amountInWei.toString()),
          BigInt(expectedAmountOut),
          contractFromSymbol,
          contractToSymbol,
          corridor,
          hop.providerAddr as `0x${string}`,
          hop.id,
          BigInt(nonce),
          BigInt(deadline),
          permitSignature as `0x${string}`,
        ],
      });

      const dataWithReferral = addReferralTagToTransaction(rawSwapData);
      batchedCalls.push({
        to: fxRemitV2Address as `0x${string}`,
        data: dataWithReferral as `0x${string}`,
      });

      const callsResult = await sendCallsAsync({
        calls: batchedCalls,
        chainId: celoChainId,
      });
      const callsId =
        typeof callsResult === 'string' ? callsResult : callsResult?.id;

      if (!callsId) {
        throw new Error('No callsId returned - transaction may have failed');
      }

      return {
        success: true,
        pending: true,
        callsId,
        amountOut: formattedAmountOut,
        recipient: finalRecipient,
        message: `Sent ${amount} ${fromCurrency} → ${toCurrency}`,
      };
    }

    // Multi-hop swap
    if (tradablePair.path.length === 2) {
      const multiHopPath = findMultiHopPath(
        tradablePair,
        fromTokenAddress,
        toTokenAddress
      );

      if (!multiHopPath) {
        throw new Error('Could not determine multi-hop path');
      }

      const { firstHop: hop1, secondHop: hop2, intermediateToken } = multiHopPath;

      const intermediateAmountQuote = await mento.getAmountOut(
        fromTokenAddress,
        intermediateToken,
        amountInWei.toString()
      );

      const minIntermediateOut = (
        (BigInt(intermediateAmountQuote.toString()) * BigInt(SLIPPAGE_TOLERANCE)) /
        BigInt(100)
      ).toString();

      const rawSwapData = encodeFunctionData({
        abi: FXRemitV2ABI as any,
        functionName: 'swapAndSendPath',
        args: [
          finalRecipient as `0x${string}`,
          fromTokenAddress as `0x${string}`,
          intermediateToken as `0x${string}`,
          toTokenAddress as `0x${string}`,
          BigInt(amountInWei.toString()),
          BigInt(minIntermediateOut),
          BigInt(expectedAmountOut),
          contractFromSymbol,
          contractToSymbol,
          corridor,
          hop1.providerAddr as `0x${string}`,
          hop1.id,
          hop2.providerAddr as `0x${string}`,
          hop2.id,
          BigInt(nonce),
          BigInt(deadline),
          permitSignature as `0x${string}`,
        ],
      });

      const dataWithReferral = addReferralTagToTransaction(rawSwapData);
      batchedCalls.push({
        to: fxRemitV2Address as `0x${string}`,
        data: dataWithReferral as `0x${string}`,
      });

      console.log('Submitting Farcaster batch transaction (multi-hop):', {
        chainId: celoChainId,
        callsCount: batchedCalls.length,
      });

      const callsResult = await sendCallsAsync({
        calls: batchedCalls,
        chainId: celoChainId,
      });
      const callsId =
        typeof callsResult === 'string' ? callsResult : callsResult?.id;

      console.log('Farcaster multi-hop batch submitted successfully:', {
        callsId,
        txCount: batchedCalls.length,
      });

      if (!callsId) {
        throw new Error('No callsId returned - transaction may have failed');
      }

      return {
        success: true,
        pending: true,
        callsId,
        amountOut: formattedAmountOut,
        recipient: finalRecipient,
        message: `Sent ${amount} ${fromCurrency} → ${toCurrency}`,
      };
    }

    throw new Error(
      `Unsupported path length: ${tradablePair.path.length}`
    );
  };

  return {
    swap,
    isWalletReady: walletReadiness.isFullyReady,
    walletStatus: walletReadiness,
  };
}

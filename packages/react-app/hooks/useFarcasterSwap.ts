/**
 * Farcaster-specific swap logic
 * 
 * This file contains ONLY Farcaster wallet transaction logic.
 * It uses EIP-5792 wallet_sendCalls for batch transactions (approve + swap).
 * 
 * DO NOT modify this file unless you're specifically fixing Farcaster issues.
 * This keeps the main web app and miniapp logic untouched.
 */

import { useAccount, useWalletClient, useSendCalls, useChainId } from 'wagmi';
import { useMemo } from 'react';
import { Mento } from '@mento-protocol/mento-sdk';
import { providers, Contract, ethers } from 'ethers';
import { encodeFunctionData } from 'viem';
import {
  Currency,
  getTokenAddress,
  getContractAddress,
} from '../lib/contracts';
import { useDivvi } from './useDivvi';
import FXRemitABI from '../ABI/FXRemit.json';

const ERC20_ABI = [
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
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

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
  ) => {
    console.log('🚀 Farcaster swap initiated:', {
      fromCurrency,
      toCurrency,
      amount,
      recipientAddress,
    });

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
      if (currentChainId !== 42220) {
        console.log('Switching to Celo network...');
        await walletClient.switchChain({ id: 42220 });
      }
    } catch (e) {
      console.error('Chain switch failed:', e);
      throw new Error('Please switch your wallet to Celo network');
    }

    // Ensure we're on Celo (chainId 42220)
    if (chainId !== 42220) {
      throw new Error(`Invalid chain. Expected Celo (42220), got ${chainId}`);
    }

    const celoChainId = 42220 as const;
    const fromTokenAddress = getTokenAddress(celoChainId, fromCurrency);
    const toTokenAddress = getTokenAddress(celoChainId, toCurrency);

    let provider: providers.JsonRpcProvider;
    try {
      provider = new providers.JsonRpcProvider('https://forno.celo.org');
    } catch (error) {
      throw new Error('Failed to connect to RPC endpoint');
    }

    const signerAddress = address;

    const mento = await Mento.create(provider);
    const exchanges = await mento.getExchanges();

    if (exchanges.length === 0) {
      throw new Error('No exchanges available');
    }

    const amountInWei = ethers.utils.parseEther(amount);
    const quoteAmountOut = await mento.getAmountOut(
      fromTokenAddress,
      toTokenAddress,
      amountInWei.toString()
    );

    const quoteBigInt = BigInt(quoteAmountOut.toString());
    const expectedAmountOut = minAmountOut
      ? ethers.utils.parseEther(minAmountOut).toString()
      : ((quoteBigInt * BigInt(98)) / BigInt(100)).toString();

    console.log('Farcaster swap quote:', {
      from: fromCurrency,
      to: toCurrency,
      amountIn: amount,
      amountOut: ethers.utils.formatEther(expectedAmountOut),
    });

    try {
      const tradablePair = await mento.findPairForTokens(
        fromTokenAddress,
        toTokenAddress
      );

      if (!tradablePair) {
        throw new Error(
          `No tradable pair found for ${fromCurrency} → ${toCurrency}`
        );
      }

      const fxRemitAddress = getContractAddress(celoChainId);
      if (!fxRemitAddress) {
        throw new Error('FXRemit address not configured');
      }

      const corridor = `${fromCurrency}-${toCurrency}`;
      const deadline = Math.floor(Date.now() / 1000) + 300;

      // Check current allowance
      const tokenInterface = [
        'function allowance(address owner, address spender) view returns (uint256)',
      ];
      const readTokenContract = new Contract(
        fromTokenAddress,
        tokenInterface,
        provider
      );
      const currentAllowance = await readTokenContract.allowance(
        signerAddress,
        fxRemitAddress
      );

      const calls: { to: `0x${string}`; data: `0x${string}` }[] = [];

      // Add approve call if needed
      if (currentAllowance.lt(amountInWei)) {
        const approveData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [
            fxRemitAddress as `0x${string}`,
            BigInt(amountInWei.toString()),
          ],
        });
        calls.push({
          to: fromTokenAddress as `0x${string}`,
          data: approveData as `0x${string}`,
        });
        console.log('Added approve call to batch');
      }

      // Single-hop swap
      if (tradablePair.path.length === 1) {
        const hop = tradablePair.path[0];
        const providerAddr = hop.providerAddr;
        const exchangeId = hop.id;

        const amountInBig = BigInt(amountInWei.toString());
        const minOutBig = BigInt(expectedAmountOut);
        const rawSwapData = encodeFunctionData({
          abi: FXRemitABI as any,
          functionName: 'swapAndSend',
          args: [
            (recipientAddress ?? signerAddress) as `0x${string}`,
            fromTokenAddress as `0x${string}`,
            toTokenAddress as `0x${string}`,
            amountInBig,
            minOutBig,
            fromCurrency,
            toCurrency,
            corridor,
            providerAddr as `0x${string}`,
            exchangeId,
            BigInt(deadline),
          ],
        });
        const dataWithReferral = addReferralTagToTransaction(rawSwapData);
        calls.push({
          to: fxRemitAddress as `0x${string}`,
          data: dataWithReferral as `0x${string}`,
        });

        console.log('Submitting Farcaster batch transaction (single-hop):', {
          chainId: celoChainId,
          callsCount: calls.length,
          calls: calls.map((c) => ({
            to: c.to,
            dataLength: c.data.length,
          })),
        });

        const callsResult = await sendCallsAsync({
          calls,
          chainId: celoChainId,
        });
        const callsId =
          typeof callsResult === 'string' ? callsResult : callsResult?.id;

        console.log('Farcaster batch submitted successfully:', {
          callsId,
          txCount: calls.length,
        });

        if (!callsId) {
          throw new Error(
            'No callsId returned transaction may have failed'
          );
        }

        return {
          success: true,
          pending: true,
          callsId,
          amountOut: ethers.utils.formatEther(expectedAmountOut),
          recipient: recipientAddress ?? signerAddress,
          message: `Sent ${amount} ${fromCurrency} → ${toCurrency}`,
        };
      }

      // Multi-hop swap
      if (tradablePair.path.length === 2) {
        const hop1 = tradablePair.path[0].assets.includes(fromTokenAddress)
          ? tradablePair.path[0]
          : tradablePair.path[1];

        const hop2 =
          hop1 === tradablePair.path[0]
            ? tradablePair.path[1]
            : tradablePair.path[0];

        if (!hop1 || !hop2) {
          throw new Error(
            `Multi-hop swap setup failed: Neither exchange supports ${fromCurrency}`
          );
        }

        const assets1: string[] = hop1.assets;
        const assets2: string[] = hop2.assets;

        const intermediateTokenAddress = assets1.find(
          (a1) =>
            assets2.includes(a1) &&
            a1 !== fromTokenAddress &&
            a1 !== toTokenAddress
        );

        if (!intermediateTokenAddress) {
          throw new Error('Could not determine intermediate token');
        }

        const amountInBig = BigInt(amountInWei.toString());
        const minOutBig = BigInt(expectedAmountOut);
        const rawSwapData = encodeFunctionData({
          abi: FXRemitABI as any,
          functionName: 'swapAndSendPath',
          args: [
            (recipientAddress ?? signerAddress) as `0x${string}`,
            fromTokenAddress as `0x${string}`,
            intermediateTokenAddress as `0x${string}`,
            toTokenAddress as `0x${string}`,
            amountInBig,
            minOutBig,
            fromCurrency,
            toCurrency,
            corridor,
            hop1.providerAddr as `0x${string}`,
            hop1.id,
            hop2.providerAddr as `0x${string}`,
            hop2.id,
            BigInt(deadline),
          ],
        });
        const dataWithReferral = addReferralTagToTransaction(rawSwapData);
        calls.push({
          to: fxRemitAddress as `0x${string}`,
          data: dataWithReferral as `0x${string}`,
        });

        console.log('Submitting Farcaster batch transaction (multi-hop):', {
          chainId: celoChainId,
          callsCount: calls.length,
          calls: calls.map((c) => ({
            to: c.to,
            dataLength: c.data.length,
          })),
        });

        const callsResult = await sendCallsAsync({
          calls,
          chainId: celoChainId,
        });
        const callsId =
          typeof callsResult === 'string' ? callsResult : callsResult?.id;

        console.log('Farcaster multi-hop batch submitted successfully:', {
          callsId,
          txCount: calls.length,
        });

        if (!callsId) {
          throw new Error(
            'No callsId returned transaction may have failed'
          );
        }

        return {
          success: true,
          pending: true,
          callsId,
          amountOut: ethers.utils.formatEther(expectedAmountOut),
          recipient: recipientAddress ?? signerAddress,
          message: `Sent ${amount} ${fromCurrency} → ${toCurrency}`,
        };
      }

      throw new Error(
        `Unsupported path length: ${tradablePair.path.length}`
      );
    } catch (error) {
      console.error('Farcaster swap error:', error instanceof Error ? error.message : error);
      throw error;
    }
  };

  return {
    swap,
    isWalletReady: walletReadiness.isFullyReady,
    walletStatus: walletReadiness,
  };
}


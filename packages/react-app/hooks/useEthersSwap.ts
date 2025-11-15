import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { useMemo } from 'react';
import { Mento } from '@mento-protocol/mento-sdk';
import { providers, Contract, ethers } from 'ethers';
import {
  Currency,
  getTokenAddress,
  getContractAddress,
} from '../lib/contracts';
import { useDivvi } from './useDivvi';
import { useFarcasterMiniApp } from './useFarcasterMiniApp';
import { useFarcasterSwap } from './useFarcasterSwap';
import FXRemitABI from '../ABI/FXRemit.json';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useEthersSwap() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { isMiniApp } = useFarcasterMiniApp();
  const { addReferralTagToTransaction, submitReferralTransaction } = useDivvi();

  // Use Farcaster-specific swap hook when in Farcaster mode
  const farcasterSwap = useFarcasterSwap();

  const walletReadiness = useMemo(
    () => ({
      isConnected: isConnected && !!address,
      hasWalletClient: !!walletClient,
      isFarcaster: isMiniApp,
      isFullyReady:
        isConnected && !!address && (isMiniApp ? farcasterSwap.isWalletReady : true),
    }),
    [isConnected, address, walletClient, isMiniApp, farcasterSwap.isWalletReady]
  );

  const swap = async (
    fromCurrency: Currency,
    toCurrency: Currency,
    amount: string,
    minAmountOut?: string,
    recipientAddress?: string
  ) => {
    if (isMiniApp) {
      return farcasterSwap.swap(
        fromCurrency,
        toCurrency,
        amount,
        minAmountOut,
        recipientAddress
      );
    }

    // Web wallet logic below (unchanged)
    if (!walletReadiness.isConnected) {
      throw new Error('Wallet not connected');
    }

    if (!walletClient) {
      throw new Error('Wallet client not available');
    }

    try {
      const currentChainId = await walletClient.getChainId();
      if (currentChainId !== 42220) {
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

      if (!window.ethereum) {
      throw new Error('No wallet found. Please install a Web3 wallet.');
      }

      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
      throw new Error('Please connect your wallet and try again');
      }
      
      const ethersProvider = new providers.Web3Provider(window.ethereum);
    const signer = ethersProvider.getSigner();
    const signerAddress = await signer.getAddress();

      if (signerAddress.toLowerCase() !== address?.toLowerCase()) {
      throw new Error('Wallet address mismatch');
    }

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

      if (tradablePair.path.length === 2) {
        const firstHop = tradablePair.path[0].assets.includes(fromTokenAddress)
          ? tradablePair.path[0]
          : tradablePair.path[1];

        const secondHop =
          firstHop === tradablePair.path[0]
            ? tradablePair.path[1]
            : tradablePair.path[0];

        if (!firstHop.assets.includes(fromTokenAddress)) {
          throw new Error(`First exchange doesn't support ${fromCurrency}`);
        }

        if (!secondHop.assets.includes(toTokenAddress)) {
          throw new Error(`Second exchange doesn't support ${toCurrency}`);
        }

        const intermediateToken = firstHop.assets.find(
          (asset) =>
            secondHop.assets.includes(asset) &&
            asset !== fromTokenAddress &&
            asset !== toTokenAddress
        );

        if (!intermediateToken) {
          throw new Error('No valid intermediate token found');
        }

        console.log('Multi-hop swap path validated:', {
          from: fromCurrency,
          to: toCurrency,
          intermediateToken: intermediateToken.slice(0, 10) + '...'
        });
      }

      const fxRemitAddress = getContractAddress(celoChainId);
      if (!fxRemitAddress) {
        throw new Error('FXRemit address not configured');
      }

      const corridor = `${fromCurrency}-${toCurrency}`;
      const deadline = Math.floor(Date.now() / 1000) + 300;

      if (tradablePair.path.length !== 1 && tradablePair.path.length !== 2) {
        throw new Error(`Unsupported path length: ${tradablePair.path.length}`);
      }

      if (tradablePair.path.length === 1) {
        const hop = tradablePair.path[0];
        const providerAddr = hop.providerAddr;
        const exchangeId = hop.id;

          const tokenInterface = [
            'function allowance(address owner, address spender) view returns (uint256)',
            'function approve(address spender, uint256 amount) returns (bool)',
          ];
          const tokenContract = new Contract(
            fromTokenAddress,
            tokenInterface,
            signer
          );
          const currentAllowance = await tokenContract.allowance(
            signerAddress,
            fxRemitAddress
          );

          if (currentAllowance.lt(amountInWei)) {
            const approvalTx = await tokenContract.approve(
              fxRemitAddress,
              amountInWei
            );
          await approvalTx.wait(1);
          }

          const fxRemitContract = new Contract(
            fxRemitAddress,
            FXRemitABI,
            signer
          );
          const swapTx = await fxRemitContract.populateTransaction.swapAndSend(
            recipientAddress ?? signerAddress,
            fromTokenAddress,
            toTokenAddress,
            amountInWei,
            expectedAmountOut,
            fromCurrency,
            toCurrency,
            corridor,
            providerAddr,
            exchangeId,
            deadline
          );

          const dataWithReferral = addReferralTagToTransaction(swapTx.data!);
          swapTx.data = dataWithReferral;

          const gasEstimate = await signer.estimateGas(swapTx);
        swapTx.gasLimit = gasEstimate.mul(120).div(100);

          const swapResponse = await signer.sendTransaction(swapTx);
        
          const receipt = await swapResponse.wait(1);

          if (receipt.status !== 1) {
          throw new Error('Swap transaction failed');
          }

          await submitReferralTransaction(swapResponse.hash);

          return {
            success: true,
            hash: swapResponse.hash,
            amountOut: ethers.utils.formatEther(expectedAmountOut),
            recipient: recipientAddress ?? signerAddress,
            message: `Sent ${amount} ${fromCurrency} → ${toCurrency}`,
          };
      }

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

        if (
          !assets1.includes(fromTokenAddress) ||
          !assets1.includes(intermediateTokenAddress)
        ) {
          throw new Error(
            `Hop 1 does not support ${fromCurrency} → intermediate token swap`
          );
        }

        if (
          !assets2.includes(intermediateTokenAddress) ||
          !assets2.includes(toTokenAddress)
        ) {
          throw new Error(
            `Hop 2 does not support intermediate token → ${toCurrency} swap`
          );
        }

          const tokenInterface = [
            'function allowance(address owner, address spender) view returns (uint256)',
            'function approve(address spender, uint256 amount) returns (bool)',
          ];
          const tokenContract = new Contract(
            fromTokenAddress,
            tokenInterface,
            signer
          );
          const currentAllowance = await tokenContract.allowance(
            signerAddress,
            fxRemitAddress
          );

          if (currentAllowance.lt(amountInWei)) {
            const approvalTx = await tokenContract.approve(
              fxRemitAddress,
              amountInWei
            );
          await approvalTx.wait(1);
          }

          const fxRemitContract = new Contract(
            fxRemitAddress,
            FXRemitABI,
            signer
          );
          const swapTx =
            await fxRemitContract.populateTransaction.swapAndSendPath(
            recipientAddress ?? signerAddress,
            fromTokenAddress,
            intermediateTokenAddress,
            toTokenAddress,
            amountInWei,
            expectedAmountOut,
            fromCurrency,
            toCurrency,
            corridor,
            hop1.providerAddr,
            hop1.id,
            hop2.providerAddr,
            hop2.id,
            deadline
            );

          const dataWithReferral = addReferralTagToTransaction(swapTx.data!);
          swapTx.data = dataWithReferral;

            const gasEstimate = await signer.estimateGas(swapTx);
        swapTx.gasLimit = gasEstimate.mul(120).div(100);

            const swapResponse = await signer.sendTransaction(swapTx);
        console.log('Multi-hop transaction submitted:', swapResponse.hash);
        
            const receipt = await swapResponse.wait(1);

            if (receipt.status !== 1) {
          throw new Error('Multi-hop swap transaction failed');
            }

        console.log('Multi-hop transaction confirmed:', swapResponse.hash);
            await submitReferralTransaction(swapResponse.hash);

            return {
              success: true,
              hash: swapResponse.hash,
              amountOut: ethers.utils.formatEther(expectedAmountOut),
              recipient: recipientAddress ?? signerAddress,
          message: `Sent ${amount} ${fromCurrency} → ${toCurrency}`,
        };
      }
    } catch (error) {
      console.error('Swap error:', error instanceof Error ? error.message : error);
      throw error;
    }
  };

  return {
    swap,
    isWalletReady: walletReadiness.isFullyReady,
    walletStatus: walletReadiness,
  };
} 

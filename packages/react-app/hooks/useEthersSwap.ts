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
import { useFarcasterMiniApp } from './useFarcasterMiniApp';
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
] as const;

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useEthersSwap() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { sendCallsAsync } = useSendCalls();
  const chainId = useChainId();
  const { isMiniApp } = useFarcasterMiniApp();
  const { addReferralTagToTransaction, submitReferralTransaction } = useDivvi();

  console.log('useEthersSwap initialized:', {
    isMiniApp,
    isConnected,
    hasAddress: !!address,
    hasWalletClient: !!walletClient,
    hasSendCallsAsync: !!sendCallsAsync,
  });

  const walletReadiness = useMemo(
    () => ({
      isConnected: isConnected && !!address,
      hasWalletClient: !!walletClient,
      isFarcaster: isMiniApp,
      isFullyReady:
        isConnected && !!address && (isMiniApp ? !!walletClient : true),
    }),
    [isConnected, address, walletClient, isMiniApp]
  );

  const swap = async (
    fromCurrency: Currency,
    toCurrency: Currency,
    amount: string,
    minAmountOut?: string,
    recipientAddress?: string
  ) => {
    console.log('🚀 Swap initiated:', {
      fromCurrency,
      toCurrency,
      amount,
      recipientAddress,
      isMiniApp,
      walletReadiness,
    });

    if (!walletReadiness.isConnected) {
      throw new Error('Wallet not connected');
    }

    if (!walletClient) {
      throw new Error('Wallet client not available');
    }

    if (isMiniApp && !sendCallsAsync) {
      throw new Error('Farcaster Mini App requires sendCallsAsync capability');
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

    let signer: any;
    let signerAddress: string;

    if (isMiniApp) {
      if (!address) {
        throw new Error('Wallet address not available');
      }

      signerAddress = address;
      signer = {
        provider: provider,
        getAddress: () => Promise.resolve(signerAddress),
        signMessage: async (message: string | Uint8Array) => {
          const messageHex =
            typeof message === 'string'
              ? message
              : ethers.utils.hexlify(message);
          return await walletClient.signMessage({
            account: signerAddress as `0x${string}`,
            message: messageHex,
          });
        },
        sendTransaction: async (transaction: any) => {
          const hash = await walletClient.sendTransaction({
            account: signerAddress as `0x${string}`,
            to: transaction.to as `0x${string}`,
            data: transaction.data as `0x${string}`,
            value: transaction.value
              ? BigInt(transaction.value.toString())
              : BigInt(0),
            gas: transaction.gasLimit
              ? BigInt(transaction.gasLimit.toString())
              : undefined,
            gasPrice: transaction.gasPrice
              ? BigInt(transaction.gasPrice.toString())
              : undefined,
          });

          return {
            hash,
            wait: () => provider.waitForTransaction(hash, 1),
          };
        },
        estimateGas: async (transaction: any) =>
          provider.estimateGas(transaction),
        _isSigner: true,
      };
    } else {
      if (!window.ethereum) {
        throw new Error('No wallet found. Please install a Web3 wallet.');
      }

      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        throw new Error('Please connect your wallet and try again');
      }

      const ethersProvider = new providers.Web3Provider(window.ethereum);
      signer = ethersProvider.getSigner();
      signerAddress = await signer.getAddress();

      if (signerAddress.toLowerCase() !== address?.toLowerCase()) {
        throw new Error('Wallet address mismatch');
      }
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

    console.log('Swap quote:', {
      from: fromCurrency,
      to: toCurrency,
      amountIn: amount,
      amountOut: ethers.utils.formatEther(expectedAmountOut)
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

        if (isMiniApp) {
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
          }

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

          if (!sendCallsAsync) {
            throw new Error('sendCallsAsync not available');
          }

          console.log('Submitting Farcaster batch transaction:', {
            chainId: celoChainId,
            callsCount: calls.length,
            calls: calls.map(c => ({ to: c.to, dataLength: c.data.length }))
          });

          const callsResult = await sendCallsAsync({ 
            calls,
            chainId: celoChainId,
          });
          const callsId =
            typeof callsResult === 'string' ? callsResult : callsResult?.id;

          console.log('Farcaster batch submitted successfully:', { callsId, txCount: calls.length });

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
        } else {
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
          console.log('Transaction submitted:', swapResponse.hash);
          
          const receipt = await swapResponse.wait(1);

          if (receipt.status !== 1) {
            throw new Error('Swap transaction failed');
          }

          console.log('Transaction confirmed:', swapResponse.hash);
          await submitReferralTransaction(swapResponse.hash);

          return {
            success: true,
            hash: swapResponse.hash,
            amountOut: ethers.utils.formatEther(expectedAmountOut),
            recipient: recipientAddress ?? signerAddress,
            message: `Sent ${amount} ${fromCurrency} → ${toCurrency}`,
          };
        }
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

        if (isMiniApp) {
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

          if (!sendCallsAsync) {
            throw new Error('sendCallsAsync not available');
          }

          console.log('Submitting Farcaster multi-hop batch transaction:', {
            chainId: celoChainId,
            callsCount: calls.length,
            calls: calls.map(c => ({ to: c.to, dataLength: c.data.length }))
          });

          const callsResult = await sendCallsAsync({ 
            calls,
            chainId: celoChainId,
          });
          const callsId =
            typeof callsResult === 'string' ? callsResult : callsResult?.id;

          console.log('Farcaster multi-hop batch submitted successfully:', { callsId, txCount: calls.length });

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
        } else {
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

import { useAccount, useWalletClient } from 'wagmi';
import { useMemo } from 'react';
import { Mento } from '@mento-protocol/mento-sdk';
import { providers, Wallet, Contract, ethers } from 'ethers';
import {
  Currency,
  getTokenAddress,
  getContractAddress,
} from '../lib/contracts';
import { useDivvi } from './useDivvi';
import { useFarcasterMiniApp } from './useFarcasterMiniApp';
import FXRemitABI from '../ABI/FXRemit.json';

// Extend window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useEthersSwap() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { isMiniApp } = useFarcasterMiniApp();
  const { addReferralTagToTransaction, submitReferralTransaction } = useDivvi();

  // Enhanced wallet readiness check for Farcaster compatibility
  const walletReadiness = useMemo(() => {
    return {
      isConnected: isConnected && !!address,
      hasWalletClient: !!walletClient,
      isFarcaster: isMiniApp,
      isFullyReady:
        isConnected && !!address && (isMiniApp ? !!walletClient : true),
    };
  }, [isConnected, address, walletClient, isMiniApp]);

  const isWalletReady = () => walletReadiness;

  const swap = async (
    fromCurrency: Currency,
    toCurrency: Currency,
    amount: string,
    minAmountOut?: string,
    recipientAddress?: string
  ) => {
    const walletStatus = isWalletReady();
    
    if (!walletStatus.isConnected) {
      throw new Error(
        'Wallet not connected. Please connect your wallet first.'
      );
    }

    console.log('Starting pure ethers.js swap...');
    console.log('Wallet validation passed:', {
      isConnected: walletStatus.isConnected,
      address: address?.slice(0, 6) + '...' + address?.slice(-4),
    });
    
    const chainId = 42220;
    const fromTokenAddress = getTokenAddress(chainId, fromCurrency);
    const toTokenAddress = getTokenAddress(chainId, toCurrency);
    
    console.log('Token addresses:', {
      fromCurrency,
      toCurrency,
      fromTokenAddress,
      toTokenAddress,
      chainId,
    });

    const rpcUrls = ['https://forno.celo.org'];

    let provider: providers.JsonRpcProvider | undefined;
    for (const rpcUrl of rpcUrls) {
      try {
        provider = new providers.JsonRpcProvider(rpcUrl);
        await provider.getBlockNumber(); // Test connection
        console.log(`Connected to RPC: ${rpcUrl}`);
        break;
      } catch (error) {
        console.warn(`Failed to connect to ${rpcUrl}:`, error);
        if (rpcUrl === rpcUrls[rpcUrls.length - 1]) {
          throw new Error(
            'All RPC endpoints failed. Please check your internet connection.'
          );
        }
      }
    }

    if (!provider) {
      throw new Error('Failed to connect to any RPC endpoint');
    }

    // Get Ethereum provider based on environment
    let ethereumProvider: any;
    let signer: any;
    let signerAddress: string;

    if (isMiniApp) {
      // Farcaster Mini App - create a custom signer that works with Mento SDK
      console.log('Using Farcaster Mini App with wagmi wallet client');
      
      if (!walletClient) {
        throw new Error('Farcaster wallet client not available. Please ensure you are connected.');
      }
      
      signerAddress = address!;
      
      // Create a custom signer that implements the ethers.js Signer interface
      signer = {
        provider: provider,
        getAddress: () => Promise.resolve(signerAddress),
        signMessage: async (message: string | Uint8Array) => {
          const messageHex = typeof message === 'string' ? message : ethers.utils.hexlify(message);
          return await walletClient.signMessage({
            account: signerAddress as `0x${string}`,
            message: messageHex,
          });
        },
        signTransaction: async (transaction: any) => {
          throw new Error('signTransaction not supported in Farcaster Mini App');
        },
        sendTransaction: async (transaction: any) => {
          console.log('Sending transaction via wagmi wallet client:', {
            to: transaction.to,
            value: transaction.value?.toString(),
            data: transaction.data?.slice(0, 10) + '...'
          });
          
          const hash = await walletClient.sendTransaction({
            account: signerAddress as `0x${string}`,
            to: transaction.to as `0x${string}`,
            data: transaction.data as `0x${string}`,
            value: transaction.value ? BigInt(transaction.value.toString()) : BigInt(0),
            gas: transaction.gasLimit ? BigInt(transaction.gasLimit.toString()) : undefined,
            gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice.toString()) : undefined,
          });
          
          return { 
            hash, 
            wait: () => provider.waitForTransaction(hash, 1) 
          };
        },
        connect: (provider: any) => {
          return { ...signer, provider };
        },
        _isSigner: true,
      };
      
      console.log('Farcaster wallet client configured:', signerAddress);
    } else {
      if (!window.ethereum) {
        throw new Error(
          'No wallet found. Please install MetaMask or another Web3 wallet.'
        );
      }

      console.log('Using traditional Web3 wallet');
      const ethersProvider = new providers.Web3Provider(window.ethereum);
      signer = ethersProvider.getSigner();

      // Verify the signer address matches
      signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== address?.toLowerCase()) {
        throw new Error(
          'Wallet address mismatch. Please reconnect your wallet.'
        );
      }
    }

    console.log('Signer created:', signerAddress);

    console.log('Creating Mento SDK...');
    const mento = await Mento.create(provider);
    console.log('Loading exchanges...');
    const exchanges = await mento.getExchanges();
    if (exchanges.length === 0) throw new Error('No exchanges found');
    
    // Convert amount to wei using ethers
    const amountInWei = ethers.utils.parseEther(amount);
    
    console.log('Getting quote...');
    const quoteAmountOut = await mento.getAmountOut(
      fromTokenAddress,
      toTokenAddress,
      amountInWei.toString()
    );
    
    const quoteBigInt = BigInt(quoteAmountOut.toString());
    const expectedAmountOut = minAmountOut 
      ? ethers.utils.parseEther(minAmountOut).toString()
      : ((quoteBigInt * BigInt(98)) / BigInt(100)).toString(); // 2% slippage

    console.log(
      `Quote: ${ethers.utils.formatEther(
        quoteAmountOut
      )} ${toCurrency} for ${amount} ${fromCurrency}`
    );
    console.log(
      `Expected amount out with 2% slippage: ${ethers.utils.formatEther(
        expectedAmountOut
      )} ${toCurrency}`
    );

    try {
      // 1) Find tradable pair - try multiple approaches
      let tradablePair = await mento.findPairForTokens(
        fromTokenAddress,
        toTokenAddress
      );

      if (!tradablePair) {
        console.log(
          'No direct tradable pair found, checking available exchanges...'
        );

        // Get all available exchanges to see what's actually supported
        const exchanges = await mento.getExchanges();
        console.log('Available exchanges:', exchanges.length);

        // Log what tokens are actually supported
        const supportedTokens = new Set<string>();
        exchanges.forEach((exchange) => {
          exchange.assets.forEach((asset) => supportedTokens.add(asset));
        });

        console.log('Supported tokens:', Array.from(supportedTokens));
        console.log('Looking for:', { fromTokenAddress, toTokenAddress });

        throw new Error(
          `No tradable pair found for ${fromCurrency} → ${toCurrency}. This pair may not be supported by Mento exchanges.`
        );
      }

      console.log('Found tradable pair:', {
        pathLength: tradablePair.path.length,
        path: tradablePair.path.map((hop, i) => ({
          hop: i + 1,
          providerAddr: hop.providerAddr,
          exchangeId: hop.id,
          assets: hop.assets,
        })),
      });

      // Validate the entire path before proceeding
      if (tradablePair.path.length === 2) {
        const hop1 = tradablePair.path[0];
        const hop2 = tradablePair.path[1];

        console.log('Pre-validating multi-hop path...');

        // Check if hop1 supports the fromToken
        if (!hop1.assets.includes(fromTokenAddress)) {
          console.error('Hop 1 validation failed:', {
            hop1Assets: hop1.assets,
            fromTokenAddress,
            fromCurrency,
          });
          throw new Error(
            `Multi-hop swap failed: The first exchange doesn't support ${fromCurrency}. This token pair may not be available for trading. Please try a different currency pair.`
          );
        }

        // Check if hop2 supports the toToken
        if (!hop2.assets.includes(toTokenAddress)) {
          console.error('Hop 2 validation failed:', {
            hop2Assets: hop2.assets,
            toTokenAddress,
            toCurrency,
          });
          throw new Error(
            `Multi-hop swap failed: The second exchange doesn't support ${toCurrency}. This token pair may not be available for trading. Please try a different currency pair.`
          );
        }

        // Find intermediate token
        const intermediateToken = hop1.assets.find(
          (asset) =>
            hop2.assets.includes(asset) &&
            asset !== fromTokenAddress &&
            asset !== toTokenAddress
        );

        if (!intermediateToken) {
          console.error('No valid intermediate token found:', {
            hop1Assets: hop1.assets,
            hop2Assets: hop2.assets,
            fromTokenAddress,
            toTokenAddress,
          });
          throw new Error(
            'No valid intermediate token found between the two hops'
          );
        }

        console.log('Multi-hop path pre-validation passed:', {
          intermediateToken,
          hop1Supports: hop1.assets,
          hop2Supports: hop2.assets,
        });
      }

      // 2) Approve FXRemit to spend the input token
      const fxRemitAddress = getContractAddress(chainId);
      if (!fxRemitAddress) throw new Error('FXRemit address not configured');

      const tokenInterface = [
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)',
      ];
      const tokenContract = new Contract(
        fromTokenAddress,
        tokenInterface,
        signer
      );

      console.log('Checking current allowance...');
      const currentAllowance = await tokenContract.allowance(
        signerAddress,
        fxRemitAddress
      );

      if (currentAllowance.lt(amountInWei)) {
        console.log('Approving token spend...');
        const approvalTx = await tokenContract.approve(
          fxRemitAddress,
          amountInWei
        );
        console.log('Waiting for approval transaction...');
        await approvalTx.wait(1); // Wait for 1 confirmation
        console.log('Approval confirmed!');
      } else {
        console.log('Sufficient allowance already exists');
      }

      // 3) Execute swap
      const corridor = `${fromCurrency}-${toCurrency}`;
      const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes for mobile wallets

      if (tradablePair.path.length === 1) {
        const hop = tradablePair.path[0];
        const providerAddr = hop.providerAddr;
        const exchangeId = hop.id;

        console.log('Using single-hop swap:', { providerAddr, exchangeId });

        const fxRemitContract = new Contract(
          fxRemitAddress,
          FXRemitABI,
          signer
        );

        // Add referral tag to transaction data
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

        console.log('Sending swap transaction...');
        const swapResponse = await signer.sendTransaction(swapTx);
        console.log('Waiting for swap confirmation...');
        const receipt = await swapResponse.wait(1);

        if (receipt.status !== 1) {
          throw new Error('Swap transaction failed on-chain');
        }

        console.log('Swap completed successfully!');
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
        const hop1 = tradablePair.path[0];
        const hop2 = tradablePair.path[1];

        console.log('Analyzing multi-hop path:', {
          hop1: {
            providerAddr: hop1.providerAddr,
            exchangeId: hop1.id,
            assets: hop1.assets,
          },
          hop2: {
            providerAddr: hop2.providerAddr,
            exchangeId: hop2.id,
            assets: hop2.assets,
          },
          fromTokenAddress,
          toTokenAddress,
        });

        // Validate that the hops form a valid path
        const assets1: string[] = hop1.assets;
        const assets2: string[] = hop2.assets;

        // Find the intermediate token that both hops support
        let intermediateTokenAddress: string | undefined;
        for (const a1 of assets1) {
          if (
            assets2.includes(a1) &&
            a1 !== fromTokenAddress &&
            a1 !== toTokenAddress
          ) {
            intermediateTokenAddress = a1;
            break;
          }
        }

        if (!intermediateTokenAddress) {
          throw new Error(
            'Could not determine intermediate token for multi-hop swap'
          );
        }

        // Validate that hop1 supports fromToken → intermediateToken
        if (
          !assets1.includes(fromTokenAddress) ||
          !assets1.includes(intermediateTokenAddress)
        ) {
          throw new Error(
            `Hop 1 does not support ${fromCurrency} → intermediate token swap`
          );
        }

        // Validate that hop2 supports intermediateToken → toToken
        if (
          !assets2.includes(intermediateTokenAddress) ||
          !assets2.includes(toTokenAddress)
        ) {
          throw new Error(
            `Hop 2 does not support intermediate token → ${toCurrency} swap`
          );
        }

        console.log('Multi-hop path validation passed:', {
          hop1: `${fromCurrency} → intermediate`,
          hop2: `intermediate → ${toCurrency}`,
          intermediateTokenAddress,
          providerAddr1: hop1.providerAddr,
          exchangeId1: hop1.id,
          providerAddr2: hop2.providerAddr,
          exchangeId2: hop2.id,
        });

        const fxRemitContract = new Contract(
          fxRemitAddress,
          FXRemitABI,
          signer
        );

        // Use the correct parameter order for swapAndSendPath
        const swapTx =
          await fxRemitContract.populateTransaction.swapAndSendPath(
            recipientAddress ?? signerAddress, // recipient
            fromTokenAddress, // tokenIn
            intermediateTokenAddress, // intermediateToken
            toTokenAddress, // tokenOut
            amountInWei, // amountIn
            expectedAmountOut, // minAmountOut
            fromCurrency, // fromCurrency
            toCurrency, // toCurrency
            corridor, // corridor
            hop1.providerAddr, // providerAddr1
            hop1.id, // exchangeId1
            hop2.providerAddr, // providerAddr2
            hop2.id, // exchangeId2
            deadline // deadline
          );

        const dataWithReferral = addReferralTagToTransaction(swapTx.data!);
        swapTx.data = dataWithReferral;

        console.log('Sending multi-hop swap transaction...');
        console.log('Transaction details:', {
          to: fxRemitAddress,
          from: signerAddress,
          value: '0',
          data: swapTx.data?.slice(0, 10) + '...', // Show function selector
        });

        try {
          const swapResponse = await signer.sendTransaction(swapTx);
          console.log('Waiting for swap confirmation...');
          const receipt = await swapResponse.wait(1);

          if (receipt.status !== 1) {
            throw new Error('Multi-hop swap transaction failed on-chain');
          }

          console.log('Multi-hop swap completed successfully!');
          await submitReferralTransaction(swapResponse.hash);
          
          return {
            success: true,
            hash: swapResponse.hash,
            amountOut: ethers.utils.formatEther(expectedAmountOut),
            recipient: recipientAddress ?? signerAddress,
            message: `Sent ${amount} ${fromCurrency} → ${toCurrency} (multi-hop)`,
          };
        } catch (multiHopError) {
          console.error('Multi-hop swap failed:', multiHopError);

          // Check if it's the specific "tokenIn and tokenOut must match exchange" error
          if (
            multiHopError instanceof Error &&
            multiHopError.message.includes(
              'tokenIn and tokenOut must match exchange'
            )
          ) {
            throw new Error(
              `Multi-hop swap failed: The exchange parameters don't match the token pair. This might be due to exchange configuration issues. Please try a different token pair or contact support.`
            );
          }

          // Re-throw other errors
          throw multiHopError;
        }
      }

      throw new Error(`Unsupported path length: ${tradablePair.path.length}`);
    } catch (error) {
      console.error('Swap failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown',
      });
      throw error;
    }
  };

  return { 
    swap, 
    isWalletReady: walletReadiness.isFullyReady,
    walletStatus: walletReadiness,
  };
} 

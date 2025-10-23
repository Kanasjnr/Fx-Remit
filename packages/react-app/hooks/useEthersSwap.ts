import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { useMemo } from 'react';
import { Mento } from '@mento-protocol/mento-sdk';
import { providers, Wallet, utils, Contract } from 'ethers';
import { Currency, getTokenAddress, getContractAddress } from '../lib/contracts';
import { parseEther, formatEther, encodeFunctionData, type Abi } from 'viem';
import { celo } from 'viem/chains';
import { useDivvi } from './useDivvi';
import { useFarcasterMiniApp } from './useFarcasterMiniApp';
import FXRemitABI from '../ABI/FXRemit.json';

async function createFarcasterWalletClient(address: string) {
  try {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    const provider = await sdk.wallet.getEthereumProvider();
    
    if (!provider) {
      throw new Error('Farcaster wallet provider not available');
    }

    return {
      account: { address: address as `0x${string}` },
      sendTransaction: async (args: any) => {
        const hash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: args.account.address,
            to: args.to,
            value: args.value ? `0x${args.value.toString(16)}` : '0x0',
            data: args.data,
            gas: args.gas ? `0x${args.gas.toString(16)}` : undefined,
          }]
        });
        return hash;
      },
      waitForTransactionReceipt: async (args: any) => {
        return { status: 'success', transactionHash: args.hash };
      }
    };
  } catch (error) {
    console.error('Failed to create Farcaster wallet client:', error);
    return null;
  }
}

export function useEthersSwap() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { addReferralTagToTransaction, submitReferralTransaction } = useDivvi();
  const { isMiniApp } = useFarcasterMiniApp();

  // Memoize wallet readiness with platform-specific logic
  const walletReadiness = useMemo(() => {
    const isConnectedWithAddress = isConnected && !!address;
    const hasPublicClient = !!publicClient;
    
    // For Farcaster: we'll create custom wallet client, so we don't need standard walletClient
    // For Web: we need standard walletClient
    const hasWalletClient = isMiniApp ? true : !!walletClient;
    
    return {
      isConnected: isConnectedWithAddress,
      hasWalletClient,
      hasPublicClient,
      isFullyReady: isConnectedWithAddress && hasWalletClient && hasPublicClient
    };
  }, [isConnected, address, walletClient, publicClient, isMiniApp]);

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
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    if (!walletStatus.hasWalletClient) {
      throw new Error('Wallet client not available. Please try reconnecting your wallet.');
    }

    if (!walletStatus.hasPublicClient) {
      throw new Error('Network connection not available. Please check your internet connection.');
    }

    console.log(' Wallet validation passed:', {
      isConnected: walletStatus.isConnected,
      address: address?.slice(0, 6) + '...' + address?.slice(-4),
      hasWalletClient: walletStatus.hasWalletClient,
      hasPublicClient: walletStatus.hasPublicClient
    });

    console.log(' Starting pure ethers.js swap following official examples...');
    
    const chainId = 42220;
    const fromTokenAddress = getTokenAddress(chainId, fromCurrency);
    const toTokenAddress = getTokenAddress(chainId, toCurrency);
    
    console.log('Token addresses:', {
      fromCurrency,
      toCurrency,
      fromTokenAddress,
      toTokenAddress,
      chainId
    });

    // Create ethers provider
    const provider = new providers.JsonRpcProvider('https://forno.celo.org');
    
    // TypeScript safety: we know these are defined due to validation above
    const safePublicClient = publicClient!;
    
    // Use platform-specific wallet client
    let safeWalletClient;
    if (isMiniApp) {
      safeWalletClient = await createFarcasterWalletClient(address!);
      if (!safeWalletClient) {
        throw new Error('Failed to create Farcaster wallet client');
      }
    } else {
      safeWalletClient = walletClient!;
    }
    
    // Create a better signer proxy that properly handles address and signing
    const createProperSigner = (userAddress: string) => {
      // Create a wallet with a private key derived from the user's address
      // This is a deterministic but dummy approach - the actual signing will be done by viem
      const deterministicKey = '0x' + userAddress.slice(2).padStart(64, '0');
      const wallet = new Wallet(deterministicKey, provider);
      
      // Override critical methods to use viem instead
      const signerProxy = Object.create(wallet);
      
      // Override address property
      Object.defineProperty(signerProxy, 'address', {
        value: userAddress,
        writable: false,
        enumerable: true
      });
      
      // Override getAddress method
      signerProxy.getAddress = () => Promise.resolve(userAddress);
      
      // Override sendTransaction to use viem
      signerProxy.sendTransaction = async (transaction: any) => {
        const hash = await safeWalletClient.sendTransaction({
          account: userAddress as `0x${string}`,
          to: transaction.to as `0x${string}`,
          data: transaction.data as `0x${string}`,
          value: transaction.value ? BigInt(transaction.value.toString()) : BigInt(0),
          gas: transaction.gasLimit ? BigInt(transaction.gasLimit.toString()) : undefined,
          gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice.toString()) : undefined,
          kzg: undefined,
          chain: celo
        });
        return { 
          hash, 
          wait: () => safePublicClient.waitForTransactionReceipt({ hash, confirmations: 1 }) 
        };
      };
      
      // Override populateTransaction to ensure correct from address
      signerProxy.populateTransaction = async (transaction: any) => {
        const populated = await wallet.populateTransaction(transaction);
        populated.from = userAddress;
        return populated;
      };
      
      return signerProxy;
    };
    
    const signer = createProperSigner(address!);
    
    console.log('✨ Creating Mento SDK...');
    const mento = await Mento.create(signer);
    console.log('🔄 Loading exchanges...');
    const exchanges = await mento.getExchanges();
    if (exchanges.length === 0) throw new Error('No exchanges found');
    
    // Use viem's parseEther to avoid BigNumber version issues
    const amountInWei = parseEther(amount);
    
    console.log('📊 Getting quote...');
    
    const quoteAmountOut = await mento.getAmountOut(
      fromTokenAddress,
      toTokenAddress,
      amountInWei.toString() // Convert to string to avoid BigNumber issues
    );
    
    console.log(`💰 Quote: ${formatEther(BigInt(quoteAmountOut.toString()))} ${toCurrency} for ${amount} ${fromCurrency}`);
    
    const quoteBigInt = BigInt(quoteAmountOut.toString());
    const expectedAmountOut = minAmountOut 
      ? parseEther(minAmountOut).toString()
      : (quoteBigInt * BigInt(98) / BigInt(100)).toString(); // default 2% slippage
    
    console.log(`🎯 Expected amount out with 1% slippage: ${formatEther(BigInt(expectedAmountOut))} ${toCurrency}`);
    
    try {
      // 1) Find tradable pair and correct single-hop exchange
      const tradablePair = await mento.findPairForTokens(fromTokenAddress, toTokenAddress);
      if (!tradablePair) throw new Error('No tradable pair');

      // 2) Approve FXRemit to spend the input token
      const fxRemitAddress = getContractAddress(chainId);
      if (!fxRemitAddress) throw new Error('FXRemit address not configured');
      const tokenInterface = [
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)'
      ];
      const tokenContract = new Contract(fromTokenAddress, tokenInterface, signer);
      const currentAllowance = await tokenContract.allowance(signer.address, fxRemitAddress);
      if (BigInt(currentAllowance.toString()) < BigInt(amountInWei.toString())) {
        const approvalTx = await tokenContract.populateTransaction.approve(
          fxRemitAddress,
          amountInWei.toString()
        );
        const approvalHash = await safeWalletClient.sendTransaction({
          account: signer.address as `0x${string}`,
          to: fromTokenAddress as `0x${string}`,
          data: approvalTx.data as `0x${string}`,
          value: BigInt(0),
          kzg: undefined,
          chain: celo
        });
        await safePublicClient.waitForTransactionReceipt({ hash: approvalHash });
        // Do not submit Divvi referral for approvals
      }

      // 3) Call FXRemit.swapAndSend with SDK-provided params
      const corridor = `${fromCurrency}-${toCurrency}`;
      const singleHopDeadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 1); // 60s

      if (tradablePair.path.length === 1) {
        const hop = tradablePair.path[0];
        const providerAddr = hop.providerAddr as `0x${string}`;
        const exchangeId = hop.id as `0x${string}`; // bytes32
        console.log(' Using single-hop', { providerAddr, exchangeId });
        console.log('Allowlist provider (single-hop):', { providerAddr, exchangeId });

        const calldata = encodeFunctionData({
          abi: FXRemitABI as unknown as Abi,
          functionName: 'swapAndSend',
          args: [
            (recipientAddress ?? signer.address) as `0x${string}`,
            fromTokenAddress as `0x${string}`,
            toTokenAddress as `0x${string}`,
            amountInWei,
            BigInt(expectedAmountOut),
            fromCurrency,
            toCurrency,
            corridor,
            providerAddr,
            exchangeId,
            singleHopDeadline
          ]
        });

        const dataWithReferral = addReferralTagToTransaction(calldata);
        const hash = await safeWalletClient.sendTransaction({
          account: signer.address as `0x${string}`,
          to: fxRemitAddress as `0x${string}`,
          data: dataWithReferral as `0x${string}`,
          value: BigInt(0),
          kzg: undefined,
          chain: celo
        });
        const receipt = await safePublicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== 'success') throw new Error('Swap failed on-chain');
        await submitReferralTransaction(hash);
        
          return {
            success: true,
            hash,
            amountOut: formatEther(BigInt(expectedAmountOut)),
          recipient: (recipientAddress ?? signer.address),
          message: `Sent ${amount} ${fromCurrency} → ${toCurrency}`
        };
      }

      if (tradablePair.path.length === 2) {
        const multiHopDeadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 3); // 180s
        const hop1 = tradablePair.path[0];
        const hop2 = tradablePair.path[1];
        const providerAddr1 = hop1.providerAddr as `0x${string}`;
        const providerAddr2 = hop2.providerAddr as `0x${string}`;
        const exchangeId1 = hop1.id as `0x${string}`; // bytes32
        const exchangeId2 = hop2.id as `0x${string}`; // bytes32

        // Determine intermediate token address by intersection of assets
        const assets1: string[] = hop1.assets;
        const assets2: string[] = hop2.assets;
        let intermediateTokenAddress: string | undefined;
        for (const a1 of assets1) {
          if (assets2.includes(a1) && a1 !== fromTokenAddress && a1 !== toTokenAddress) {
            intermediateTokenAddress = a1;
            break;
          }
        }
        if (!intermediateTokenAddress) throw new Error('Could not determine intermediate token');
        console.log('Allowlist providers (multi-hop):', {
          providerAddr1,
          exchangeId1,
          providerAddr2,
          exchangeId2,
          intermediateTokenAddress
        });

        const calldata = encodeFunctionData({
          abi: FXRemitABI as unknown as Abi,
          functionName: 'swapAndSendPath',
          args: [
            (recipientAddress ?? signer.address) as `0x${string}`,
            fromTokenAddress as `0x${string}`,
            intermediateTokenAddress as `0x${string}`,
            toTokenAddress as `0x${string}`,
            amountInWei,
            BigInt(expectedAmountOut),
            fromCurrency,
            toCurrency,
            corridor,
            providerAddr1,
            exchangeId1,
            providerAddr2,
            exchangeId2,
            multiHopDeadline
          ]
        });

        const dataWithReferral = addReferralTagToTransaction(calldata);
           const hash = await safeWalletClient.sendTransaction({
             account: signer.address as `0x${string}`,
          to: fxRemitAddress as `0x${string}`,
          data: dataWithReferral as `0x${string}`,
             value: BigInt(0),
             kzg: undefined,
             chain: celo
           });
        const receipt = await safePublicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== 'success') throw new Error('Swap (path) failed on-chain');
          await submitReferralTransaction(hash);
          
          return {
            success: true,
            hash,
            amountOut: formatEther(BigInt(expectedAmountOut)),
          recipient: (recipientAddress ?? signer.address),
          message: `Sent ${amount} ${fromCurrency} → ${toCurrency} (multi-hop)`
        };
      }

      throw new Error(`Unsupported path length: ${tradablePair.path.length}`);
      
    } catch (error) {
      console.error(' Swap failed:', error);
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
    walletStatus: walletReadiness
  };
} 
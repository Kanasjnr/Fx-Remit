import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Mento } from '@mento-protocol/mento-sdk';
import { parseEther, formatEther } from 'viem';
import { providers, Wallet, Signer } from 'ethers';
import { Currency, getTokenAddress, CURRENCY_INFO, SupportedChainId } from '../lib/contracts';
import { useDivvi } from './useDivvi';

// Create a proper ethers signer that wraps wagmi wallet client
class WagmiEthersSigner extends Signer {
  private walletClient: any;
  private userAddress: string;
  public provider: providers.Provider;

  constructor(walletClient: any, userAddress: string, provider: providers.Provider) {
    super();
    this.walletClient = walletClient;
    this.userAddress = userAddress;
    this.provider = provider;
  }

  async getAddress(): Promise<string> {
    return this.userAddress;
  }

  async signMessage(message: string): Promise<string> {
    return this.walletClient.signMessage({ message });
  }

  async signTransaction(transaction: any): Promise<string> {
    throw new Error('signTransaction not implemented');
  }

  async sendTransaction(transaction: any): Promise<providers.TransactionResponse> {
    // Convert ethers transaction to wagmi format
    const wagmiTx = {
      to: transaction.to as `0x${string}`,
      data: transaction.data as `0x${string}`,
      value: transaction.value ? BigInt(transaction.value.toString()) : undefined,
      gas: transaction.gasLimit ? BigInt(transaction.gasLimit.toString()) : undefined,
      gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice.toString()) : undefined,
    };

    const hash = await this.walletClient.sendTransaction(wagmiTx);
    return this.provider.getTransaction(hash);
  }

  connect(provider: providers.Provider): Signer {
    return new WagmiEthersSigner(this.walletClient, this.userAddress, provider);
  }
}

export function useMento() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [mento, setMento] = useState<Mento | null>(null);
  const [mentoWithSigner, setMentoWithSigner] = useState<Mento | null>(null);
  const [signer, setSigner] = useState<WagmiEthersSigner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initMento() {
      try {
        if (!publicClient) return;
        
        // Create an ethers provider from the viem client
        const ethersProvider = new providers.JsonRpcProvider(
          publicClient.transport.url || 'https://alfajores-forno.celo-testnet.org'
        );
        
        // Initialize Mento with provider only (for read-only operations like quotes)
        const mentoSDK = await Mento.create(ethersProvider);
        setMento(mentoSDK);
        
        // Create Mento with signer for state-changing operations (exactly like docs)
        if (walletClient && address) {
          try {
            const wagmiSigner = new WagmiEthersSigner(walletClient, address, ethersProvider);
            const mentoWithSigner = await Mento.create(wagmiSigner);
            setMentoWithSigner(mentoWithSigner);
            setSigner(wagmiSigner);
          } catch (signerError) {
            console.warn('Failed to create signer, state-changing operations will not be available:', signerError);
            setMentoWithSigner(null);
            setSigner(null);
          }
        } else {
          setMentoWithSigner(null);
          setSigner(null);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to initialize Mento SDK:', err);
        setError('Failed to initialize Mento SDK');
      } finally {
        setIsLoading(false);
      }
    }

    initMento();
  }, [publicClient, walletClient, address]);

  return {
    mento,
    mentoWithSigner,
    signer,
    isLoading,
    error,
    isConnected: !!address && !!walletClient,
  };
}

export function useExchangeRate(fromCurrency: Currency, toCurrency: Currency) {
  const { mento } = useMento();
  const publicClient = usePublicClient();
  const [rate, setRate] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRate() {
      if (!mento || !publicClient || fromCurrency === toCurrency) {
        setRate('1');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const chainId = await publicClient.getChainId();
        const supportedChainId = chainId as SupportedChainId;
        const fromTokenAddress = getTokenAddress(supportedChainId, fromCurrency);
        const toTokenAddress = getTokenAddress(supportedChainId, toCurrency);
        
        // Get exchange rate for 1 unit of fromCurrency
        const amountIn = parseEther('1');
        const quote = await mento.getAmountOut(fromTokenAddress, toTokenAddress, amountIn);
        
        // Convert BigNumber to string for viem formatting
        const exchangeRate = formatEther(BigInt(quote.toString()));
        setRate(exchangeRate);
      } catch (err) {
        console.error('Failed to fetch exchange rate:', err);
        setError('Failed to fetch exchange rate');
        setRate('0');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRate();
  }, [mento, publicClient, fromCurrency, toCurrency]);

  return {
    rate: parseFloat(rate),
    isLoading,
    error,
  };
}

export function useTokenSwap() {
  const { mento, mentoWithSigner, signer, isConnected } = useMento();
  const publicClient = usePublicClient();
  const { generateReferralTag, submitReferralTransaction, isReady: isDivviReady } = useDivvi();
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const swap = async (
    fromCurrency: Currency,
    toCurrency: Currency,
    amountIn: string,
    recipient: string,
    minAmountOut?: string
  ) => {
    if (!mento || !mentoWithSigner || !signer || !publicClient || !isConnected) {
      throw new Error('Wallet not connected or Mento not initialized');
    }

    setIsSwapping(true);
    setError(null);

    try {
      const chainId = await publicClient.getChainId();
      const supportedChainId = chainId as SupportedChainId;
      const fromTokenAddress = getTokenAddress(supportedChainId, fromCurrency);
      const toTokenAddress = getTokenAddress(supportedChainId, toCurrency);
      
      console.log('Swap parameters:', {
        fromCurrency,
        toCurrency,
        fromTokenAddress,
        toTokenAddress,
        chainId,
        supportedChainId
      });
      
      const amountInWei = parseEther(amountIn);
      
      // Get quote for minimum amount out if not provided
      const quote = await mento.getAmountOut(fromTokenAddress, toTokenAddress, amountInWei);
      const quoteBigInt = BigInt(quote.toString());
      
      // Apply slippage (1% default) - exactly like docs
      const expectedAmountOut = minAmountOut ? parseEther(minAmountOut) : quoteBigInt * BigInt(99) / BigInt(100);
      
      // Generate Divvi referral tag
      let referralTag: string | null = null;
      if (isDivviReady) {
        try {
          referralTag = generateReferralTag();
          console.log('Generated Divvi referral tag:', referralTag);
        } catch (error) {
          console.warn('Failed to generate referral tag:', error);
        }
      }
      
      // Step 1: Increase trading allowance (exactly like docs)
      console.log('Approving token allowance...');
      const allowanceTxObj = await mentoWithSigner.increaseTradingAllowance(
        fromTokenAddress,
        amountInWei
      );
      
      // Add referral tag to allowance transaction data if available
      if (referralTag) {
        allowanceTxObj.data = (allowanceTxObj.data || '0x') + referralTag.slice(2);
      }
      
      // Send allowance transaction using signer (exactly like docs)
      const allowanceTx = await signer.sendTransaction(allowanceTxObj);
      const allowanceReceipt = await allowanceTx.wait();
      console.log('Allowance tx receipt:', allowanceReceipt);
      
      // Step 2: Execute swap (exactly like docs)
      console.log('Executing swap...');
      const swapTxObj = await mentoWithSigner.swapIn(
        fromTokenAddress,
        toTokenAddress,
        amountInWei,
        expectedAmountOut
      );
      
      // Add referral tag to swap transaction data if available
      if (referralTag) {
        swapTxObj.data = (swapTxObj.data || '0x') + referralTag.slice(2);
      }
      
      // Send swap transaction using signer (exactly like docs)
      const swapTx = await signer.sendTransaction(swapTxObj);
      const swapTxReceipt = await swapTx.wait();
      console.log('Swap tx receipt:', swapTxReceipt);
      
      // Submit referral to Divvi after transaction is confirmed
      if (referralTag && isDivviReady) {
        try {
          await submitReferralTransaction(swapTx.hash);
          console.log('Referral submitted to Divvi successfully');
        } catch (error) {
          console.warn('Failed to submit referral to Divvi:', error);
          // Don't throw error here as the swap was successful
        }
      }
      
      return {
        hash: swapTx.hash,
        amountIn: amountIn,
        amountOut: formatEther(quoteBigInt),
        exchangeRate: formatEther(quoteBigInt * BigInt(1e18) / amountInWei),
        fromCurrency,
        toCurrency,
        recipient,
        allowanceTxHash: allowanceTx.hash,
        swapTxHash: swapTx.hash,
        receipt: swapTxReceipt,
      };
    } catch (err) {
      console.error('Swap failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Swap failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSwapping(false);
    }
  };

  return {
    swap,
    isSwapping,
    error,
    isConnected,
  };
}

export function useTokenBalance(currency: Currency) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      if (!address || !publicClient) {
        setBalance('0');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const chainId = await publicClient.getChainId();
        const supportedChainId = chainId as SupportedChainId;
        const tokenAddress = getTokenAddress(supportedChainId, currency);
        
        const balance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: [
            {
              inputs: [{ name: 'account', type: 'address' }],
              name: 'balanceOf',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'balanceOf',
          args: [address],
        });

        setBalance(formatEther(balance));
      } catch (err) {
        console.error('Failed to fetch balance:', err);
        setError('Failed to fetch balance');
        setBalance('0');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();
  }, [address, publicClient, currency]);

  return {
    balance: parseFloat(balance),
    formattedBalance: balance,
    isLoading,
    error,
  };
}

export function useQuote(
  fromCurrency: Currency,
  toCurrency: Currency,
  amountIn: string
) {
  const { mento } = useMento();
  const publicClient = usePublicClient();
  const [quote, setQuote] = useState<{
    amountOut: string;
    exchangeRate: string;
    platformFee: string;
    priceImpact: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuote() {
      if (!mento || !publicClient || !amountIn || parseFloat(amountIn) <= 0 || fromCurrency === toCurrency) {
        setQuote(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const chainId = await publicClient.getChainId();
        const supportedChainId = chainId as SupportedChainId;
        const fromTokenAddress = getTokenAddress(supportedChainId, fromCurrency);
        const toTokenAddress = getTokenAddress(supportedChainId, toCurrency);
        
        const amountInWei = parseEther(amountIn);
        const amountOutWei = await mento.getAmountOut(fromTokenAddress, toTokenAddress, amountInWei);
        
        // Convert BigNumber to bigint for viem formatting
        const amountOutBigInt = BigInt(amountOutWei.toString());
        const amountOut = formatEther(amountOutBigInt);
        const exchangeRate = formatEther(amountOutBigInt * BigInt(1e18) / amountInWei);
        
        // Calculate platform fee (1.5% of amount sent)
        const platformFeeRate = 0.015;
        const platformFee = (parseFloat(amountIn) * platformFeeRate).toString();
        
        // Simple price impact calculation (could be more sophisticated)
        const priceImpact = '0.1'; // 0.1% as example
        
        setQuote({
          amountOut,
          exchangeRate,
          platformFee,
          priceImpact,
        });
      } catch (err) {
        console.error('Failed to fetch quote:', err);
        setError('Failed to fetch quote');
        setQuote(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuote();
  }, [mento, publicClient, fromCurrency, toCurrency, amountIn]);

  return {
    quote,
    isLoading,
    error,
  };
}
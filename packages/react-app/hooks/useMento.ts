import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Mento } from '@mento-protocol/mento-sdk';
import { parseEther, formatEther } from 'viem';
import { providers, Wallet, Signer } from 'ethers';
import { Currency, getTokenAddress, CURRENCY_INFO, SupportedChainId } from '../lib/contracts';

// Custom adapter to convert wagmi wallet client to ethers signer
class WagmiSigner extends Signer {
  private walletClient: any;
  private address: string;
  public provider: providers.Provider;

  constructor(walletClient: any, address: string, provider: providers.Provider) {
    super();
    this.walletClient = walletClient;
    this.address = address;
    this.provider = provider;
  }

  async getAddress(): Promise<string> {
    return this.address;
  }

  async signMessage(message: string): Promise<string> {
    return this.walletClient.signMessage({ message });
  }

  async signTransaction(transaction: any): Promise<string> {
    throw new Error('signTransaction not implemented');
  }

  async sendTransaction(transaction: any): Promise<providers.TransactionResponse> {
    const hash = await this.walletClient.sendTransaction(transaction);
    return this.provider.getTransaction(hash);
  }

  connect(provider: providers.Provider): Signer {
    return new WagmiSigner(this.walletClient, this.address, provider);
  }
}

export function useMento() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [mento, setMento] = useState<Mento | null>(null);
  const [mentoWithSigner, setMentoWithSigner] = useState<Mento | null>(null);
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
        
        // Initialize Mento with provider for read-only operations
        const mentoSDK = await Mento.create(ethersProvider);
        setMento(mentoSDK);
        
        // Initialize Mento with signer for state-changing operations if wallet is connected
        if (walletClient && address) {
          try {
            // Create a custom signer from the wallet client
            const signer = new WagmiSigner(walletClient, address, ethersProvider);
            const mentoWithSigner = await Mento.create(signer);
            setMentoWithSigner(mentoWithSigner);
          } catch (signerError) {
            console.warn('Failed to create signer, state-changing operations will not be available:', signerError);
            setMentoWithSigner(null);
          }
        } else {
          setMentoWithSigner(null);
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
  const { mento, mentoWithSigner, isConnected } = useMento();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const swap = async (
    fromCurrency: Currency,
    toCurrency: Currency,
    amountIn: string,
    recipient: string,
    minAmountOut?: string
  ) => {
    if (!mento || !mentoWithSigner || !walletClient || !publicClient || !isConnected) {
      throw new Error('Wallet not connected or Mento not initialized');
    }

    setIsSwapping(true);
    setError(null);

    try {
      const chainId = await publicClient.getChainId();
      const supportedChainId = chainId as SupportedChainId;
      const fromTokenAddress = getTokenAddress(supportedChainId, fromCurrency);
      const toTokenAddress = getTokenAddress(supportedChainId, toCurrency);
      
      const amountInWei = parseEther(amountIn);
      
      // Get quote for minimum amount out if not provided
      const quote = await mento.getAmountOut(fromTokenAddress, toTokenAddress, amountInWei);
      const quoteBigInt = BigInt(quote.toString());
      
      // Apply slippage (1% default)
      const expectedAmountOut = minAmountOut ? parseEther(minAmountOut) : quoteBigInt * BigInt(99) / BigInt(100);
      
      // Step 1: Approve the broker to spend tokens
      console.log('Approving token allowance...');
      const allowanceTxObj = await mentoWithSigner.increaseTradingAllowance(
        fromTokenAddress,
        amountInWei
      );
      
      // Send allowance transaction using wallet client
      const allowanceTxHash = await walletClient.sendTransaction({
        to: allowanceTxObj.to as `0x${string}`,
        data: allowanceTxObj.data as `0x${string}`,
        value: allowanceTxObj.value ? BigInt(allowanceTxObj.value.toString()) : undefined,
        gas: allowanceTxObj.gasLimit ? BigInt(allowanceTxObj.gasLimit.toString()) : undefined,
        gasPrice: allowanceTxObj.gasPrice ? BigInt(allowanceTxObj.gasPrice.toString()) : undefined,
      });
      
      // Wait for allowance transaction to be mined
      console.log('Waiting for allowance transaction to be mined...');
      await publicClient.waitForTransactionReceipt({ hash: allowanceTxHash });
      
      // Step 2: Execute the swap
      console.log('Executing swap...');
      const swapTxObj = await mentoWithSigner.swapIn(
        fromTokenAddress,
        toTokenAddress,
        amountInWei,
        expectedAmountOut
      );
      
      // Send swap transaction using wallet client
      const swapTxHash = await walletClient.sendTransaction({
        to: swapTxObj.to as `0x${string}`,
        data: swapTxObj.data as `0x${string}`,
        value: swapTxObj.value ? BigInt(swapTxObj.value.toString()) : undefined,
        gas: swapTxObj.gasLimit ? BigInt(swapTxObj.gasLimit.toString()) : undefined,
        gasPrice: swapTxObj.gasPrice ? BigInt(swapTxObj.gasPrice.toString()) : undefined,
      });
      
      // Wait for swap transaction to be mined
      const swapReceipt = await publicClient.waitForTransactionReceipt({ hash: swapTxHash });
      
      return {
        hash: swapTxHash,
        amountIn: amountIn,
        amountOut: formatEther(quoteBigInt),
        exchangeRate: formatEther(quoteBigInt * BigInt(1e18) / amountInWei),
        fromCurrency,
        toCurrency,
        recipient,
        allowanceTxHash,
        swapTxHash,
        receipt: swapReceipt,
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
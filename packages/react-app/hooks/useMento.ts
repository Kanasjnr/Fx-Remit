import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Mento, MentoSDK } from '@mento-protocol/mento-sdk';
import { parseEther, formatEther } from 'viem';
import { Currency, getTokenAddress, CURRENCY_INFO } from '../lib/contracts';

export function useMento() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [mento, setMento] = useState<MentoSDK | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initMento() {
      try {
        if (!publicClient) return;
        
        const mentoSDK = await Mento.create(publicClient);
        setMento(mentoSDK);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize Mento SDK:', err);
        setError('Failed to initialize Mento SDK');
      } finally {
        setIsLoading(false);
      }
    }

    initMento();
  }, [publicClient]);

  return {
    mento,
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
        const fromTokenAddress = getTokenAddress(chainId, fromCurrency);
        const toTokenAddress = getTokenAddress(chainId, toCurrency);
        
        // Get exchange rate for 1 unit of fromCurrency
        const amountIn = parseEther('1');
        const quote = await mento.getAmountOut(fromTokenAddress, toTokenAddress, amountIn);
        
        const exchangeRate = formatEther(quote);
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
  const { mento, isConnected } = useMento();
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
    if (!mento || !walletClient || !publicClient || !isConnected) {
      throw new Error('Wallet not connected or Mento not initialized');
    }

    setIsSwapping(true);
    setError(null);

    try {
      const chainId = await publicClient.getChainId();
      const fromTokenAddress = getTokenAddress(chainId, fromCurrency);
      const toTokenAddress = getTokenAddress(chainId, toCurrency);
      
      const amountInWei = parseEther(amountIn);
      
      // Get quote for minimum amount out if not provided
      const quote = await mento.getAmountOut(fromTokenAddress, toTokenAddress, amountInWei);
      const minAmountOutWei = minAmountOut ? parseEther(minAmountOut) : quote * BigInt(95) / BigInt(100); // 5% slippage
      
      // Execute the swap
      const tx = await mento.swapIn(
        walletClient,
        fromTokenAddress,
        toTokenAddress,
        amountInWei,
        minAmountOutWei,
        recipient as `0x${string}`
      );

      return {
        hash: tx,
        amountIn: amountIn,
        amountOut: formatEther(quote),
        exchangeRate: formatEther(quote * BigInt(1e18) / amountInWei),
        fromCurrency,
        toCurrency,
        recipient,
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
        const tokenAddress = getTokenAddress(chainId, currency);
        
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
        const fromTokenAddress = getTokenAddress(chainId, fromCurrency);
        const toTokenAddress = getTokenAddress(chainId, toCurrency);
        
        const amountInWei = parseEther(amountIn);
        const amountOutWei = await mento.getAmountOut(fromTokenAddress, toTokenAddress, amountInWei);
        
        const amountOut = formatEther(amountOutWei);
        const exchangeRate = formatEther(amountOutWei * BigInt(1e18) / amountInWei);
        
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
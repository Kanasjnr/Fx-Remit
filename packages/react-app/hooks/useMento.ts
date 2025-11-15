import { useState, useEffect, useRef } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Mento } from '@mento-protocol/mento-sdk';
import { parseEther, formatEther } from 'viem';
import { providers } from 'ethers';
import { Currency, getTokenAddress } from '../lib/contracts';
import { useEthersSwap } from './useEthersSwap';
import { usePageVisibility } from './usePageVisibility';
import { useRefreshTrigger } from './useRefreshTrigger';

const balanceCache = new Map<string, { balance: string; timestamp: number }>();
const hasLoadedCache = new Set<string>();

export function useMento() {
  return useEthersSwap();
}

export function useExchangeRate(fromCurrency: Currency, toCurrency: Currency) {
  const publicClient = usePublicClient();
  const [rate, setRate] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRate() {
      if (fromCurrency === toCurrency) {
        setRate('1');
        return;
      }

      if (!publicClient) {
        setRate('0');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const provider = new providers.JsonRpcProvider('https://forno.celo.org');
        const mento = await Mento.create(provider);
        const chainId = 42220;
        const fromTokenAddress = getTokenAddress(chainId, fromCurrency);
        const toTokenAddress = getTokenAddress(chainId, toCurrency);
        const amountIn = parseEther('1');
        const quote = await mento.getAmountOut(fromTokenAddress, toTokenAddress, amountIn);
        const exchangeRate = formatEther(BigInt(quote.toString()));
        
        setRate(exchangeRate);
      } catch (err) {
        setError('Failed to fetch exchange rate');
        setRate('0');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRate();
  }, [publicClient, fromCurrency, toCurrency]);

  return {
    rate: parseFloat(rate),
    isLoading,
    error,
  };
}

export function useTokenBalance(currency: Currency) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { shouldPoll } = usePageVisibility();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (address && currency) {
      const cacheKey = `${address}-${currency}`;
      if (balanceCache.has(cacheKey)) {
        const cached = balanceCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
          setBalance(cached.balance);
          hasLoadedCache.add(cacheKey);
          return;
        } else {
          balanceCache.delete(cacheKey);
          hasLoadedCache.delete(cacheKey);
        }
      }
    }
  }, [address, currency]);

  useEffect(() => {
    if (!address || !currency) return;

    const cacheKey = `${address}-${currency}`;
    
    if (hasLoadedCache.has(cacheKey)) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    async function fetchBalance() {
      if (!address || !publicClient || !shouldPoll) {
        if (!shouldPoll) {
          return;
        }
        setBalance('0');
        return;
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      try {
        const chainId = 42220;
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

        if (abortController.signal.aborted) return;

        const formattedBalance = formatEther(balance);
        setBalance(formattedBalance);
        balanceCache.set(cacheKey, { balance: formattedBalance, timestamp: Date.now() });
        hasLoadedCache.add(cacheKey);
      } catch (err) {
        if (abortController.signal.aborted) return;
        
        setError('Failed to fetch balance');
        setBalance('0');
        hasLoadedCache.add(cacheKey);
      } finally {
        if (!abortController.signal.aborted) {
        setIsLoading(false);
        }
      }
    }

    fetchBalance();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [address, publicClient, currency, shouldPoll]);

  useRefreshTrigger(() => {
    if (address && publicClient && shouldPoll && currency) {
      const cacheKey = `${address}-${currency}`;
      hasLoadedCache.delete(cacheKey);
      balanceCache.delete(cacheKey);
      
      const fetchBalance = async () => {
        try {
          const chainId = 42220;
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
          const formattedBalance = formatEther(balance);
          setBalance(formattedBalance);
          if (address && currency) {
            const cacheKey = `${address}-${currency}`;
            balanceCache.set(cacheKey, { balance: formattedBalance, timestamp: Date.now() });
            hasLoadedCache.add(cacheKey);
          }
        } catch (err) {
          if (address && currency) {
            hasLoadedCache.add(`${address}-${currency}`);
          }
        }
      };
      fetchBalance();
    }
  });

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
      if (!publicClient || !amountIn || parseFloat(amountIn) <= 0 || fromCurrency === toCurrency) {
        setQuote(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const provider = new providers.JsonRpcProvider('https://forno.celo.org');
        const mento = await Mento.create(provider);
        const chainId = 42220;
        const fromTokenAddress = getTokenAddress(chainId, fromCurrency);
        const toTokenAddress = getTokenAddress(chainId, toCurrency);
        const amountInWei = parseEther(amountIn);
        const amountOutWei = await mento.getAmountOut(fromTokenAddress, toTokenAddress, amountInWei);
        const amountOutBigInt = BigInt(amountOutWei.toString());
        const amountOut = formatEther(amountOutBigInt);
        const exchangeRate = formatEther(amountOutBigInt * BigInt(1e18) / amountInWei);
        const platformFee = (parseFloat(amountIn) * 0.015).toString();
        const priceImpact = '0.1';
        
        setQuote({
          amountOut,
          exchangeRate,
          platformFee,
          priceImpact,
        });
      } catch (err) {
        setError('Failed to fetch quote');
        setQuote(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuote();
  }, [publicClient, fromCurrency, toCurrency, amountIn]);

  return {
    quote,
    isLoading,
    error,
  };
}
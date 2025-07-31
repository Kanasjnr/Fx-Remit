import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Mento } from '@mento-protocol/mento-sdk';
import { parseEther, formatEther } from 'viem';
import { providers } from 'ethers';
import { Currency, getTokenAddress } from '../lib/contracts';
import { useEthersSwap } from './useEthersSwap';

// Simplified implementation - the complex swap logic is now in useEthersSwap
export function useMento() {
  const ethersSwap = useEthersSwap();
  return ethersSwap;
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
        
        const chainId = 42220; // Celo Mainnet
        const fromTokenAddress = getTokenAddress(chainId, fromCurrency);
        const toTokenAddress = getTokenAddress(chainId, toCurrency);
        
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
        const chainId = 42220; // Celo Mainnet
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
        
        const chainId = 42220; // Celo Mainnet
        const fromTokenAddress = getTokenAddress(chainId, fromCurrency);
        const toTokenAddress = getTokenAddress(chainId, toCurrency);
        
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
  }, [publicClient, fromCurrency, toCurrency, amountIn]);

  return {
    quote,
    isLoading,
    error,
  };
}
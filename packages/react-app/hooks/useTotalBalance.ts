import { useState, useEffect, useRef } from 'react';
import { useAccount, useBalance, usePublicClient } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { Mento } from '@mento-protocol/mento-sdk';
import { providers } from 'ethers';
import { getTokenAddress } from '@/lib/contracts';
import { CURRENCIES } from '@/lib/currencies';
import { usePageVisibility } from './usePageVisibility';
import { useRefreshTrigger } from './useRefreshTrigger';

const balanceCache = new Map<string, { balance: number; timestamp: number }>();
const hasLoadedCache = new Set<string>();

export function useTotalBalance() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { shouldPoll } = usePageVisibility();
  const [totalUsdBalance, setTotalUsdBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCalculatingRef = useRef(false);

  const { data: celoBalance, isLoading: isLoadingCelo } = useBalance({
    address: address,
    query: {
      enabled: !!address && shouldPoll,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  });

  useEffect(() => {
    if (address && balanceCache.has(address)) {
      const cached = balanceCache.get(address)!;
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setTotalUsdBalance(cached.balance);
        hasLoadedCache.add(address);
        return;
      } else {
        balanceCache.delete(address);
        hasLoadedCache.delete(address);
      }
    }
  }, [address]);

  useEffect(() => {
    if (!address) return;

    if (hasLoadedCache.has(address)) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    async function calculateTotalBalance() {
      if (!address || !publicClient || !shouldPoll) {
        if (!shouldPoll) {
          return;
        }
        setTotalUsdBalance(0);
        return;
      }

      if (isCalculatingRef.current) return;
      isCalculatingRef.current = true;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      try {
        const chainId = 42220;
        const cUSDAddress = getTokenAddress(chainId, 'cUSD');
        let totalUsd = 0;

        const provider = new providers.JsonRpcProvider(
          'https://forno.celo.org'
        );
        const mento = await Mento.create(provider);

        if (abortController.signal.aborted) {
          isCalculatingRef.current = false;
          return;
        }

        if (celoBalance && celoBalance.value > BigInt(0)) {
          const celoAmount = formatEther(celoBalance.value);
          const celoAmountWei = parseEther(celoAmount);

          const celoNativeAddress =
            '0x471EcE3750Da237f93B8E339c536989b8978a438';

          const celoToCusd = await mento.getAmountOut(
            celoNativeAddress,
            cUSDAddress,
            celoAmountWei.toString()
          );

          if (abortController.signal.aborted) {
            isCalculatingRef.current = false;
            return;
          }

          const celoUsdValue = parseFloat(
            formatEther(BigInt(celoToCusd.toString()))
          );
          totalUsd += celoUsdValue;
        }

        const balancePromises = CURRENCIES.map(async (currency) => {
          if (abortController.signal.aborted) return 0;
          
          try {
            const tokenAddress = getTokenAddress(chainId, currency.code);

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

            if (abortController.signal.aborted) return 0;

            const balanceValue = formatEther(balance);
            const balanceNum = parseFloat(balanceValue);

            if (balanceNum <= 0) {
              return 0;
            }

            if (currency.code === 'cUSD') {
              return balanceNum;
            }

            const fromToken = getTokenAddress(chainId, currency.code);
            const amountInWei = parseEther(balanceValue);

            const amountOut = await mento.getAmountOut(
              fromToken,
              cUSDAddress,
              amountInWei.toString()
            );

            if (abortController.signal.aborted) return 0;

            const usdValue = parseFloat(
              formatEther(BigInt(amountOut.toString()))
            );
            return usdValue;
          } catch (err) {
            if (abortController.signal.aborted) return 0;
            return 0;
          }
        });

        const balances = await Promise.all(balancePromises);

        if (abortController.signal.aborted) {
          isCalculatingRef.current = false;
          return;
        }

        const tokensTotal = balances.reduce((sum, val) => sum + val, 0);
        const finalBalance = totalUsd + tokensTotal;
        setTotalUsdBalance(finalBalance);
        if (address) {
          balanceCache.set(address, { balance: finalBalance, timestamp: Date.now() });
          hasLoadedCache.add(address);
        }
      } catch (err) {
        if (abortController.signal.aborted) {
          isCalculatingRef.current = false;
          return;
        }
        setError('Failed to calculate total balance');
        setTotalUsdBalance(0);
        if (address) {
          hasLoadedCache.add(address);
        }
      } finally {
        if (!abortController.signal.aborted) {
        setIsLoading(false);
          isCalculatingRef.current = false;
        }
      }
    }

    if (address && publicClient && !isLoadingCelo && shouldPoll) {
      calculateTotalBalance();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isCalculatingRef.current = false;
    };
  }, [address, publicClient, celoBalance, isLoadingCelo, shouldPoll]);

  useRefreshTrigger(() => {
    if (address && publicClient && !isLoadingCelo && shouldPoll && !isCalculatingRef.current) {
      hasLoadedCache.delete(address);
      balanceCache.delete(address);
      
      const recalculate = async () => {
        if (isCalculatingRef.current) return;
        isCalculatingRef.current = true;

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
          const chainId = 42220;
          const cUSDAddress = getTokenAddress(chainId, 'cUSD');
          let totalUsd = 0;

          const provider = new providers.JsonRpcProvider('https://forno.celo.org');
          const mento = await Mento.create(provider);

          if (abortController.signal.aborted) {
            isCalculatingRef.current = false;
            return;
          }

          const freshCeloBalance = celoBalance;
          if (freshCeloBalance && freshCeloBalance.value > BigInt(0)) {
            const celoAmount = formatEther(freshCeloBalance.value);
            const celoAmountWei = parseEther(celoAmount);
            const celoNativeAddress = '0x471EcE3750Da237f93B8E339c536989b8978a438';
            const celoToCusd = await mento.getAmountOut(celoNativeAddress, cUSDAddress, celoAmountWei.toString());
            
            if (abortController.signal.aborted) {
              isCalculatingRef.current = false;
              return;
            }
            
            totalUsd += parseFloat(formatEther(BigInt(celoToCusd.toString())));
          }

          const balancePromises = CURRENCIES.map(async (currency) => {
            if (abortController.signal.aborted) return 0;
            try {
              const tokenAddress = getTokenAddress(chainId, currency.code);
              const balance = await publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: [{ inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }],
                functionName: 'balanceOf',
                args: [address],
              });

              if (abortController.signal.aborted) return 0;
              const balanceValue = formatEther(balance);
              const balanceNum = parseFloat(balanceValue);
              if (balanceNum <= 0) return 0;
              if (currency.code === 'cUSD') return balanceNum;

              const fromToken = getTokenAddress(chainId, currency.code);
              const amountInWei = parseEther(balanceValue);
              const amountOut = await mento.getAmountOut(fromToken, cUSDAddress, amountInWei.toString());
              if (abortController.signal.aborted) return 0;
              return parseFloat(formatEther(BigInt(amountOut.toString())));
            } catch (err) {
              if (abortController.signal.aborted) return 0;
              return 0;
            }
          });

          const balances = await Promise.all(balancePromises);
          if (abortController.signal.aborted) {
            isCalculatingRef.current = false;
            return;
          }
          const tokensTotal = balances.reduce((sum, val) => sum + val, 0);
          const finalBalance = totalUsd + tokensTotal;
          setTotalUsdBalance(finalBalance);
          if (address) {
            balanceCache.set(address, { balance: finalBalance, timestamp: Date.now() });
            hasLoadedCache.add(address);
          }
        } catch (err) {
          if (!abortController.signal.aborted) {
            if (address) {
              hasLoadedCache.add(address);
            }
          }
        } finally {
          if (!abortController.signal.aborted) {
            isCalculatingRef.current = false;
          }
        }
      };
      recalculate();
    }
  });

  return {
    totalUsdBalance,
    isLoading: isLoading || isLoadingCelo,
    error,
  };
}

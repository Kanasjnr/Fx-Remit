import { useState, useEffect } from 'react';
import { useAccount, useBalance, usePublicClient } from 'wagmi';
import { formatEther, parseEther, formatUnits, parseUnits } from 'viem';
import { Mento } from '@mento-protocol/mento-sdk';
import { providers } from 'ethers';
import { getTokenAddress } from '@/lib/contracts';
import { CURRENCIES } from '@/lib/currencies';

export function useTotalBalance() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [totalUsdBalance, setTotalUsdBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: celoBalance, isLoading: isLoadingCelo } = useBalance({
    address: address,
    query: {
      enabled: !!address,
    },
  });

  useEffect(() => {
    async function calculateTotalBalance() {
      if (!address || !publicClient) {
        setTotalUsdBalance(0);
        return;
      }

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

          const celoUsdValue = parseFloat(
            formatEther(BigInt(celoToCusd.toString()))
          );
          totalUsd += celoUsdValue;
        }

        const balancePromises = CURRENCIES.map(async (currency) => {
          try {
            const tokenAddress = getTokenAddress(chainId, currency.code);

            const erc20Abi = [
              {
                inputs: [{ name: 'account', type: 'address' }],
                name: 'balanceOf',
                outputs: [{ name: '', type: 'uint256' }],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [],
                name: 'decimals',
                outputs: [{ name: '', type: 'uint8' }],
                stateMutability: 'view',
                type: 'function',
              },
            ];

            const [balance, decimals] = await Promise.all([
              publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [address],
              }),
              publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: 'decimals',
              }),
            ]);

            const balanceValue = formatUnits(balance as bigint, decimals as number);
            const balanceNum = parseFloat(balanceValue);

            if (balanceNum <= 0) {
              return 0;
            }

            if (currency.code === 'cUSD') {
              return balanceNum;
            }

            if (currency.code === 'USDT' || currency.code === 'USDC') {
              return balanceNum;
            }

            const fromToken = getTokenAddress(chainId, currency.code);
            const amountInWei = parseUnits(balanceValue, decimals as number);

            const amountOut = await mento.getAmountOut(
              fromToken,
              cUSDAddress,
              amountInWei.toString()
            );

            const usdValue = parseFloat(
              formatEther(BigInt(amountOut.toString()))
            );
            return usdValue;
          } catch (err) {
            console.warn(`Failed to fetch balance for ${currency.code}:`, err);
            return 0;
          }
        });

        const balances = await Promise.all(balancePromises);
        const tokensTotal = balances.reduce((sum, val) => sum + val, 0);

        setTotalUsdBalance(totalUsd + tokensTotal);
      } catch (err) {
        console.error('Failed to calculate total balance:', err);
        setError('Failed to calculate total balance');
        setTotalUsdBalance(0);
      } finally {
        setIsLoading(false);
      }
    }

    if (address && publicClient && !isLoadingCelo) {
      calculateTotalBalance();
    }
  }, [address, publicClient, celoBalance, isLoadingCelo]);

  return {
    totalUsdBalance,
    isLoading: isLoading || isLoadingCelo,
    error,
  };
}

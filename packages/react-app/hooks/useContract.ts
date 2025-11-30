import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi';
import { parseEther, formatEther, formatUnits, parseAbiItem } from 'viem';
import { FXREMIT_CONTRACT, FXREMIT_V2_CONTRACT, getContractAddress, getContractV2Address, Currency, getTokenAddress, CURRENCY_INFO, SupportedChainId } from '../lib/contracts';
import { useEffect, useState, useMemo } from 'react';
import { useDivvi } from './useDivvi';
import { usePageVisibility } from './usePageVisibility';
import { useRefreshTrigger } from './useRefreshTrigger';

const CANONICAL_CURRENCY_MAP: Record<string, Currency> = Object.keys(
  CURRENCY_INFO
).reduce((acc, key) => {
  const currency = key as Currency;
  acc[currency] = currency;
  acc[currency.toUpperCase()] = currency;
  acc[currency.toLowerCase()] = currency;
  return acc;
}, {} as Record<string, Currency>);

const DISPLAY_SYMBOL_MAP: Record<string, Currency> = Object.entries(
  CURRENCY_INFO
).reduce((acc, [currency, info]) => {
  if (info.symbol) {
    acc[info.symbol] = currency as Currency;
  }
  return acc;
}, {} as Record<string, Currency>);

const normalizeCurrency = (value: string): Currency => {
  if (!value) return value as Currency;
  const trimmed = value.trim();
  return (
    CANONICAL_CURRENCY_MAP[trimmed] ||
    CANONICAL_CURRENCY_MAP[trimmed.toUpperCase()] ||
    DISPLAY_SYMBOL_MAP[trimmed] ||
    DISPLAY_SYMBOL_MAP[trimmed.toUpperCase()] ||
    trimmed as Currency
  );
};

export function useFXRemitContract() {
  const chainId = useChainId();
  const address = getContractAddress(chainId);
  
  return {
    address,
    abi: FXREMIT_CONTRACT.abi,
    chainId,
    isConfigured: address !== null,
  };
}

export function useFXRemitV2Contract() {
  const chainId = useChainId();
  const address = getContractV2Address(chainId);
  
  return {
    address,
    abi: FXREMIT_V2_CONTRACT.abi,
    chainId,
    isConfigured: address !== null,
  };
}

export function useLogRemittance() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const contract = useFXRemitContract();
  const { submitReferralTransaction } = useDivvi();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const logRemittance = async (params: {
    recipient: string;
    fromCurrency: Currency;
    toCurrency: Currency;
    amountSent: string;
    amountReceived: string;
    exchangeRate: string;
    platformFee: string;
    mentoTxHash: string;
    corridor: string;
  }) => {
    if (!contract.isConfigured) {
      throw new Error('Contract not configured for this chain');
    }
    
    const fromTokenAddress = getTokenAddress(contract.chainId as SupportedChainId, params.fromCurrency);
    const toTokenAddress = getTokenAddress(contract.chainId as SupportedChainId, params.toCurrency);

    const safeParseEther = (value: string | undefined, fallback = '0') => {
      return parseEther(value || fallback);
    };
    
    writeContract({
      address: contract.address as `0x${string}`,
      abi: contract.abi,
      functionName: 'logRemittance',
      args: [
        params.recipient,
        fromTokenAddress,
        toTokenAddress,
        params.fromCurrency,
        params.toCurrency,
        safeParseEther(params.amountSent),
        safeParseEther(params.amountReceived),
        safeParseEther(params.exchangeRate, '1'),
        safeParseEther(params.platformFee),
        params.mentoTxHash || '',
        params.corridor,
      ],
    });
  };

  useEffect(() => {
    if (isConfirmed && hash) {
      submitReferralTransaction(hash);
    }
  }, [isConfirmed, hash, submitReferralTransaction]);

  return {
    logRemittance,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useUserRemittances(userAddress?: string) {
  const contractV1 = useFXRemitContract();
  const contractV2 = useFXRemitV2Contract();
  const { shouldPoll } = usePageVisibility();
  
  // Fetch from V1
  const { data: remittanceIdsV1, isLoading: isLoadingV1, error: errorV1, refetch: refetchV1 } = useReadContract({
    address: contractV1.address as `0x${string}`,
    abi: contractV1.abi,
    functionName: 'getUserRemittances',
    args: [userAddress],
    query: {
      enabled: !!userAddress && contractV1.isConfigured && shouldPoll,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 120000,
      gcTime: 300000,
    },
  });

  // Fetch from V2
  const { data: remittanceIdsV2, isLoading: isLoadingV2, error: errorV2, refetch: refetchV2 } = useReadContract({
    address: contractV2.address as `0x${string}`,
    abi: contractV2.abi,
    functionName: 'getUserRemittances',
    args: [userAddress],
    query: {
      enabled: !!userAddress && contractV2.isConfigured && shouldPoll,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 120000,
      gcTime: 300000,
    },
  });

  const mergedRemittanceIds = useMemo(() => {
    const v1Ids = (remittanceIdsV1 as bigint[] || [])
      .filter(id => id !== undefined && id !== null)
      .map(id => ({ id, version: 'v1' as const, contract: contractV1.address }));
    
    const v2Ids = (remittanceIdsV2 as bigint[] || [])
      .filter(id => id !== undefined && id !== null)
      .map(id => ({ id, version: 'v2' as const, contract: contractV2.address }));
    
    return [...v1Ids, ...v2Ids];
  }, [remittanceIdsV1, remittanceIdsV2, contractV1.address, contractV2.address]);

  useRefreshTrigger(() => {
    if (userAddress && shouldPoll) {
      if (contractV1.isConfigured) refetchV1();
      if (contractV2.isConfigured) refetchV2();
    }
  });

  return {
    remittanceIds: mergedRemittanceIds,
    isLoading: isLoadingV1 || isLoadingV2,
    error: errorV1 || errorV2,
    refetch: async () => {
      await Promise.all([
        contractV1.isConfigured ? refetchV1() : Promise.resolve(),
        contractV2.isConfigured ? refetchV2() : Promise.resolve(),
      ]);
    },
  };
}

export function useRemittanceDetails(remittanceId: bigint, version: 'v1' | 'v2' = 'v1', contractAddress?: string) {
  const contractV1 = useFXRemitContract();
  const contractV2 = useFXRemitV2Contract();
  const publicClient = usePublicClient();
  const { shouldPoll } = usePageVisibility();
  const [txHash, setTxHash] = useState<string>('');
  
  const contract = version === 'v2' ? contractV2 : contractV1;
  
  const { data: remittanceData, isLoading, error } = useReadContract({
    address: (contractAddress || contract.address) as `0x${string}`,
    abi: contract.abi,
    functionName: 'getRemittance',
    args: [remittanceId],
    query: {
      enabled: contract.isConfigured && remittanceId !== undefined && remittanceId !== null && shouldPoll,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 120000,
      gcTime: 300000,
    },
  });

  const fromToken = remittanceData ? (remittanceData as any).fromToken : undefined;
  const toToken = remittanceData ? (remittanceData as any).toToken : undefined;

  const erc20Abi = [
    {
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', type: 'uint8' }],
      stateMutability: 'view',
      type: 'function',
    },
  ];

  const { data: fromDecimals } = useReadContract({
    address: fromToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!fromToken && !!publicClient && !!remittanceData,
    },
  });

  const { data: toDecimals } = useReadContract({
    address: toToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!toToken && !!publicClient && !!remittanceData,
    },
  });

  useEffect(() => {
    async function fetchTransactionHash() {
      if (!contract.isConfigured || !publicClient || !remittanceId || !contract.address) {
        return;
      }

      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(1000000) ? currentBlock - BigInt(1000000) : BigInt(0);
        
        let txHashFound = '';
        
        if (version === 'v2') {
          const tokensTransferredAbi = parseAbiItem(
            'event TokensTransferred(uint256 indexed remittanceId, address indexed token, address indexed to, uint256 amount)'
          );
          
          const logs = await publicClient.getLogs({
            address: contract.address as `0x${string}`,
            event: tokensTransferredAbi,
            args: {
              remittanceId: remittanceId,
            },
            fromBlock: fromBlock,
            toBlock: currentBlock,
          });
          
          if (logs && logs.length > 0) {
            txHashFound = logs[0].transactionHash;
          }
        } else {
          const remittanceLoggedAbi = parseAbiItem(
            'event RemittanceLogged(uint256 indexed remittanceId, address indexed sender, address indexed recipient, string fromCurrency, string toCurrency, uint256 amountSent, uint256 amountReceived, string corridor)'
          );
          
          const logs = await publicClient.getLogs({
            address: contract.address as `0x${string}`,
            event: remittanceLoggedAbi,
            args: {
              remittanceId: remittanceId,
            },
            fromBlock: fromBlock,
            toBlock: currentBlock,
          });
          
          if (logs && logs.length > 0) {
            txHashFound = logs[0].transactionHash;
          }
        }
        
        if (txHashFound) {
          setTxHash(txHashFound);
        }
      } catch (err) {
      }
    }

    fetchTransactionHash();
  }, [contract.isConfigured, contract.address, publicClient, remittanceId, version]);

  const safeFormatAmount = (value: any, decimals: number | bigint | undefined, fallbackDecimals: number = 18) => {
    if (value === undefined || value === null) {
      return '0';
    }
    try {
      const dec = decimals !== undefined ? Number(decimals) : fallbackDecimals;
      return formatUnits(value, dec);
    } catch (err) {
      return '0';
    }
  };

  const zeroHash = '0x' + '0'.repeat(64);
  const contractMentoTxHash = (remittanceData as any)?.mentoTxHash;
  const finalTxHash = txHash || 
    (contractMentoTxHash && contractMentoTxHash !== zeroHash 
     ? contractMentoTxHash 
     : '');

  const remittance = useMemo(() => {
    if (!remittanceData) return null;
    
    const fromTokenAddr = (remittanceData as any).fromToken;
    const toTokenAddr = (remittanceData as any).toToken;
    const isFromNative = !fromTokenAddr || fromTokenAddr === '0x0000000000000000000000000000000000000000';
    const isToNative = !toTokenAddr || toTokenAddr === '0x0000000000000000000000000000000000000000';
    
    if (!isFromNative && fromDecimals === undefined) return null;
    if (!isToNative && toDecimals === undefined) return null;
    
    const resolvedFromDecimals = Number(isFromNative ? 18 : fromDecimals ?? 18);
    const resolvedToDecimals = Number(isToNative ? 18 : toDecimals ?? 18);
    
    const normalizedFromCurrency = normalizeCurrency(
      (remittanceData as any).fromCurrency
    );
    const normalizedToCurrency = normalizeCurrency(
      (remittanceData as any).toCurrency
    );
    
    return {
      id: (remittanceData as any).id,
      sender: (remittanceData as any).sender,
      recipient: (remittanceData as any).recipient,
      fromToken: fromTokenAddr,
      toToken: toTokenAddr,
      fromCurrency: normalizedFromCurrency,
      toCurrency: normalizedToCurrency,
      amountSent: safeFormatAmount((remittanceData as any).amountSent, resolvedFromDecimals, 18),
      amountReceived: safeFormatAmount((remittanceData as any).amountReceived, resolvedToDecimals, 18),
      exchangeRate: formatEther((remittanceData as any).exchangeRate || BigInt(0)), // Exchange rate is always 18 decimals
      platformFee: safeFormatAmount((remittanceData as any).platformFee, resolvedToDecimals, 18), // Fee is 1.5% of amount received (in toToken)
      timestamp: new Date(Number((remittanceData as any).timestamp) * 1000),
      mentoTxHash: finalTxHash,
      corridor: (remittanceData as any).corridor,
      fromDecimals: resolvedFromDecimals,
      toDecimals: resolvedToDecimals,
    };
  }, [remittanceData, fromDecimals, toDecimals, finalTxHash]);

  return {
    remittance: remittance,
    isLoading: contract.isConfigured ? (isLoading || (!!fromToken && fromDecimals === undefined) || (!!toToken && toDecimals === undefined)) : false,
    error: contract.isConfigured ? error : null,
  };
}

export function usePlatformStats() {
  const contract = useFXRemitContract();
  
  const { data: stats, isLoading, error } = useReadContract({
    address: contract.address as `0x${string}`,
    abi: contract.abi,
    functionName: 'getPlatformStats',
    query: {
      enabled: contract.isConfigured,
    },
  });

  const formatted = stats && Array.isArray(stats) ? {
    totalVolume: formatEther(stats[0] as bigint),
    totalFees: formatEther(stats[1] as bigint),
    totalTransactions: Number(stats[2]),
    totalRemittances: Number(stats[3]),
  } : null;

  return {
    stats: formatted,
    isLoading: contract.isConfigured ? isLoading : false,
    error: contract.isConfigured ? error : null,
    isConfigured: contract.isConfigured,
  };
}

export function useUserStats(userAddress?: string, maxTransactions: number = 50) {
  const contract = useFXRemitContract();
  
  const { data: userStats, isLoading, error } = useReadContract({
    address: contract.address as `0x${string}`,
    abi: contract.abi,
    functionName: 'getUserStats',
    args: [userAddress, BigInt(maxTransactions)],
    query: {
      enabled: !!userAddress,
    },
  });

  const formatted = userStats && Array.isArray(userStats) ? {
    totalSent: formatEther(userStats[0] as bigint),
    transactionsProcessed: Number(userStats[1]),
    totalFees: formatEther(userStats[2] as bigint),
    totalTransactions: Number(userStats[3]),
  } : null;

  return {
    userStats: formatted,
    isLoading,
    error,
  };
}

export function useCorridorVolume(corridor: string) {
  const contract = useFXRemitContract();
  
  const { data: volume, isLoading, error } = useReadContract({
    address: contract.address as `0x${string}`,
    abi: contract.abi,
    functionName: 'getCorridorVolume',
    args: [corridor],
    query: {
      enabled: !!corridor,
    },
  });

  return {
    volume: volume ? formatEther(volume as bigint) : '0',
    isLoading,
    error,
  };
}

export function useIsSupportedToken(tokenAddress: string) {
  const contract = useFXRemitContract();
  
  const { data: isSupported, isLoading, error } = useReadContract({
    address: contract.address as `0x${string}`,
    abi: contract.abi,
    functionName: 'isSupportedToken',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return {
    isSupported: !!isSupported,
    isLoading,
    error,
  };
}

export function getCurrencyInfo(currency: Currency) {
  return CURRENCY_INFO[currency];
} 
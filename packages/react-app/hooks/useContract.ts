import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient } from 'wagmi';
import { parseEther, formatEther, parseAbiItem } from 'viem';
import { FXREMIT_CONTRACT, getContractAddress, Currency, getTokenAddress, CURRENCY_INFO, SupportedChainId } from '../lib/contracts';
import { useEffect, useState } from 'react';
import { useDivvi } from './useDivvi';
import { usePageVisibility } from './usePageVisibility';
import { useRefreshTrigger } from './useRefreshTrigger';

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
  const contract = useFXRemitContract();
  const { shouldPoll } = usePageVisibility();
  
  const { data: remittanceIds, isLoading, error, refetch } = useReadContract({
    address: contract.address as `0x${string}`,
    abi: contract.abi,
    functionName: 'getUserRemittances',
    args: [userAddress],
    query: {
      enabled: !!userAddress && contract.isConfigured && shouldPoll,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 120000,
      gcTime: 300000,
    },
  });

  useRefreshTrigger(() => {
    if (userAddress && contract.isConfigured && shouldPoll) {
      refetch();
    }
  });

  return {
    remittanceIds: (remittanceIds as bigint[] || []).filter(id => id !== undefined && id !== null),
    isLoading: contract.isConfigured ? isLoading : false,
    error: contract.isConfigured ? error : null,
    refetch: refetch as () => Promise<any>,
  };
}

export function useRemittanceDetails(remittanceId: bigint) {
  const contract = useFXRemitContract();
  const { shouldPoll } = usePageVisibility();
  const publicClient = usePublicClient();
  const [txHash, setTxHash] = useState<string>('');
  
  const { data: remittanceData, isLoading, error } = useReadContract({
    address: contract.address as `0x${string}`,
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

  useEffect(() => {
    async function fetchTransactionHash() {
      if (!contract.isConfigured || !publicClient || !remittanceId || !contract.address) {
        return;
      }

      try {
        const eventAbi = parseAbiItem(
          'event RemittanceLogged(uint256 indexed remittanceId, address indexed sender, address indexed recipient, string fromCurrency, string toCurrency, uint256 amountSent, uint256 amountReceived, string corridor)'
        );
        
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(1000000) ? currentBlock - BigInt(1000000) : BigInt(0);
        
        const logs = await publicClient.getLogs({
          address: contract.address as `0x${string}`,
          event: eventAbi,
          args: {
            remittanceId: remittanceId,
          },
          fromBlock: fromBlock,
          toBlock: currentBlock,
        });
        
        if (logs && logs.length > 0) {
          setTxHash(logs[0].transactionHash);
        }
      } catch (err) {
        // Silently fail - transaction hash is optional
      }
    }

    fetchTransactionHash();
  }, [contract.isConfigured, contract.address, publicClient, remittanceId]);

  const safeFormatEther = (value: any) => {
    if (value === undefined || value === null) {
      return '0';
    }
    try {
      return formatEther(value);
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

  const remittance = remittanceData ? {
    id: (remittanceData as any).id,
    sender: (remittanceData as any).sender,
    recipient: (remittanceData as any).recipient,
    fromToken: (remittanceData as any).fromToken,
    toToken: (remittanceData as any).toToken,
    fromCurrency: (remittanceData as any).fromCurrency,
    toCurrency: (remittanceData as any).toCurrency,
    amountSent: safeFormatEther((remittanceData as any).amountSent),
    amountReceived: safeFormatEther((remittanceData as any).amountReceived),
    exchangeRate: safeFormatEther((remittanceData as any).exchangeRate),
    platformFee: safeFormatEther((remittanceData as any).platformFee),
    timestamp: new Date(Number((remittanceData as any).timestamp) * 1000),
    mentoTxHash: finalTxHash,
    corridor: (remittanceData as any).corridor,
  } : null;

  return {
    remittance: remittance,
    isLoading: contract.isConfigured ? isLoading : false,
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
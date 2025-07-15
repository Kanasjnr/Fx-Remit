import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { FXREMIT_CONTRACT, getContractAddress, Currency, getTokenAddress, CURRENCY_INFO, isContractConfigured, SupportedChainId } from '../lib/contracts';

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
    
    if (!contract.isConfigured) {
      throw new Error('Contract not configured for this chain');
    }
    
    const fromTokenAddress = getTokenAddress(contract.chainId as SupportedChainId, params.fromCurrency);
    const toTokenAddress = getTokenAddress(contract.chainId as SupportedChainId, params.toCurrency);
    
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
        parseEther(params.amountSent),
        parseEther(params.amountReceived),
        parseEther(params.exchangeRate),
        parseEther(params.platformFee),
        params.mentoTxHash,
        params.corridor,
      ],
    });
  };

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
  
  const { data: remittanceIds, isLoading, error } = useReadContract({
    address: contract.address as `0x${string}`,
    abi: contract.abi,
    functionName: 'getUserRemittances',
    args: [userAddress],
    query: {
      enabled: !!userAddress && contract.isConfigured,
    },
  });

  return {
    remittanceIds: remittanceIds as bigint[] || [],
    isLoading: contract.isConfigured ? isLoading : false,
    error: contract.isConfigured ? error : null,
  };
}

export function useRemittanceDetails(remittanceId: bigint) {
  const contract = useFXRemitContract();
  
  const { data: remittance, isLoading, error } = useReadContract({
    address: contract.address as `0x${string}`,
    abi: contract.abi,
    functionName: 'getRemittance',
    args: [remittanceId],
    query: {
      enabled: !!remittanceId && contract.isConfigured,
    },
  });

  const formatted = remittance && Array.isArray(remittance) ? {
    id: remittance[0],
    sender: remittance[1],
    recipient: remittance[2],
    fromToken: remittance[3],
    toToken: remittance[4],
    fromCurrency: remittance[5],
    toCurrency: remittance[6],
    amountSent: formatEther(remittance[7]),
    amountReceived: formatEther(remittance[8]),
    exchangeRate: formatEther(remittance[9]),
    platformFee: formatEther(remittance[10]),
    timestamp: new Date(Number(remittance[11]) * 1000),
    mentoTxHash: remittance[12],
    corridor: remittance[13],
  } : null;

  return {
    remittance: formatted,
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
      enabled: contract.isConfigured, // Only run query if contract is configured
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

// Helper function to get currency information
export function getCurrencyInfo(currency: Currency) {
  return CURRENCY_INFO[currency];
} 
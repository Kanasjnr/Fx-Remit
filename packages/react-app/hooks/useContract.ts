import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { FXREMIT_CONTRACT, getContractAddress, Currency, getTokenAddress, CURRENCY_INFO } from '../lib/contracts';

export function useFXRemitContract() {
  const chainId = useChainId();
  
  return {
    address: getContractAddress(chainId),
    abi: FXREMIT_CONTRACT.abi,
    chainId,
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
    const fromTokenAddress = getTokenAddress(contract.chainId, params.fromCurrency);
    const toTokenAddress = getTokenAddress(contract.chainId, params.toCurrency);
    
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
      enabled: !!userAddress,
    },
  });

  return {
    remittanceIds: remittanceIds as bigint[] || [],
    isLoading,
    error,
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
      enabled: !!remittanceId,
    },
  });

  const formatted = remittance ? {
    id: remittance.id,
    sender: remittance.sender,
    recipient: remittance.recipient,
    fromToken: remittance.fromToken,
    toToken: remittance.toToken,
    fromCurrency: remittance.fromCurrency,
    toCurrency: remittance.toCurrency,
    amountSent: formatEther(remittance.amountSent),
    amountReceived: formatEther(remittance.amountReceived),
    exchangeRate: formatEther(remittance.exchangeRate),
    platformFee: formatEther(remittance.platformFee),
    timestamp: new Date(Number(remittance.timestamp) * 1000),
    mentoTxHash: remittance.mentoTxHash,
    corridor: remittance.corridor,
  } : null;

  return {
    remittance: formatted,
    isLoading,
    error,
  };
}

export function usePlatformStats() {
  const contract = useFXRemitContract();
  
  const { data: stats, isLoading, error } = useReadContract({
    address: contract.address as `0x${string}`,
    abi: contract.abi,
    functionName: 'getPlatformStats',
  });

  const formatted = stats ? {
    totalVolume: formatEther(stats[0]),
    totalFees: formatEther(stats[1]),
    totalTransactions: Number(stats[2]),
    totalRemittances: Number(stats[3]),
  } : null;

  return {
    stats: formatted,
    isLoading,
    error,
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

  const formatted = userStats ? {
    totalSent: formatEther(userStats[0]),
    transactionsProcessed: Number(userStats[1]),
    totalFees: formatEther(userStats[2]),
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
    volume: volume ? formatEther(volume) : '0',
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
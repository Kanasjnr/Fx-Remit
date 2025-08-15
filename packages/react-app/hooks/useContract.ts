import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { FXREMIT_CONTRACT, getContractAddress, Currency, getTokenAddress, CURRENCY_INFO, isContractConfigured, SupportedChainId } from '../lib/contracts';
import { useEffect } from 'react';
import { useDivvi } from './useDivvi';

export function useFXRemitContract() {
  const chainId = useChainId();
  const address = getContractAddress(chainId);
  
  // Contract configuration
  
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
      console.error('❌ Contract not configured for chain:', contract.chainId);
      throw new Error('Contract not configured for this chain');
    }
    
    const fromTokenAddress = getTokenAddress(contract.chainId as SupportedChainId, params.fromCurrency);
    const toTokenAddress = getTokenAddress(contract.chainId as SupportedChainId, params.toCurrency);

    // Safe parseEther with fallbacks
    const safeParseEther = (value: string | undefined, fallback = '0') => {
      const safeValue = value || fallback;
      return parseEther(safeValue);
    };
    
    // Call writeContract
    
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

  // Debug logging for writeContract states
  useEffect(() => {
    if (error) {
      console.error('❌ writeContract error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (hash) {
      // Transaction hash received
    }
  }, [hash]);

  useEffect(() => {
    if (isConfirmed && hash) {
      console.log('✅ writeContract confirmed!');
      // Submit referral to Divvi after transaction confirmation
      console.log('📬 Submitting referral to Divvi for logRemittance...');
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
    remittanceIds: (remittanceIds as bigint[] || []).filter(id => id !== undefined && id !== null),
    isLoading: contract.isConfigured ? isLoading : false,
    error: contract.isConfigured ? error : null,
  };
}

export function useRemittanceDetails(remittanceId: bigint) {
  const contract = useFXRemitContract();
  
  const { data: remittanceData, isLoading, error } = useReadContract({
    address: contract.address as `0x${string}`,
    abi: contract.abi,
    functionName: 'getRemittance',
    args: [remittanceId],
    query: {
      enabled: contract.isConfigured && remittanceId !== undefined && remittanceId !== null,
    },
  });

  // Debug the actual remittanceData structure (only on first load)
  if (remittanceData && !isLoading) {
    console.log('🔍 Successfully loaded remittance data for ID:', (remittanceData as any).id);
    console.log('🔍 Platform fee raw value:', (remittanceData as any).platformFee, typeof (remittanceData as any).platformFee);
  }

  // Safe formatting function to handle undefined values
  const safeFormatEther = (value: any) => {
    if (value === undefined || value === null) {
      console.warn('⚠️ Undefined value passed to formatEther, using 0');
      return '0';
    }
    try {
      return formatEther(value);
    } catch (err) {
      console.error('❌ Error formatting ether:', err, 'value:', value);
      return '0';
    }
  };

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
    mentoTxHash: (remittanceData as any).mentoTxHash,
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
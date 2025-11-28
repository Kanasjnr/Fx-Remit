'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useFarcasterMiniApp } from '@/hooks/useFarcasterMiniApp';
import BottomNavigation from '@/components/BottomNavigation';
import { useUserRemittances, useRemittanceDetails } from '@/hooks/useContract';
import type { Currency } from '@/lib/contracts';
import { getTokenAddress } from '@/lib/contracts';
import { formatEther, parseEther } from 'viem';
import Link from 'next/link';
import {
  CurrencyDollarIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  DocumentArrowDownIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  BanknotesIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { Mento } from '@mento-protocol/mento-sdk';
import { providers } from 'ethers';
import { uploadAvatar, getOptimizedAvatarUrl } from '@/lib/cloudinary';

function RemittanceLoader({
  remittanceId,
  onRemittanceReady,
}: {
  remittanceId: bigint;
  onRemittanceReady: (id: string, remittance: any) => void;
}) {
  const { remittance, isLoading } = useRemittanceDetails(remittanceId);
  const id = remittanceId.toString();
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    if (!hasNotified) {
      if (remittance && remittance.fromCurrency && remittance.toCurrency) {
        onRemittanceReady(id, remittance);
        setHasNotified(true);
      } else if (!isLoading && !remittance) {
        onRemittanceReady(id, null);
        setHasNotified(true);
      }
    }
  }, [remittance, isLoading, id, onRemittanceReady, hasNotified]);

  return null;
}

function StatsCalculator({
  remittances,
  onStatsReady,
}: {
  remittances: Record<string, any>;
  onStatsReady: (stats: any) => void;
}) {
  const calculatedStats = useMemo(() => {
    const validRemittances = Object.values(remittances).filter(
      (r) => r && r.fromCurrency && r.toCurrency
    );

    if (validRemittances.length > 0) {
      const stats = {
        totalSent: validRemittances.reduce(
          (sum, r) => sum + Number.parseFloat(r.amountSent || '0'),
          0
        ),
        totalReceived: validRemittances.reduce(
          (sum, r) => sum + Number.parseFloat(r.amountReceived || '0'),
          0
        ),
        feesByCurrency: validRemittances.reduce(
          (acc: Record<string, string>, r: any) => {
            const cur = r.fromCurrency as string;
            const fee = r.platformFee || '0';
            const feeStr = typeof fee === 'string' && fee.includes('.')
              ? fee
              : formatEther(BigInt(fee));
            const currentFee = acc[cur] || '0';
            const currentFeeNum = parseFloat(currentFee);
            const feeNum = parseFloat(feeStr);
            acc[cur] = (currentFeeNum + feeNum).toString();
            return acc;
          },
          {}
        ),
        totalTransactions: validRemittances.length,
        corridors: validRemittances.map(
          (r) => `${r.fromCurrency}-${r.toCurrency}`
        ),
        totalsByCurrency: validRemittances.reduce(
          (acc: Record<string, number>, r: any) => {
            const cur = r.fromCurrency as string;
            const amt = Number.parseFloat(r.amountSent || '0');
            acc[cur] = (acc[cur] || 0) + amt;
            return acc;
          },
          {}
        ),
      };

      const corridorCounts = stats.corridors.reduce(
        (acc: any, corridor: string) => {
          acc[corridor] = (acc[corridor] || 0) + 1;
          return acc;
        },
        {}
      );

      const favoriteCorridors = Object.entries(corridorCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 3)
        .map(([corridor]) => corridor);

      return {
        ...stats,
        favoriteCorridors,
        averageFeePercentage:
          stats.totalTransactions > 0
            ? (Object.values(stats.feesByCurrency).reduce((sum: number, feeStr: string) => sum + parseFloat(feeStr || '0'), 0) / stats.totalSent) * 100
            : 0,
      };
    } else {
      return {
        totalSent: 0,
        totalReceived: 0,
        feesByCurrency: {} as Record<string, string>,
        totalTransactions: 0,
        corridors: [],
        favoriteCorridors: [],
        averageFeePercentage: 0,
        totalsByCurrency: {},
      };
    }
  }, [remittances]);

  useEffect(() => {
    onStatsReady(calculatedStats);
  }, [calculatedStats, onStatsReady]);

  return null;
}

// Function to export transactions as CSV
const exportTransactionsToCSV = (transactions: any[], userAddress: string) => {
  if (!transactions || transactions.length === 0) {
    toast.error('No transactions to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'Transaction ID',
    'Date',
    'Time',
    'Sender',
    'Recipient',
    'From Currency',
    'To Currency',
    'Amount Sent',
    'Amount Received',
    'Exchange Rate',
    'Platform Fee',
    'Corridor',
    'Mento Transaction Hash',
    'Blockchain Transaction Hash',
  ];

  // Convert transactions to CSV rows
  const csvRows = transactions.map((tx) => [
    tx.id || 'N/A',
    tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'N/A',
    tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : 'N/A',
    tx.sender || 'N/A',
    tx.recipient || 'N/A',
    tx.fromCurrency || 'N/A',
    tx.toCurrency || 'N/A',
    tx.amountSent || '0',
    tx.amountReceived || '0',
    tx.exchangeRate || '1',
    tx.platformFee || '0',
    tx.corridor || 'N/A',
    tx.mentoTxHash || 'N/A',
    tx.blockchainTxHash || 'N/A',
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((field) => `"${field}"`).join(','))
    .join('\n');

  // Create and download the file with proper headers
  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `fx-remit-transactions-${userAddress.slice(0, 8)}-${
    new Date().toISOString().split('T')[0]
  }.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success(`Exported ${transactions.length} transactions to CSV`);
};

// Helper functions
const getCurrencyFlag = (currency: string) => {
  const flags: Record<string, string> = {
    USD: '🇺🇸',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
    NGN: '🇳🇬',
    GHS: '🇬🇭',
    KES: '🇰🇪',
    UGX: '🇺🇬',
    TZS: '🇹🇿',
    ZAR: '🇿🇦',
    CELO: '🌾',
    cUSD: '💵',
    cEUR: '💶',
    cREAL: '💴',
  };
  return flags[currency] || '💱';
};

const formatCurrency = (amount: number, currency: string) => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    GHS: '₵',
    KES: 'KSh',
    UGX: 'USh',
    TZS: 'TSh',
    ZAR: 'R',
    CELO: 'CELO',
    cUSD: 'cUSD',
    cEUR: 'cEUR',
    cREAL: 'cREAL',
  };

  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
};

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { isMiniApp } = useFarcasterMiniApp();
  const [copied, setCopied] = useState(false);
  const [userStats, setUserStats] = useState({
    totalSent: 0,
    totalReceived: 0,
    totalFees: 0,
    feesByCurrency: {} as Record<string, string>,
    totalTransactions: 0,
    favoriteCorridors: [] as string[],
    averageFeePercentage: 0,
    totalsByCurrency: {} as Record<string, number>,
  });

  const [usdEstimate, setUsdEstimate] = useState<number | null>(null);
  const [usdFees, setUsdFees] = useState<number | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarPublicId, setAvatarPublicId] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const usdEstimateCacheRef = useRef<{ key: string; value: number | null } | null>(null);
  const usdFeesCacheRef = useRef<{ key: string; value: number | null } | null>(null);
  const [activeModal, setActiveModal] = useState<
    'totalSent' | 'totalTransactions' | 'fees' | null
  >(null);

  const [loadedRemittances, setLoadedRemittances] = useState<
    Record<string, any>
  >({});
  const { remittanceIds, isLoading: isLoadingIds } = useUserRemittances(
    address && isConnected ? address : undefined
  );

  const walletState = useMemo(
    () => ({
      isConnected,
      address,
      isMiniApp,
      shouldInitialize: isMiniApp ? isConnected && address : true,
    }),
    [isConnected, address, isMiniApp]
  );

  
  useEffect(() => {
    setIsInitializing(!walletState.shouldInitialize);
  }, [walletState.shouldInitialize]);

  
  useEffect(() => {
    if (address) {
      const savedAvatarData = localStorage.getItem(`avatar_${address}`);
      if (savedAvatarData) {
        try {
          const avatarData = JSON.parse(savedAvatarData);
          setAvatar(avatarData.url);
          setAvatarPublicId(avatarData.publicId);
        } catch (error) {
          // Handle old format (just URL string)
          setAvatar(savedAvatarData);
        }
      }
    }
  }, [address]);


  const handleRemittanceReady = useCallback((id: string, remittance: any) => {
    setLoadedRemittances((prev) => {
      if (prev[id] !== remittance) {
        return { ...prev, [id]: remittance };
      }
      return prev;
    });
  }, []);

  const handleStatsReady = useCallback((stats: any) => {
    setUserStats(stats);
  }, []);

  const totalsByCurrencyKey = useMemo(() => {
    return JSON.stringify(userStats.totalsByCurrency || {});
  }, [userStats.totalsByCurrency]);

  const feesByCurrencyKey = useMemo(() => {
    return JSON.stringify(userStats.feesByCurrency || {});
  }, [userStats.feesByCurrency]);

  useEffect(() => {
    if (usdEstimateCacheRef.current?.key === totalsByCurrencyKey) {
      setUsdEstimate(usdEstimateCacheRef.current.value);
      return;
    }

    async function computeUsd() {
      try {
        const totals = userStats.totalsByCurrency || {};
        const entries = Object.entries(totals);
        if (!entries.length) {
          setUsdEstimate(0);
          usdEstimateCacheRef.current = { key: totalsByCurrencyKey, value: 0 };
          return;
        }
        const provider = new providers.JsonRpcProvider(
          'https://forno.celo.org'
        );
        const mento = await Mento.create(provider);
        const chainId = 42220 as const;
        const cUSD = getTokenAddress(chainId, 'cUSD' as Currency);
        let sumCusd = 0;
        for (const [cur, amt] of entries) {
          const amount = Number(amt) || 0;
          if (amount <= 0) continue;
          if (cur === 'cUSD') {
            sumCusd += amount;
            continue;
          }
          const fromToken = getTokenAddress(chainId, cur as Currency);
          const out = await mento.getAmountOut(
            fromToken,
            cUSD,
            parseEther(String(amount))
          );
          sumCusd += Number(formatEther(BigInt(out.toString())));
        }
        setUsdEstimate(sumCusd);
        usdEstimateCacheRef.current = { key: totalsByCurrencyKey, value: sumCusd };
      } catch (e) {
        setUsdEstimate(null);
        usdEstimateCacheRef.current = { key: totalsByCurrencyKey, value: null };
      }
    }
    computeUsd();
  }, [totalsByCurrencyKey, userStats.totalsByCurrency]);

  useEffect(() => {
    if (usdFeesCacheRef.current?.key === feesByCurrencyKey) {
      setUsdFees(usdFeesCacheRef.current.value);
      return;
    }

    async function computeUsdFees() {
      try {
        const fees = userStats.feesByCurrency || {};
        const entries = Object.entries(fees);
        if (!entries.length) {
          setUsdFees(0);
          usdFeesCacheRef.current = { key: feesByCurrencyKey, value: 0 };
          return;
        }
        const provider = new providers.JsonRpcProvider(
          'https://forno.celo.org'
        );
        const mento = await Mento.create(provider);
        const chainId = 42220 as const;
        const cUSDAddress = getTokenAddress(chainId, 'cUSD' as Currency);
        let sumCusd = 0;
        for (const [cur, amtStr] of entries) {
          const feeValue = amtStr || '0';
          if (parseFloat(feeValue) <= 0) continue;
          if (cur === 'cUSD') {
            sumCusd += parseFloat(feeValue);
            continue;
          }
          const fromToken = getTokenAddress(chainId, cur as Currency);
          const amountInWei = parseEther(feeValue);
          const out = await mento.getAmountOut(
            fromToken,
            cUSDAddress,
            amountInWei.toString()
          );
          const usdValue = parseFloat(
            formatEther(BigInt(out.toString()))
          );
          sumCusd += usdValue;
        }
        setUsdFees(sumCusd);
        usdFeesCacheRef.current = { key: feesByCurrencyKey, value: sumCusd };
      } catch (e) {
        setUsdFees(null);
        usdFeesCacheRef.current = { key: feesByCurrencyKey, value: null };
      }
    }
    computeUsdFees();
  }, [feesByCurrencyKey, userStats.feesByCurrency]);

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        toast.success('Address copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error('Failed to copy address');
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success('Wallet disconnected');
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && address) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setIsUploadingAvatar(true);

      try {
        const result = await uploadAvatar(file, address);

        const optimizedUrl = getOptimizedAvatarUrl(result.public_id, 100);

        setAvatar(optimizedUrl);
        setAvatarPublicId(result.public_id);

        const avatarData = {
          url: optimizedUrl,
          publicId: result.public_id,
          originalUrl: result.secure_url,
        };
        localStorage.setItem(`avatar_${address}`, JSON.stringify(avatarData));

        toast.success('Avatar updated successfully!');
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast.error('Failed to upload avatar. Please try again.');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleExportTransactions = () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    const validTransactions = Object.values(loadedRemittances).filter(
      (tx) => tx && tx.fromCurrency && tx.toCurrency
    );

    if (validTransactions.length === 0) {
      toast.error('No transactions found to export');
      return;
    }

    // Sort transactions by timestamp (newest first)
    const sortedTransactions = validTransactions.sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA;
    });

    exportTransactionsToCSV(sortedTransactions, address);
  };

  return (
    <>
      {/* Load individual remittances */}
      {remittanceIds
        .filter((id) => id && typeof id === 'bigint')
        .map((remittanceId) => (
          <RemittanceLoader
            key={remittanceId.toString()}
            remittanceId={remittanceId}
            onRemittanceReady={handleRemittanceReady}
          />
        ))}

      {/* Only calculate stats when loading is done */}
      {!isLoadingIds && (
        <StatsCalculator
          remittances={loadedRemittances}
          onStatsReady={handleStatsReady}
        />
      )}

      <div className="min-h-screen bg-gray-50 pb-16">
        {/* Header */}
        <header className="px-4 py-4 bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-md mx-auto">
            <Link
              href="/send"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-900">Profile</h1>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 py-4">
          <div className="max-w-md mx-auto space-y-6">
            {/* Your wallet section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center relative overflow-hidden cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      className="hidden"
                    />
                    {isUploadingAvatar ? (
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : avatar ? (
                      <img
                        src={avatar}
                        alt="Profile Avatar"
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                      />
                    ) : (
                      /* Default Green worm character */
                      <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    )}
                    {/* Edit overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full flex items-center justify-center transition-all duration-200">
                      <div className="w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </div>
                  </label>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      Your wallet
                    </div>
                    <div className="text-sm text-gray-500 font-mono">
                      {isInitializing
                        ? 'Connecting...'
                        : address
                        ? `${address.slice(0, 6)}...${address.slice(-6)}`
                        : 'Not Connected'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  <ClipboardDocumentIcon className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Your wallet metrics section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Your wallet metrics
                </h3>
              </div>

              <div className="p-6 space-y-4">
                {/* Total sent */}
                <button
                  onClick={() => setActiveModal('totalSent')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <BanknotesIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      Total sent
                    </span>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </button>

                {/* Total transactions */}
                <button
                  onClick={() => setActiveModal('totalTransactions')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      Total transactions
                    </span>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </button>

                {/* Fees */}
                <button
                  onClick={() => setActiveModal('fees')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      Fees
                    </span>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Account settings section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Account settings
                </h3>
              </div>

              <div className="p-6 space-y-4">
                {/* Export Transactions */}
                <button
                  onClick={handleExportTransactions}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <BanknotesIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      Export Transactions
                    </span>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </button>

                {/* Security settings */}
                <button
                  onClick={() => toast.info('Security settings coming soon')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      Security settings
                    </span>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </button>

                {/* Help & support */}
                <button
                  onClick={() =>
                    toast.info('Reach out to @Kanas_01 on Telegram for support')
                  }
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      Help & support
                    </span>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Logout Button */}
            {/* <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-between py-4 px-6 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold rounded-xl transition-all duration-200 border border-red-200"
            >
              <span>Logout</span>
              <ChevronRightIcon className="w-5 h-5 text-red-600" />
            </button> */}
          </div>
        </main>

        <BottomNavigation />
      </div>

      {/* Wallet Metrics Modals */}
      {activeModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-lg border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeModal === 'totalSent' && 'Total sent'}
                {activeModal === 'totalTransactions' && 'Total transactions'}
                {activeModal === 'fees' && 'Fees'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            {activeModal === 'totalSent' && (
              <div className="space-y-4">
                {/* Tokens Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Tokens</h4>
                  {Object.entries(userStats.totalsByCurrency).length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(userStats.totalsByCurrency).map(
                        ([currency, amount]) => (
                          <div
                            key={currency}
                            className="bg-gray-100 rounded-full px-3 py-2 text-center"
                          >
                            <div className="text-xs font-medium text-gray-600">
                              {amount.toFixed(1)}
                              {currency}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📊</div>
                      <div className="text-sm">No transactions yet</div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Total Section */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total:
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {usdEstimate !== null
                      ? `$${usdEstimate.toFixed(4)} USD`
                      : '$0.0000 USD'}
                  </span>
                </div>
              </div>
            )}

            {activeModal === 'totalTransactions' && (
              <div className="space-y-4">
                {/* Total Count */}
                <div className="text-center py-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {userStats.totalTransactions}
                  </div>
                  <div className="text-sm text-green-500 mt-1">
                    Transactions
                  </div>
                </div>

                {/* Transaction Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Completed
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      {userStats.totalTransactions > 0
                        ? userStats.totalTransactions
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'fees' && (
              <div className="space-y-4">
                {/* Total Fees */}
                <div className="text-center py-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {usdFees !== null
                      ? `$${usdFees.toFixed(2)}`
                      : '$0.00'}
                  </div>
                  <div className="text-sm text-orange-500 mt-1">
                    Total fees paid
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Average fee percentage
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      {userStats.averageFeePercentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Fee per transaction
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {userStats.totalTransactions > 0 && usdFees !== null
                        ? `$${(usdFees / userStats.totalTransactions).toFixed(2)}`
                        : '$0.00'}
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-600 text-center">
                      Platform fee: 1.5% per transaction
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

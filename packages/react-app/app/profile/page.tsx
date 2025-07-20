'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import BottomNavigation from '@/components/BottomNavigation';
import { useUserRemittances, useRemittanceDetails, usePlatformStats } from '@/hooks/useContract';
import { Currency, CURRENCY_INFO, getTokenAddress } from '@/lib/contracts';
import { formatEther } from 'viem';

// Component to load individual remittance data
function RemittanceLoader({ remittanceId, onRemittanceReady }: { 
  remittanceId: bigint; 
  onRemittanceReady: (id: string, remittance: any) => void 
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

function StatsCalculator({ remittances, onStatsReady }: {
  remittances: Record<string, any>;
  onStatsReady: (stats: any) => void;
}) {
  // Memoize the stats calculation to prevent unnecessary recalculations
  const calculatedStats = useMemo(() => {
    const validRemittances = Object.values(remittances).filter(r => r && r.fromCurrency && r.toCurrency);
    
    console.log('🧮 Stats Calculator Debug:', {
      totalRemittances: Object.keys(remittances).length,
      validRemittances: validRemittances.length,
      remittances: validRemittances.map(r => ({
        id: r.id,
        fromCurrency: r.fromCurrency,
        toCurrency: r.toCurrency,
        amountSent: r.amountSent
      }))
    });

    if (validRemittances.length > 0) {
      // Calculate stats from all transactions
      const stats = {
        totalSent: validRemittances.reduce((sum, r) => sum + parseFloat(r.amountSent || '0'), 0),
        totalReceived: validRemittances.reduce((sum, r) => sum + parseFloat(r.amountReceived || '0'), 0),
        totalFees: validRemittances.reduce((sum, r) => sum + parseFloat(r.platformFee || '0'), 0),
        totalTransactions: validRemittances.length,
        corridors: validRemittances.map(r => `${r.fromCurrency}-${r.toCurrency}`),
      };

      // Calculate favorite corridors
      const corridorCounts = stats.corridors.reduce((acc: any, corridor: string) => {
        acc[corridor] = (acc[corridor] || 0) + 1;
        return acc;
      }, {});

      const favoriteCorridors = Object.entries(corridorCounts)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 3)
        .map(([corridor]) => corridor);

      const finalStats = {
        ...stats,
        favoriteCorridors,
        averageFeePercentage: stats.totalTransactions > 0 ? (stats.totalFees / stats.totalSent) * 100 : 0
      };

      console.log('✅ Final Stats Calculated:', finalStats);
      return finalStats;
    } else {
      // Empty state
      return {
        totalSent: 0,
        totalReceived: 0,
        totalFees: 0,
        totalTransactions: 0,
        corridors: [],
        favoriteCorridors: [],
        averageFeePercentage: 0
      };
    }
  }, [remittances]);

  // Only call onStatsReady when stats actually change
  useEffect(() => {
    onStatsReady(calculatedStats);
  }, [calculatedStats, onStatsReady]);

  return null;
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [userStats, setUserStats] = useState({
    totalSent: 0,
    totalReceived: 0,
    totalFees: 0,
    totalTransactions: 0,
    favoriteCorridors: [] as string[],
    averageFeePercentage: 0
  });
  
  // State to store loaded remittances
  const [loadedRemittances, setLoadedRemittances] = useState<Record<string, any>>({});
  
  // Get user's remittance IDs
  const { remittanceIds, isLoading: isLoadingIds } = useUserRemittances(address);
  
  // Memoize the initial remittances object to prevent recreation on every render
  const initialRemittances = useMemo(() => {
    return remittanceIds.filter(id => id && typeof id === 'bigint').reduce((acc, id) => {
      acc[id.toString()] = null; // Initialize with null, will be populated by RemittanceLoader
      return acc;
    }, {} as Record<string, any>);
  }, [remittanceIds]);
  
  // Get cUSD balance (primary balance to show)
  const { data: cUsdBalance } = useBalance({
    address,
    token: address ? getTokenAddress(44787, 'cUSD') as `0x${string}` : undefined,
  });

  // Handle remittance loading
  const handleRemittanceReady = useCallback((id: string, remittance: any) => {
    setLoadedRemittances(prev => {
      // Only update if the data actually changed
      if (prev[id] !== remittance) {
        return {
          ...prev,
          [id]: remittance
        };
      }
      return prev;
    });
  }, []);

  // Handle stats aggregation
  const handleStatsReady = useCallback((stats: any) => {
    setUserStats(stats);
  }, []);

  // Get currency flag
  const getCurrencyFlag = (currency: string) => {
    return CURRENCY_INFO[currency as Currency]?.flag || '🌍';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatFee = (amount: number) => {
    if (amount < 0.01 && amount > 0) {
      // For very small amounts, show in cents or with more decimal places
      if (amount < 0.001) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        }).format(amount);
      } else {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }).format(amount);
      }
    }
    return formatCurrency(amount);
  };

  return (
    <>
      {/* Load individual remittances */}
      {remittanceIds.filter(id => id && typeof id === 'bigint').map((remittanceId) => (
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
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20">
      {/* Header */}
      <header className="px-6 py-6 bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">FX</span>
            </div>
            <span className="text-2xl font-bold text-white">FXRemit</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-slate-300">Connected</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Profile</h1>

          {/* Wallet Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">Wallet</div>
                  <div className="text-sm text-slate-300 font-mono">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}</div>
                </div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                Copy
              </button>
            </div>
            <div className="border-t border-white/20 pt-6">
              <div className="text-sm text-slate-300 mb-2">Balance</div>
              <div className="text-3xl font-bold text-white">{cUsdBalance ? formatCurrency(parseFloat(formatEther(cUsdBalance.value))) : 'Loading...'}</div>
              <div className="text-sm text-blue-400 font-semibold">cUSD</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-slate-300 mb-2">Total Sent</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(userStats.totalSent)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-slate-300 mb-2">Transactions</div>
              <div className="text-2xl font-bold text-white">{userStats.totalTransactions}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-slate-300 mb-2">Total Fees</div>
              <div className="text-2xl font-bold text-white">{formatFee(userStats.totalFees)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-slate-300 mb-2">Avg. Fee</div>
              <div className="text-2xl font-bold text-white">{userStats.averageFeePercentage.toFixed(1)}%</div>
            </div>
          </div>

          {/* Favorite Corridors */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Favorite Corridors</h3>
            <div className="space-y-3">
              {userStats.favoriteCorridors.map((corridor, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                  <span className="text-sm text-slate-300">{corridor}</span>
                  <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">Most used</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-300">Export Transactions</span>
                </div>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                  Export
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-300">Security</span>
                </div>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                  Manage
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-300">Help & Support</span>
                </div>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                  Contact
                </button>
              </div>
            </div>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={() => {}} // No direct disconnect from wagmi, but this button is kept for consistency
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Disconnect Wallet
          </button>
        </div>
      </main>

      <BottomNavigation />
    </div>
    </>
  );
} 
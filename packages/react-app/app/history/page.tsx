'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import BottomNavigation from '@/components/BottomNavigation';
import { useUserRemittances, useRemittanceDetails } from '@/hooks/useContract';
import { Currency, CURRENCY_INFO } from '@/lib/contracts';

interface Transaction {
  id: string;
  from: Currency;
  to: Currency;
  amount: number;
  received: number;
  fee: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  time: string;
  hash: string;
  recipient: string;
}

// Separate component to handle individual remittance details
function RemittanceItem({ remittanceId, onTransactionReady }: { 
  remittanceId: bigint; 
  onTransactionReady: (id: string, transaction: Transaction | null) => void 
}) {
  const { remittance, isLoading } = useRemittanceDetails(remittanceId);
  const id = remittanceId.toString();
  const processedRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Create a stable key for this remittance data
    const dataKey = remittance ? `${remittance.id}-${remittance.fromCurrency}-${remittance.toCurrency}` : null;
    
    // Only process if we haven't processed this exact data before
    if (remittance && remittance.fromCurrency && remittance.toCurrency && processedRef.current !== dataKey) {
      console.log('💰 Fee debugging:', {
        platformFee: remittance.platformFee,
        parsedFee: parseFloat(remittance.platformFee),
        allAmounts: {
          amountSent: remittance.amountSent,
          amountReceived: remittance.amountReceived,
          exchangeRate: remittance.exchangeRate,
          platformFee: remittance.platformFee
        }
      });
      
      const tx: Transaction = {
        id: remittance.id ? remittance.id.toString() : id,
        from: remittance.fromCurrency as Currency,
        to: remittance.toCurrency as Currency,
        amount: parseFloat(remittance.amountSent),
        received: parseFloat(remittance.amountReceived),
        fee: parseFloat(remittance.platformFee),
        status: 'completed',
        date: remittance.timestamp.toLocaleDateString(),
        time: remittance.timestamp.toLocaleTimeString(),
        hash: remittance.mentoTxHash,
        recipient: remittance.recipient,
      };
      processedRef.current = dataKey;
      onTransactionReady(id, tx);
    } else if (!isLoading && !remittance && processedRef.current !== 'null') {
      processedRef.current = 'null';
      onTransactionReady(id, null);
    }
  }, [remittance?.id, remittance?.fromCurrency, remittance?.toCurrency, isLoading, id, onTransactionReady]);

  return null; // This component doesn't render anything
}

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isClientMounted, setIsClientMounted] = useState(false);
  
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const { remittanceIds, isLoading: isLoadingIds } = useUserRemittances(address);
  
  // Use a single stable callback that handles all transactions
  const handleTransactionReady = useCallback((id: string, transaction: Transaction | null) => {
    setTransactions(prev => {
      const filtered = prev.filter(t => t.id !== id);
      return transaction ? [...filtered, transaction] : filtered;
    });
  }, []);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(tx => tx.status === filter);
  }, [transactions, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCurrencyFlag = (currency: Currency) => {
    return CURRENCY_INFO[currency]?.flag || '🌍';
  };

  return (
    <>
      {/* Render RemittanceItem components to handle data loading */}
      {remittanceIds.filter(id => id && typeof id === 'bigint').map(id => (
        <RemittanceItem
          key={id.toString()}
          remittanceId={id}
          onTransactionReady={handleTransactionReady}
        />
      ))}
      
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
            {isConnected && isClientMounted ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-300">Connected</span>
              </>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Transaction History</h1>

          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white/10 backdrop-blur-sm text-slate-300 hover:text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                filter === 'completed'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white/10 backdrop-blur-sm text-slate-300 hover:text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                filter === 'pending'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white/10 backdrop-blur-sm text-slate-300 hover:text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              Pending
            </button>
          </div>

          {/* Transaction List */}
          <div className="space-y-4">
            {/* Loading State */}
            {isLoadingIds && (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-300 text-lg">Loading transactions...</p>
              </div>
            )}

            {/* Connected but no transactions */}
            {!isLoadingIds && isConnected && filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-300 text-xl font-semibold mb-2">No transactions found</p>
                <p className="text-slate-400 text-sm">Your transaction history will appear here after you send your first remittance</p>
              </div>
            )}

            {/* Not connected */}
            {!isLoadingIds && !isConnected && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-slate-300 text-xl font-semibold mb-2">Connect your wallet</p>
                <p className="text-slate-400 text-sm">Connect your wallet to view your transaction history</p>
              </div>
            )}

            {/* Actual transactions */}
            {!isLoadingIds && filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 shadow-lg">
                {/* Transaction Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-3xl">{getCurrencyFlag(transaction.from)}</span>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="text-3xl">{getCurrencyFlag(transaction.to)}</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">
                        {transaction.from} → {transaction.to}
                      </div>
                      <div className="text-sm text-slate-400">
                        {transaction.date} at {transaction.time}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(transaction.status)}`}>
                    {transaction.status.toUpperCase()}
                  </span>
                </div>

                {/* Transaction Amount Highlight */}
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 mb-4 border border-green-500/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-slate-300">You sent</div>
                      <div className="text-2xl font-bold text-white">{transaction.amount.toFixed(2)} {transaction.from}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-300">They received</div>
                      <div className="text-2xl font-bold text-green-400">{transaction.received.toFixed(3)} {transaction.to}</div>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Platform fee</span>
                    <span className="text-sm font-medium text-white">{transaction.fee.toFixed(4)} {transaction.from}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Recipient</span>
                    <span className="text-sm font-mono text-slate-300">
                      {transaction.recipient.slice(0, 6)}...{transaction.recipient.slice(-4)}
                    </span>
                  </div>
                </div>

                {/* Transaction Hash and Explorer Link */}
                <div className="pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="text-xs text-slate-500 mb-1">Transaction Hash</div>
                      <div className="text-xs font-mono text-slate-400 truncate">
                        {transaction.hash}
                      </div>
                    </div>
                    <button 
                      onClick={() => window.open(`https://celo-alfajores.blockscout.com/tx/${transaction.hash}`, '_blank')}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-300 text-sm font-medium border border-blue-500/30 hover:border-blue-500/50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-6m-7 1l8-8m0 0V8m0 0H8" />
                      </svg>
                      <span>View on Explorer</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>


        </div>
      </main>

      <BottomNavigation />
    </div>
    </>
  );
} 
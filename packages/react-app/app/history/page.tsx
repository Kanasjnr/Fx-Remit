'use client';

import { useState, useMemo, useEffect } from 'react';
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
  onTransactionReady: (transaction: Transaction | null) => void 
}) {
  const { remittance, isLoading } = useRemittanceDetails(remittanceId);
  
  useMemo(() => {
    if (remittance) {
      const tx: Transaction = {
        id: remittance.id.toString(),
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
      onTransactionReady(tx);
    } else {
      onTransactionReady(null);
    }
  }, [remittance, onTransactionReady]);
  
  return null; // This component doesn't render anything
}

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const { remittanceIds, isLoading: isLoadingIds } = useUserRemittances(address);
  
  const handleTransactionReady = (id: string) => (transaction: Transaction | null) => {
    setTransactions(prev => {
      const filtered = prev.filter(t => t.id !== id);
      return transaction ? [...filtered, transaction] : filtered;
    });
  };

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
      {remittanceIds.map(id => (
        <RemittanceItem
          key={id.toString()}
          remittanceId={id}
          onTransactionReady={handleTransactionReady(id.toString())}
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
            {isConnected ? (
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
              <div key={transaction.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                {/* Transaction Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getCurrencyFlag(transaction.from)}</span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="text-xl">{getCurrencyFlag(transaction.to)}</span>
                    <span className="text-sm font-medium text-slate-300">
                      {transaction.from} → {transaction.to}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>

                {/* Transaction Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Amount sent</span>
                    <span className="text-sm font-medium text-white">{transaction.amount.toFixed(2)} {transaction.from}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Amount received</span>
                    <span className="text-sm font-medium text-white">{transaction.received.toLocaleString()} {transaction.to}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Fee</span>
                    <span className="text-sm font-medium text-white">{transaction.fee.toFixed(2)} {transaction.from}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Date</span>
                    <span className="text-sm font-medium text-white">{transaction.date} at {transaction.time}</span>
                  </div>
                </div>

                {/* Transaction Hash */}
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Hash: {transaction.hash}</span>
                    <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      View Details
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
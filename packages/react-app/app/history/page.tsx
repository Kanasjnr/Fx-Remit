'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import BottomNavigation from '@/components/BottomNavigation';
import { useUserRemittances, useRemittanceDetails } from '@/hooks/useContract';
import type { Currency } from '@/lib/contracts';
import { CURRENCY_INFO } from '@/lib/contracts';
import { useFarcasterMiniApp } from '@/hooks/useFarcasterMiniApp';
import Link from 'next/link';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  WalletIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

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

function RemittanceItem({
  remittanceId,
  onTransactionReady,
}: {
  remittanceId: bigint;
  onTransactionReady: (id: string, transaction: Transaction | null) => void;
}) {
  const { remittance, isLoading } = useRemittanceDetails(remittanceId);
  const id = remittanceId.toString();
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    const dataKey = remittance
      ? `${remittance.id}-${remittance.fromCurrency}-${remittance.toCurrency}`
      : null;

    if (
      remittance &&
      remittance.fromCurrency &&
      remittance.toCurrency &&
      processedRef.current !== dataKey
    ) {
      const zeroHash = '0x' + '0'.repeat(64);
      const txHash =
        remittance.mentoTxHash && remittance.mentoTxHash !== zeroHash
          ? remittance.mentoTxHash
          : '';
      const tx: Transaction = {
        id: remittance.id ? remittance.id.toString() : id,
        from: remittance.fromCurrency as Currency,
        to: remittance.toCurrency as Currency,
        amount: Number.parseFloat(remittance.amountSent),
        received: Number.parseFloat(remittance.amountReceived),
        fee: Number.parseFloat(remittance.platformFee),
        status: 'completed',
        date: remittance.timestamp.toLocaleDateString(),
        time: remittance.timestamp.toLocaleTimeString(),
        hash: txHash,
        recipient: remittance.recipient,
      };

      processedRef.current = dataKey;
      onTransactionReady(id, tx);
    } else if (!isLoading && !remittance && processedRef.current !== 'null') {
      processedRef.current = 'null';
      onTransactionReady(id, null);
    }
  }, [remittanceId, isLoading, id, onTransactionReady, remittance]); // Updated dependency array

  return null;
}

export default function HistoryPage() {
  const { address } = useAccount();
  const { isMiniApp } = useFarcasterMiniApp();
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isWaitingForConnection, setIsWaitingForConnection] = useState(true);

  const { remittanceIds, isLoading: isLoadingIds } =
    useUserRemittances(address);

  useEffect(() => {
    if (address) {
      setIsWaitingForConnection(false);
    } else if (!isMiniApp) {
      setIsWaitingForConnection(false);
    }
    
  }, [address, isMiniApp]);

  const handleTransactionReady = useCallback(
    (id: string, transaction: Transaction | null) => {
    setTransactions((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        return transaction ? [...filtered, transaction] : filtered;
      });
    },
    []
  );

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((tx) => tx.status === filter);
  }, [transactions, filter]);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCurrencyFlag = (currency: Currency) => {
    return CURRENCY_INFO[currency]?.flag || '🌍';
  };

  const getCurrencySymbol = (currency: Currency) => {
    const symbols: Record<string, string> = {
      cUSD: '$',
      cEUR: '€',
      cGBP: '£',
      cCAD: 'C$',
      cAUD: 'A$',
      cCHF: 'CHF',
      cJPY: '¥',
      cREAL: 'R$',
      cCOP: 'COP$',
      cKES: 'KSh',
      cNGN: '₦',
      cZAR: 'R',
      cGHS: '₵',
      eXOF: 'XOF',
      PUSO: '₱',
    };
    return symbols[currency] || '';
  };

  return (
    <>
      {/* Render RemittanceItem components to handle data loading */}
      {remittanceIds
        .filter((id) => id && typeof id === 'bigint')
        .map((id) => (
          <RemittanceItem
            key={id.toString()}
            remittanceId={id}
            onTransactionReady={handleTransactionReady}
          />
        ))}

      <div className="min-h-screen bg-gray-50 pb-16">
        {/* Header */}
        <header className="px-4 py-4 bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-md mx-auto">
            <Link
              href="/send"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-900">History</h1>
              </Link>
          </div>
        </header>

            {/* Filter Tabs */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="max-w-md mx-auto flex space-x-6">
            {['All', 'Completed', 'Pending', 'Failed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab.toLowerCase())}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                  filter === tab.toLowerCase()
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
            </div>

        {/* Main Content */}
        <main className="px-4 py-4">
          <div className="max-w-md mx-auto">
            {/* Transaction List */}
            <div className="space-y-0">
              {/* Loading State - Show while waiting for connection OR loading data */}
              {(isWaitingForConnection || isLoadingIds) && (
                <div className="text-center py-16">
                  <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-gray-700 text-base md:text-lg font-medium">
                    {isWaitingForConnection
                      ? 'Connecting wallet...'
                      : 'Loading transactions...'}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {isWaitingForConnection
                      ? 'Please wait while we connect to your wallet'
                      : 'Fetching your transfer history'}
                  </p>
                </div>
              )}

              {/* No transactions - Only show if connected and no transactions */}
              {!isWaitingForConnection &&
                !isLoadingIds &&
                address &&
                filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-sm">
                    <DocumentTextIcon className="w-10 h-10 text-gray-400" />
                  </div>
                    <p className="text-gray-700 text-base md:text-xl font-semibold mb-1">
                      No transactions found
                    </p>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                      Your transaction history will appear here after you send
                      your first remittance
                  </p>
                </div>
              )}

              {/* Not connected - Only show in web mode (not Mini App) */}
              {!isWaitingForConnection &&
                !isLoadingIds &&
                !address &&
                !isMiniApp && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-sm">
                    <WalletIcon className="w-10 h-10 text-gray-400" />
                  </div>
                    <p className="text-gray-700 text-base md:text-xl font-semibold mb-1">
                      Connect your wallet
                    </p>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                      Connect your wallet to view your transaction history and
                      track your transfers
                  </p>
                </div>
              )}

              {/* Actual transactions - Only show when not loading */}
              {!isWaitingForConnection &&
                !isLoadingIds &&
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white border-b border-gray-200 py-4 px-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleTransactionClick(transaction)}
                  >
                      <div className="flex items-center justify-between">
                      {/* Left side - Currency flags and details */}
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                          <div className="text-2xl">
                            {getCurrencyFlag(transaction.from)}
                          </div>
                              <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                          <div className="text-2xl">
                            {getCurrencyFlag(transaction.to)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.from} - {transaction.to}
                        </div>
                          <div className="text-xs text-gray-500">
                            {transaction.date} at {transaction.time}
                          </div>
                          {/* Status indicator */}
                          <div className="flex items-center space-x-1 mt-1">
                            {transaction.status === 'completed' && (
                              <>
                                <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                                  <CheckCircleIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs text-green-600 font-medium">
                                  Completed
                                </span>
                              </>
                            )}
                            {transaction.status === 'failed' && (
                              <>
                                <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
                                  <XCircleIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs text-red-600 font-medium">
                                  Failed
                                </span>
                              </>
                            )}
                            {transaction.status === 'pending' && (
                              <>
                                <div className="w-4 h-4 bg-yellow-500 rounded flex items-center justify-center">
                                  <ClockIcon className="w-3 h-3 text-white" />
                        </div>
                                <span className="text-xs text-yellow-600 font-medium">
                                  Pending
                                </span>
                              </>
                            )}
                        </div>
                      </div>
                    </div>

                      {/* Right side - Amounts */}
                      <div className="text-right">
                        <div className="text-sm text-blue-600 font-medium">
                          You sent{' '}
                          <span className="font-bold text-black">
                            {getCurrencySymbol(transaction.from)}
                            {transaction.amount?.toFixed(2) || '0.00'}
                            {transaction.from}
                          </span>
                        </div>
                        <div className="text-sm text-blue-600 font-medium">
                          They receive{' '}
                          <span className="font-bold text-black">
                            {getCurrencySymbol(transaction.to)}
                            {transaction.received?.toFixed(2) || '0.00'}
                            {transaction.to}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </main>

        {/* More Details Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-lg border border-gray-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  More Details
                </h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column - Values */}
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-900">
                    ${selectedTransaction.fee.toFixed(4)}
                    {selectedTransaction.from}
                  </div>
                  <div className="text-sm font-mono text-gray-700">
                    {selectedTransaction.recipient.slice(0, 6)}...
                    {selectedTransaction.recipient.slice(-4)}
                  </div>
                  <div className="text-sm font-mono text-gray-700">
                    {selectedTransaction.id.slice(0, 2)}...
                  </div>
                  <div className="text-sm font-medium text-blue-600">CELO</div>
                </div>

                {/* Right Column - Labels */}
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">
                    Platform fee (1.5%)
                  </div>
                  <div className="text-sm text-gray-500">Recipient</div>
                  <div className="text-sm text-gray-500">Transaction ID</div>
                  <div className="text-sm text-gray-500">Network</div>
                </div>
              </div>

              {/* Etherscan Link */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <a
                  href={`https://celoscan.io/tx/${
                    selectedTransaction.hash || selectedTransaction.id
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  View on etherscan →
                </a>
              </div>
            </div>
          </div>
        )}

        <BottomNavigation />
      </div>
    </>
  );
}

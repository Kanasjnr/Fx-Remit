'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import BottomNavigation from '@/components/BottomNavigation';
import { useUserRemittances, useRemittanceDetails } from '@/hooks/useContract';
import type { Currency } from '@/lib/contracts';
import { CURRENCY_INFO } from '@/lib/contracts';
import { CURRENCIES } from '@/lib/currencies';
import { useFarcasterMiniApp } from '@/hooks/useFarcasterMiniApp';
import Image from 'next/image';
import { getFailedTransactions } from '@/providers/TransactionStatusProvider';
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
  errorReason?: string;
}

function RemittanceItem({
  remittanceId,
  version,
  contractAddress,
  onTransactionReady,
}: {
  remittanceId: bigint;
  version: 'v1' | 'v2';
  contractAddress?: string | null;
  onTransactionReady: (id: string, transaction: Transaction | null) => void;
}) {
  const { remittance, isLoading } = useRemittanceDetails(remittanceId, version, contractAddress || undefined);
  const id = remittanceId.toString();
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!remittance || !remittance.fromCurrency || !remittance.toCurrency) {
      if (!isLoading && !remittance && processedRef.current !== 'null') {
        processedRef.current = 'null';
        onTransactionReady(id, null);
      }
      return;
    }

    const zeroHash = '0x' + '0'.repeat(64);
    const txHash =
      remittance.mentoTxHash && remittance.mentoTxHash !== zeroHash
        ? remittance.mentoTxHash
        : '';
    
    const amountSent = Number.parseFloat(remittance.amountSent);
    const amountReceived = Number.parseFloat(remittance.amountReceived);
    const platformFee = Number.parseFloat(remittance.platformFee);
    
    if (isNaN(amountSent) || isNaN(amountReceived) || isNaN(platformFee)) {
      console.warn('[History] Invalid amounts, skipping transaction:', {
        amountSent: remittance.amountSent,
        amountReceived: remittance.amountReceived,
        platformFee: remittance.platformFee,
      });
      return;
    }
    
    const dataKey = `${remittance.id}-${remittance.fromCurrency}-${remittance.toCurrency}-${amountSent}-${amountReceived}-${txHash}`;
    
    
    
    const tx: Transaction = {
      id: remittance.id ? remittance.id.toString() : id,
      from: remittance.fromCurrency as Currency,
      to: remittance.toCurrency as Currency,
      amount: amountSent,
      received: amountReceived,
      fee: platformFee,
      status: 'completed',
      date: remittance.timestamp.toLocaleDateString(),
      time: remittance.timestamp.toLocaleTimeString(),
      hash: txHash,
      recipient: remittance.recipient,
    };
    
    

    if (processedRef.current !== dataKey) {
      processedRef.current = dataKey;
      onTransactionReady(id, tx);
    }
  }, [remittanceId, isLoading, id, onTransactionReady, remittance]);

  return null;
}

export default function HistoryPage() {
  const { address, isConnected, status } = useAccount();
  const { isMiniApp } = useFarcasterMiniApp();
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [failedTransactions, setFailedTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const isConnecting = status === 'connecting';
  const isAddressReady = isConnected && !!address;
  
  
  const [isWaitingForConnection, setIsWaitingForConnection] = useState(
    isConnecting && !isAddressReady
  );

  const { remittanceIds, isLoading: isLoadingIds } =
    useUserRemittances(isAddressReady ? address : undefined);

  const totalExpectedTransactions = useMemo(() => {
    return remittanceIds
      .filter((item) => item && item.id && typeof item.id === 'bigint').length;
  }, [remittanceIds]);

  useEffect(() => {
    if (isAddressReady && address) {
      setIsWaitingForConnection(false);
      const failed = getFailedTransactions(address);
      const failedAsTransactions: Transaction[] = failed.map(failedTx => ({
        id: failedTx.id,
        from: failedTx.fromCurrency as Currency,
        to: failedTx.toCurrency as Currency,
        amount: parseFloat(failedTx.amount),
        received: 0,
        fee: 0,
        status: 'failed' as const,
        date: new Date(failedTx.timestamp).toLocaleDateString(),
        time: new Date(failedTx.timestamp).toLocaleTimeString(),
        hash: '',
        recipient: failedTx.recipient,
        errorReason: failedTx.errorReason,
      }));
      setFailedTransactions(failedAsTransactions);
    } else {
 
      setIsWaitingForConnection(isConnecting && !isAddressReady);
      if (!isConnecting) {
        setFailedTransactions([]);
      }
    }
  }, [isAddressReady, address, isConnecting, isMiniApp]);

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
    const allTransactions = [...transactions, ...failedTransactions];
    
    const sortedTransactions = allTransactions.sort((a, b) => {
      const parseDateTime = (date: string, time: string) => {
        try {
          const [day, month, year] = date.split('/');
          const fullDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}`;
          return new Date(fullDateStr).getTime();
        } catch {
          return new Date(`${date} ${time}`).getTime();
        }
      };
      
      const dateA = parseDateTime(a.date, a.time);
      const dateB = parseDateTime(b.date, b.time);
      return dateB - dateA;
    });

    if (filter === 'all') return sortedTransactions;
    return sortedTransactions.filter((tx) => tx.status === filter);
  }, [transactions, failedTransactions, filter]);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const hasTransactionsInFlight =
    isAddressReady &&
    totalExpectedTransactions > 0 &&
    transactions.length < totalExpectedTransactions;
  const isHydrating =
    isWaitingForConnection || isLoadingIds || hasTransactionsInFlight;
  const showNoTransactionsState =
    !isHydrating && isAddressReady && filteredTransactions.length === 0;
  const showConnectWalletState =
    !isHydrating && !isAddressReady && !isMiniApp;

  const getCurrencyFlag = (currency: Currency) => {
    const currencyOption = CURRENCIES.find(c => c.code === currency);
    return currencyOption?.countryFlag || '/US.svg';
  };

  const getCurrencySymbol = (currency: Currency) => {
    const symbols: Record<string, string> = {
      cUSD: '$', cEUR: '€', cGBP: '£', cCAD: 'C$', cAUD: 'A$',
      cCHF: 'CHF', cJPY: '¥', cREAL: 'R$', cCOP: 'COP$',
      cKES: 'KSh', cNGN: '₦', cZAR: 'R', cGHS: '₵',
      eXOF: 'XOF', PUSO: '₱', USDT: 'USD₮', USDC: 'USDC', CELO: 'CELO',
    };
    return symbols[currency] || '';
  };

  return (
    <>
      {remittanceIds
        .filter((item) => item && item.id && typeof item.id === 'bigint')
        .map((item) => (
          <RemittanceItem
            key={`${item.version}-${item.id.toString()}`}
            remittanceId={item.id}
            version={item.version}
            contractAddress={item.contract}
            onTransactionReady={handleTransactionReady}
          />
        ))}

      <div className="min-h-screen bg-gray-50 pb-16">
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

        <main className="px-4 py-4">
          <div className="max-w-md mx-auto">
            <div className="space-y-0">
              {isHydrating && (
                <div className="text-center py-16">
                  <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-gray-700 text-base md:text-lg font-medium">
                    Fetching your transaction history...
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Hang tight while we load your transfers.
                  </p>
                </div>
              )}

              {showNoTransactionsState && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-sm">
                    <DocumentTextIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-base md:text-xl font-semibold mb-1">
                    No transactions found
                  </p>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Your transaction history will appear here after you send your first remittance
                  </p>
                </div>
              )}

              {showConnectWalletState && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-sm">
                    <WalletIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-base md:text-xl font-semibold mb-1">
                    Connect your wallet
                  </p>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Connect your wallet to view your transaction history and track your transfers
                  </p>
                </div>
              )}

              {!isHydrating && isAddressReady && filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white border-b border-gray-200 py-4 px-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 relative">
                            <Image
                              src={getCurrencyFlag(transaction.from)}
                              alt={`${transaction.from} flag`}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                          <div className="w-6 h-6 relative">
                            <Image
                              src={getCurrencyFlag(transaction.to)}
                              alt={`${transaction.to} flag`}
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.from} - {transaction.to}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.date} at {transaction.time}
                          </div>
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
                                <span className="text-xs text-yellow-600 font-medium">Pending</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-blue-600 font-medium">
                          You sent{' '}
                          <span className="font-bold text-black">
                            {getCurrencySymbol(transaction.from)}
                            {transaction.amount?.toFixed(2) || '0.00'}
                            {transaction.from}
                          </span>
                        </div>
                        {transaction.status === 'failed' ? (
                          <div className="text-sm text-red-600 font-medium">
                            Transaction failed
                          </div>
                        ) : (
                          <div className="text-sm text-blue-600 font-medium">
                            They received{' '}
                            <span className="font-bold text-black">
                              {getCurrencySymbol(transaction.to)}
                              {transaction.received?.toFixed(2) || '0.00'}
                              {transaction.to}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </main>

        {selectedTransaction && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">More Details</h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Platform fee (1.5%)</div>
                  <div className="text-sm font-medium text-gray-900">
                    {getCurrencySymbol(selectedTransaction.to)}
                    {selectedTransaction.fee.toFixed(2)} {selectedTransaction.to}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Recipient</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono text-gray-700">
                      {selectedTransaction.recipient.slice(0, 6)}...
                      {selectedTransaction.recipient.slice(-4)}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTransaction.recipient);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy recipient address"
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Transaction ID</div>
                  <div className="text-sm font-mono text-gray-700">
                    #{selectedTransaction.id}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Network</div>
                  <div className="text-sm font-medium text-blue-600">CELO</div>
                </div>

                {selectedTransaction.status === 'failed' && selectedTransaction.errorReason && (
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">Error Reason</div>
                    <div className="text-sm text-red-600 font-medium">
                      {selectedTransaction.errorReason}
                    </div>
                  </div>
                )}
              </div>

              {selectedTransaction.status !== 'failed' && selectedTransaction.hash && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <a
                    href={`https://celoscan.io/tx/${selectedTransaction.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    <span>View on Celoscan</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <BottomNavigation />
      </div>
    </>
  );
}

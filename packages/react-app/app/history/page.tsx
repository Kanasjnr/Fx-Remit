"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import BottomNavigation from "@/components/BottomNavigation"
import { useUserRemittances, useRemittanceDetails } from "@/hooks/useContract"
import type { Currency } from "@/lib/contracts"
import { CURRENCY_INFO } from "@/lib/contracts"
import {
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  WalletIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline"

interface Transaction {
  id: string
  from: Currency
  to: Currency
  amount: number
  received: number
  fee: number
  status: "completed" | "pending" | "failed"
  date: string
  time: string
  hash: string
  recipient: string
}

// Separate component to handle individual remittance details
function RemittanceItem({
  remittanceId,
  onTransactionReady,
}: {
  remittanceId: bigint
  onTransactionReady: (id: string, transaction: Transaction | null) => void
}) {
  const { remittance, isLoading } = useRemittanceDetails(remittanceId)
  const id = remittanceId.toString()
  const processedRef = useRef<string | null>(null)

  useEffect(() => {
    const dataKey = remittance ? `${remittance.id}-${remittance.fromCurrency}-${remittance.toCurrency}` : null

    if (remittance && remittance.fromCurrency && remittance.toCurrency && processedRef.current !== dataKey) {
      const tx: Transaction = {
        id: remittance.id ? remittance.id.toString() : id,
        from: remittance.fromCurrency as Currency,
        to: remittance.toCurrency as Currency,
        amount: Number.parseFloat(remittance.amountSent),
        received: Number.parseFloat(remittance.amountReceived),
        fee: Number.parseFloat(remittance.platformFee),
        status: "completed",
        date: remittance.timestamp.toLocaleDateString(),
        time: remittance.timestamp.toLocaleTimeString(),
        hash: remittance.mentoTxHash,
        recipient: remittance.recipient,
      }

      processedRef.current = dataKey
      onTransactionReady(id, tx)
    } else if (!isLoading && !remittance && processedRef.current !== "null") {
      processedRef.current = "null"
      onTransactionReady(id, null)
    }
  }, [remittanceId, isLoading]) // Updated dependency array

  return null
}

export default function HistoryPage() {
  const { address, isConnected } = useAccount()
  const [filter, setFilter] = useState("all")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isClientMounted, setIsClientMounted] = useState(false)

  useEffect(() => {
    setIsClientMounted(true)
  }, [])

  const { remittanceIds, isLoading: isLoadingIds } = useUserRemittances(address)

  const handleTransactionReady = useCallback((id: string, transaction: Transaction | null) => {
    setTransactions((prev) => {
      const filtered = prev.filter((t) => t.id !== id)
      return transaction ? [...filtered, transaction] : filtered
    })
  }, [])

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions
    return transactions.filter((tx) => tx.status === filter)
  }, [transactions, filter])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
      case "pending":
        return <ClockIcon className="w-5 h-5 text-yellow-400" />
      case "failed":
        return <XCircleIcon className="w-5 h-5 text-red-400" />
      default:
        return <ClockIcon className="w-5 h-5 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20"
    }
  }

  const getCurrencyFlag = (currency: Currency) => {
    return CURRENCY_INFO[currency]?.flag || "🌍"
  }

  const getCurrencySymbol = (currency: Currency) => {
    const symbols: Record<string, string> = {
      cUSD: "$",
      cEUR: "€",
      cGBP: "£",
      cCAD: "C$",
      cAUD: "A$",
      cCHF: "CHF",
      cJPY: "¥",
      cREAL: "R$",
      cCOP: "COP$",
      cKES: "KSh",
      cNGN: "₦",
      cZAR: "R",
      cGHS: "₵",
      eXOF: "XOF",
      PUSO: "₱",
    }
    return symbols[currency] || ""
  }

  return (
    <>
      {/* Render RemittanceItem components to handle data loading */}
      {remittanceIds
        .filter((id) => id && typeof id === "bigint")
        .map((id) => (
          <RemittanceItem key={id.toString()} remittanceId={id} onTransactionReady={handleTransactionReady} />
        ))}

      <div className="min-h-screen bg-slate-900 pb-20">
        {/* Header */}
        <header className="px-4 sm:px-6 py-6 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">FX</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Transaction History</h1>
                <p className="text-sm text-slate-400">Track your transfers</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isConnected && isClientMounted ? (
                <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-emerald-400 font-medium">Connected</span>
                </div>
              ) : (
                <ConnectButton />
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === "all"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                    : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                }`}
              >
                All Transactions
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === "completed"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                    : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === "pending"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                    : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                }`}
              >
                Pending
              </button>
            </div>

            {/* Transaction List */}
            <div className="space-y-4">
              {/* Loading State */}
              {isLoadingIds && (
                <div className="text-center py-16">
                  <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-slate-300 text-lg font-medium">Loading transactions...</p>
                  <p className="text-slate-500 text-sm mt-2">Fetching your transfer history</p>
                </div>
              )}

              {/* Connected but no transactions */}
              {!isLoadingIds && isConnected && filteredTransactions.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700">
                    <DocumentTextIcon className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-300 text-xl font-semibold mb-2">No transactions found</p>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Your transaction history will appear here after you send your first remittance
                  </p>
                </div>
              )}

              {/* Not connected */}
              {!isLoadingIds && !isConnected && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700">
                    <WalletIcon className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-300 text-xl font-semibold mb-2">Connect your wallet</p>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Connect your wallet to view your transaction history and track your transfers
                  </p>
                </div>
              )}

              {/* Actual transactions */}
              {!isLoadingIds &&
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-slate-800 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all duration-200 overflow-hidden"
                  >
                    {/* Transaction Header */}
                    <div className="p-6 border-b border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{getCurrencyFlag(transaction.from)}</span>
                              <ArrowRightIcon className="w-4 h-4 text-slate-400" />
                              <span className="text-2xl">{getCurrencyFlag(transaction.to)}</span>
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
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(
                              transaction.status,
                            )}`}
                          >
                            {getStatusIcon(transaction.status)}
                            <span>{transaction.status.toUpperCase()}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Amount */}
                    <div className="p-6 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-b border-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="text-center sm:text-left">
                          <div className="text-sm text-slate-400 mb-1">You sent</div>
                          <div className="text-2xl font-bold text-white">
                            {getCurrencySymbol(transaction.from)}
                            {transaction.amount.toFixed(2)} {transaction.from}
                          </div>
                        </div>
                        <div className="text-center sm:text-right">
                          <div className="text-sm text-slate-400 mb-1">They received</div>
                          <div className="text-2xl font-bold text-emerald-400">
                            {getCurrencySymbol(transaction.to)}
                            {transaction.received.toFixed(3)} {transaction.to}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-400">Platform fee (1.5%)</span>
                            <span className="text-sm font-medium text-white">
                              {getCurrencySymbol(transaction.from)}
                              {transaction.fee.toFixed(4)} {transaction.from}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-400">Recipient</span>
                            <span className="text-sm font-mono text-slate-300">
                              {transaction.recipient.slice(0, 6)}...{transaction.recipient.slice(-4)}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-400">Transaction ID</span>
                            <span className="text-sm font-mono text-slate-300">{transaction.id.slice(0, 8)}...</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-400">Network</span>
                            <span className="text-sm font-medium text-emerald-400">Celo</span>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Hash and Explorer Link */}
                      <div className="pt-4 border-t border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-slate-500 mb-1">Transaction Hash</div>
                            <div className="text-xs font-mono text-slate-400 truncate">{transaction.hash}</div>
                          </div>
                          <button
                            onClick={() =>
                              window.open(`https://celo-alfajores.blockscout.com/tx/${transaction.hash}`, "_blank")
                            }
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-lg transition-all duration-200 text-sm font-medium border border-emerald-500/20 hover:border-emerald-500/30"
                          >
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            <span>View on Explorer</span>
                          </button>
                        </div>
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
  )
}

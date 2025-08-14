"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import BottomNavigation from "@/components/BottomNavigation"
import { useUserRemittances, useRemittanceDetails } from "@/hooks/useContract"
import type { Currency } from "@/lib/contracts"
import { CURRENCY_INFO } from "@/lib/contracts"
import Link from "next/link"
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
  }, [remittanceId, isLoading, id, onTransactionReady, remittance]) // Updated dependency array

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
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case "pending":
        return <ClockIcon className="w-5 h-5 text-yellow-500" />
      case "failed":
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200"
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "failed":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
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

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <header className="px-4 py-6 bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">FX</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Transaction History</h1>
                  <p className="text-sm text-gray-500">Track your transfers</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              {isConnected && isClientMounted ? (
                <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700 font-medium">Connected</span>
                </div>
              ) : (
                <ConnectButton />
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 py-6">
          <div className="max-w-md mx-auto">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === "all"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === "completed"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === "pending"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-200"
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
                  <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-gray-700 text-lg font-medium">Loading transactions...</p>
                  <p className="text-gray-500 text-sm mt-2">Fetching your transfer history</p>
                </div>
              )}

              {/* Connected but no transactions */}
              {!isLoadingIds && isConnected && filteredTransactions.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-sm">
                    <DocumentTextIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-xl font-semibold mb-2">No transactions found</p>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Your transaction history will appear here after you send your first remittance
                  </p>
                </div>
              )}

              {/* Not connected */}
              {!isLoadingIds && !isConnected && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-sm">
                    <WalletIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-xl font-semibold mb-2">Connect your wallet</p>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Connect your wallet to view your transaction history and track your transfers
                  </p>
                </div>
              )}

              {/* Actual transactions */}
              {!isLoadingIds &&
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden shadow-sm"
                  >
                    {/* Transaction Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{getCurrencyFlag(transaction.from)}</span>
                              <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-2xl">{getCurrencyFlag(transaction.to)}</span>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-gray-900">
                                {transaction.from} → {transaction.to}
                              </div>
                              <div className="text-sm text-gray-500">
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
                    <div className="p-6 bg-blue-50 border-b border-gray-100">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">You sent</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {getCurrencySymbol(transaction.from)}
                            {transaction.amount.toFixed(2)} {transaction.from}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">They received</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {getCurrencySymbol(transaction.to)}
                            {transaction.received.toFixed(3)} {transaction.to}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="p-6">
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Platform fee (1.5%)</span>
                          <span className="text-sm font-medium text-gray-900">
                            {getCurrencySymbol(transaction.from)}
                            {transaction.fee.toFixed(4)} {transaction.from}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Recipient</span>
                          <span className="text-sm font-mono text-gray-700">
                            {transaction.recipient.slice(0, 6)}...{transaction.recipient.slice(-4)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Transaction ID</span>
                          <span className="text-sm font-mono text-gray-700">{transaction.id.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Network</span>
                          <span className="text-sm font-medium text-blue-600">Celo</span>
                        </div>
                      </div>

                      {/* Transaction Hash and Explorer Link */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex flex-col gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500 mb-1">Transaction Hash</div>
                            <div className="text-xs font-mono text-gray-600 truncate">{transaction.hash}</div>
                          </div>
                          <button
                            onClick={() =>
                              window.open(`https://celo-alfajores.blockscout.com/tx/${transaction.hash}`, "_blank")
                            }
                            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg transition-all duration-200 text-sm font-medium border border-blue-200 hover:border-blue-300"
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

"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useAccount, useDisconnect } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import BottomNavigation from "@/components/BottomNavigation"
import { useUserRemittances, useRemittanceDetails } from "@/hooks/useContract"
import type { Currency } from "@/lib/contracts"
import { CURRENCY_INFO, getTokenAddress } from "@/lib/contracts"
import { formatEther, parseEther } from "viem"
import Link from "next/link"
import {
  UserIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChartBarIcon,
  GlobeAltIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline"
import { toast } from "react-toastify"
import { Mento } from "@mento-protocol/mento-sdk"
import { providers } from "ethers"

// Component to load individual remittance data
function RemittanceLoader({
  remittanceId,
  onRemittanceReady,
}: {
  remittanceId: bigint
  onRemittanceReady: (id: string, remittance: any) => void
}) {
  const { remittance, isLoading } = useRemittanceDetails(remittanceId)
  const id = remittanceId.toString()
  const [hasNotified, setHasNotified] = useState(false)

  useEffect(() => {
    if (!hasNotified) {
      if (remittance && remittance.fromCurrency && remittance.toCurrency) {
        onRemittanceReady(id, remittance)
        setHasNotified(true)
      } else if (!isLoading && !remittance) {
        onRemittanceReady(id, null)
        setHasNotified(true)
      }
    }
  }, [remittance, isLoading, id, onRemittanceReady, hasNotified])

  return null
}

function StatsCalculator({
  remittances,
  onStatsReady,
}: {
  remittances: Record<string, any>
  onStatsReady: (stats: any) => void
}) {
  const calculatedStats = useMemo(() => {
    const validRemittances = Object.values(remittances).filter((r) => r && r.fromCurrency && r.toCurrency)

    if (validRemittances.length > 0) {
      const stats = {
        totalSent: validRemittances.reduce((sum, r) => sum + Number.parseFloat(r.amountSent || "0"), 0),
        totalReceived: validRemittances.reduce((sum, r) => sum + Number.parseFloat(r.amountReceived || "0"), 0),
        totalFees: validRemittances.reduce((sum, r) => {
          const fee = r.platformFee || "0";
          if (typeof fee === "string" && fee.includes(".")) {
            return sum + Number(fee);
          } else {
            return sum + Number(formatEther(BigInt(fee)));
          }
        }, 0),
        totalTransactions: validRemittances.length,
        corridors: validRemittances.map((r) => `${r.fromCurrency}-${r.toCurrency}`),
        totalsByCurrency: validRemittances.reduce((acc: Record<string, number>, r: any) => {
          const cur = r.fromCurrency as string
          const amt = Number.parseFloat(r.amountSent || "0")
          acc[cur] = (acc[cur] || 0) + amt
          return acc
        }, {}),
      }

      const corridorCounts = stats.corridors.reduce((acc: any, corridor: string) => {
        acc[corridor] = (acc[corridor] || 0) + 1
        return acc
      }, {})

      const favoriteCorridors = Object.entries(corridorCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 3)
        .map(([corridor]) => corridor)

      return {
        ...stats,
        favoriteCorridors,
        averageFeePercentage: stats.totalTransactions > 0 ? (stats.totalFees / stats.totalSent) * 100 : 0,
      }
    } else {
      return {
        totalSent: 0,
        totalReceived: 0,
        totalFees: 0,
        totalTransactions: 0,
        corridors: [],
        favoriteCorridors: [],
        averageFeePercentage: 0,
        totalsByCurrency: {},
      }
    }
  }, [remittances])

  useEffect(() => {
    onStatsReady(calculatedStats)
  }, [calculatedStats, onStatsReady])

  return null
}

// Function to export transactions as CSV
const exportTransactionsToCSV = (transactions: any[], userAddress: string) => {
  if (!transactions || transactions.length === 0) {
    toast.error("No transactions to export")
    return
  }

  // Define CSV headers
  const headers = [
    "Transaction ID",
    "Date",
    "Time",
    "Sender",
    "Recipient", 
    "From Currency",
    "To Currency",
    "Amount Sent",
    "Amount Received",
    "Exchange Rate",
    "Platform Fee",
    "Corridor",
    "Mento Transaction Hash",
    "Blockchain Transaction Hash"
  ]

  // Convert transactions to CSV rows
  const csvRows = transactions.map((tx) => [
    tx.id || "N/A",
    tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : "N/A",
    tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : "N/A",
    tx.sender || "N/A",
    tx.recipient || "N/A",
    tx.fromCurrency || "N/A",
    tx.toCurrency || "N/A",
    tx.amountSent || "0",
    tx.amountReceived || "0",
    tx.exchangeRate || "1",
    tx.platformFee || "0",
    tx.corridor || "N/A",
    tx.mentoTxHash || "N/A",
    tx.blockchainTxHash || "N/A"
  ])

  // Combine headers and rows
  const csvContent = [headers, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  // Create and download the file with proper headers
  const blob = new Blob(['\ufeff' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = `fx-remit-transactions-${userAddress.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.csv`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  toast.success(`Exported ${transactions.length} transactions to CSV`)
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)
  const [userStats, setUserStats] = useState({
    totalSent: 0,
    totalReceived: 0,
    totalFees: 0,
    totalTransactions: 0,
    favoriteCorridors: [] as string[],
    averageFeePercentage: 0,
    totalsByCurrency: {} as Record<string, number>,
  })

  const [usdEstimate, setUsdEstimate] = useState<number | null>(null)
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)

  const [loadedRemittances, setLoadedRemittances] = useState<Record<string, any>>({})
  const { remittanceIds, isLoading: isLoadingIds } = useUserRemittances(address)

  // Removed primary balance (not needed)

  const handleRemittanceReady = useCallback((id: string, remittance: any) => {
    setLoadedRemittances((prev) => {
      if (prev[id] !== remittance) {
        return { ...prev, [id]: remittance }
      }
      return prev
    })
  }, [])

  const handleStatsReady = useCallback((stats: any) => {
    setUserStats(stats)
  }, [])

  // Compute USD estimate for Total Sent using current quotes (best-effort)
  useEffect(() => {
    async function computeUsd() {
      try {
        const totals = userStats.totalsByCurrency || {}
        const entries = Object.entries(totals)
        if (!entries.length) {
          setUsdEstimate(0)
          return
        }
        const provider = new providers.JsonRpcProvider('https://forno.celo.org')
        const mento = await Mento.create(provider)
        const chainId = 42220 as const
        const cUSD = getTokenAddress(chainId, 'cUSD' as Currency)
        let sumCusd = 0
        for (const [cur, amt] of entries) {
          const amount = Number(amt) || 0
          if (amount <= 0) continue
          if (cur === 'cUSD') {
            sumCusd += amount
            continue
          }
          const fromToken = getTokenAddress(chainId, cur as Currency)
          const out = await mento.getAmountOut(fromToken, cUSD, parseEther(String(amount)))
          sumCusd += Number(formatEther(BigInt(out.toString())))
        }
        setUsdEstimate(sumCusd)
      } catch (e) {
        // Non-fatal; hide estimate
        setUsdEstimate(null)
      }
    }
    computeUsd()
  }, [userStats.totalsByCurrency])

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address)
        setCopied(true)
        toast.success("Address copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        toast.error("Failed to copy address")
      }
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast.success("Wallet disconnected")
  }

  const handleExportTransactions = () => {
    if (!address) {
      toast.error("Please connect your wallet first")
      return
    }

    const validTransactions = Object.values(loadedRemittances).filter(
      (tx) => tx && tx.fromCurrency && tx.toCurrency
    )

    if (validTransactions.length === 0) {
      toast.error("No transactions found to export")
      return
    }

    // Sort transactions by timestamp (newest first)
    const sortedTransactions = validTransactions.sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return dateB - dateA
    })

    exportTransactionsToCSV(sortedTransactions, address)
  }

  const getCurrencyFlag = (currency: string) => {
    return CURRENCY_INFO[currency as Currency]?.flag || "🌍"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatFee = (amount: number) => {
    if (amount < 0.01 && amount > 0) {
      if (amount < 0.001) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        }).format(amount)
      } else {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }).format(amount)
      }
    }
    return formatCurrency(amount)
  }

  return (
    <>
      {/* Load individual remittances */}
      {remittanceIds
        .filter((id) => id && typeof id === "bigint")
        .map((remittanceId) => (
          <RemittanceLoader
            key={remittanceId.toString()}
            remittanceId={remittanceId}
            onRemittanceReady={handleRemittanceReady}
          />
        ))}

      {/* Only calculate stats when loading is done */}
      {!isLoadingIds && <StatsCalculator remittances={loadedRemittances} onStatsReady={handleStatsReady} />}

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
                  <h1 className="text-xl font-bold text-gray-900">Profile</h1>
                  <p className="text-sm text-gray-500">Manage your account</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              {isConnected ? (
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
          <div className="max-w-md mx-auto space-y-6">
            {/* Wallet Info Card (simplified) */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">Your Wallet</div>
                    <div className="text-sm text-gray-500 font-mono">
                      {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Not Connected"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg transition-all duration-200 text-sm font-medium border border-blue-200"
                >
                  {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <BanknotesIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-sm text-gray-500">Total Sent</div>
                </div>
              {/* USD estimate headline */}
              <div className="text-2xl font-bold text-gray-900">
                {usdEstimate !== null ? `≈ $${usdEstimate.toFixed(2)}` : '—'}
              </div>
              {/* Top chips and +X more */}
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries((userStats as any).totalsByCurrency || {})
                  .sort((a: any, b: any) => Number(b[1]) - Number(a[1]))
                  .slice(0, 2)
                  .map(([cur, amt]) => (
                    <span key={cur} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700">
                      {(Number(amt) || 0).toFixed(2)} {cur}
                    </span>
                  ))}
                {Object.keys((userStats as any).totalsByCurrency || {}).length > 2 && (
                  <button onClick={() => setIsBreakdownOpen(true)} className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full">
                    +{Object.keys((userStats as any).totalsByCurrency || {}).length - 2} more
                  </button>
                )}
              </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-sm text-gray-500">Transactions</div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{userStats.totalTransactions}</div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="text-sm text-gray-500">Total Fees</div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatFee(userStats.totalFees)}</div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <GlobeAltIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-sm text-gray-500">Avg. Fee</div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{userStats.averageFeePercentage.toFixed(1)}%</div>
              </div>
            </div>

            {/* Favorite Corridors */}
            {userStats.favoriteCorridors.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <GlobeAltIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Most Used Corridors</h3>
                </div>
                <div className="space-y-4">
                  {userStats.favoriteCorridors.map((corridor, index) => {
                    const [from, to] = corridor.split("-")
                    return (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getCurrencyFlag(from)}</span>
                            <ArrowRightOnRectangleIcon className="w-4 h-4 text-gray-400 rotate-180" />
                            <span className="text-lg">{getCurrencyFlag(to)}</span>
                          </div>
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {from} → {to}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
                <p className="text-sm text-gray-500 mt-1">Manage your account preferences and security</p>
              </div>

              <div className="p-6 space-y-4">
                <button 
                  onClick={handleExportTransactions}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <DocumentArrowDownIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Export Transactions</div>
                      <div className="text-xs text-gray-500">
                        {userStats.totalTransactions > 0 
                          ? `Download ${userStats.totalTransactions} transactions as CSV`
                          : "No transactions to export"
                        }
                      </div>
                    </div>
                  </div>
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Security Settings</div>
                      <div className="text-xs text-gray-500">Manage your security preferences</div>
                    </div>
                  </div>
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <QuestionMarkCircleIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Help & Support</div>
                      <div className="text-xs text-gray-500">Get help or contact support</div>
                    </div>
                  </div>
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Disconnect Button */}
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center space-x-3 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-semibold py-4 px-8 rounded-xl transition-all duration-200 border border-red-200"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </main>

        {/* Breakdown Modal */}
        {isBreakdownOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30" onClick={() => setIsBreakdownOpen(false)}>
            <div className="w-full md:w-[420px] bg-white rounded-t-2xl md:rounded-2xl p-4 border border-gray-200 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Total Sent Breakdown</h4>
                <button className="text-sm text-gray-500" onClick={() => setIsBreakdownOpen(false)}>Close</button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {Object.entries((userStats as any).totalsByCurrency || {})
                  .sort((a: any, b: any) => Number(b[1]) - Number(a[1]))
                  .map(([cur, amt]) => (
                    <div key={cur} className="flex items-center justify-between px-2 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-600">{cur}</span>
                      <span className="text-sm font-semibold text-gray-900">{(Number(amt) || 0).toFixed(2)} {cur}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <BottomNavigation />
      </div>
    </>
  )
}

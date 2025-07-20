"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useAccount, useBalance, useDisconnect } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import BottomNavigation from "@/components/BottomNavigation"
import { useUserRemittances, useRemittanceDetails } from "@/hooks/useContract"
import type { Currency } from "@/lib/contracts"
import { CURRENCY_INFO, getTokenAddress } from "@/lib/contracts"
import { formatEther } from "viem"
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
      }
    }
  }, [remittances])

  useEffect(() => {
    onStatsReady(calculatedStats)
  }, [calculatedStats, onStatsReady])

  return null
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
  })

  const [loadedRemittances, setLoadedRemittances] = useState<Record<string, any>>({})
  const { remittanceIds, isLoading: isLoadingIds } = useUserRemittances(address)

  const { data: cUsdBalance } = useBalance({
    address,
    token: address ? (getTokenAddress(44787, "cUSD") as `0x${string}`) : undefined,
  })

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

      <div className="min-h-screen bg-slate-900 pb-20">
        {/* Header */}
        <header className="px-4 sm:px-6 py-6 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">FX</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Profile</h1>
                <p className="text-sm text-slate-400">Manage your account</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isConnected ? (
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
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Wallet Info Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">Your Wallet</div>
                    <div className="text-sm text-slate-400 font-mono">
                      {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Not Connected"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-lg transition-all duration-200 text-sm font-medium border border-emerald-500/20"
                >
                  {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-slate-400 mb-2">Primary Balance</div>
                    <div className="text-3xl font-bold text-white">
                      {cUsdBalance ? formatCurrency(Number.parseFloat(formatEther(cUsdBalance.value))) : "Loading..."}
                    </div>
                    <div className="text-sm text-emerald-400 font-semibold">cUSD</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-2">Network</div>
                    <div className="text-lg font-semibold text-white">Celo Alfajores</div>
                    <div className="text-sm text-slate-400">Testnet</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <BanknotesIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-sm text-slate-400">Total Sent</div>
                </div>
                <div className="text-2xl font-bold text-white">{formatCurrency(userStats.totalSent)}</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-sm text-slate-400">Transactions</div>
                </div>
                <div className="text-2xl font-bold text-white">{userStats.totalTransactions}</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-sm text-slate-400">Total Fees</div>
                </div>
                <div className="text-2xl font-bold text-white">{formatFee(userStats.totalFees)}</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <GlobeAltIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-sm text-slate-400">Avg. Fee</div>
                </div>
                <div className="text-2xl font-bold text-white">{userStats.averageFeePercentage.toFixed(1)}%</div>
              </div>
            </div>

            {/* Favorite Corridors */}
            {userStats.favoriteCorridors.length > 0 && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <GlobeAltIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Most Used Corridors</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {userStats.favoriteCorridors.map((corridor, index) => {
                    const [from, to] = corridor.split("-")
                    return (
                      <div key={index} className="bg-slate-700 rounded-xl p-4 border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getCurrencyFlag(from)}</span>
                            <ArrowRightOnRectangleIcon className="w-4 h-4 text-slate-400 rotate-180" />
                            <span className="text-lg">{getCurrencyFlag(to)}</span>
                          </div>
                          <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-white">
                          {from} → {to}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white">Account Settings</h3>
                <p className="text-sm text-slate-400 mt-1">Manage your account preferences and security</p>
              </div>

              <div className="p-6 space-y-4">
                <button className="w-full flex items-center justify-between p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors duration-200 border border-slate-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <DocumentArrowDownIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Export Transactions</div>
                      <div className="text-xs text-slate-400">Download your transaction history</div>
                    </div>
                  </div>
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-slate-400" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors duration-200 border border-slate-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Security Settings</div>
                      <div className="text-xs text-slate-400">Manage your security preferences</div>
                    </div>
                  </div>
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-slate-400" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors duration-200 border border-slate-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <QuestionMarkCircleIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">Help & Support</div>
                      <div className="text-xs text-slate-400">Get help or contact support</div>
                    </div>
                  </div>
                  <ArrowRightOnRectangleIcon className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Disconnect Button */}
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center space-x-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold py-4 px-8 rounded-xl transition-all duration-200 border border-red-500/20 hover:border-red-500/30"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </main>

        <BottomNavigation />
      </div>
    </>
  )
}

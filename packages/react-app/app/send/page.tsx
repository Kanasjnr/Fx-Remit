"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import BottomNavigation from "@/components/BottomNavigation"
import { useTokenBalance, useQuote } from "@/hooks/useMento"
import { useEthersSwap } from "@/hooks/useEthersSwap"
import { useLogRemittance } from "@/hooks/useContract"
import type { Currency } from "@/lib/contracts"
import { toast } from "react-toastify"
import {
  ArrowsUpDownIcon,
  ArrowRightIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline"

export default function SendPage() {
  const { address, isConnected } = useAccount()
  const [fromCurrency, setFromCurrency] = useState<Currency>("cUSD")
  const [toCurrency, setToCurrency] = useState<Currency>("cNGN")
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const currencies: Array<{ code: Currency; name: string; flag: string; symbol: string }> = [
    { code: "cUSD", name: "US Dollar", flag: "🇺🇸", symbol: "$" },
    { code: "cEUR", name: "Euro", flag: "🇪🇺", symbol: "€" },
    { code: "cGBP", name: "British Pound", flag: "🇬🇧", symbol: "£" },
    { code: "cCAD", name: "Canadian Dollar", flag: "🇨🇦", symbol: "C$" },
    { code: "cAUD", name: "Australian Dollar", flag: "🇦🇺", symbol: "A$" },
    { code: "cCHF", name: "Swiss Franc", flag: "🇨🇭", symbol: "CHF" },
    { code: "cJPY", name: "Japanese Yen", flag: "🇯🇵", symbol: "¥" },
    { code: "cREAL", name: "Brazilian Real", flag: "🇧🇷", symbol: "R$" },
    { code: "cCOP", name: "Colombian Peso", flag: "🇨🇴", symbol: "COP$" },
    { code: "cKES", name: "Kenyan Shilling", flag: "🇰🇪", symbol: "KSh" },
    { code: "cNGN", name: "Nigerian Naira", flag: "🇳🇬", symbol: "₦" },
    { code: "cZAR", name: "South African Rand", flag: "🇿🇦", symbol: "R" },
    { code: "cGHS", name: "Ghanaian Cedi", flag: "🇬🇭", symbol: "₵" },
    { code: "eXOF", name: "CFA Franc", flag: "🌍", symbol: "XOF" },
    { code: "PUSO", name: "Philippine Peso", flag: "🇵🇭", symbol: "₱" },
  ]

  const { balance, isLoading: isLoadingBalance } = useTokenBalance(fromCurrency)
  const { quote, isLoading: isLoadingQuote } = useQuote(fromCurrency, toCurrency, amount)
  const { swap } = useEthersSwap()
  const { logRemittance, isPending: isLoggingRemittance } = useLogRemittance()

  const fromCurrencyInfo = currencies.find((c) => c.code === fromCurrency)
  const toCurrencyInfo = currencies.find((c) => c.code === toCurrency)

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const handleSend = async () => {
    if (!address || !amount || !recipient || !quote) {
      toast.error("Please fill in all fields")
      return
    }

    setIsProcessing(true)
    toast.dismiss()

    const loadingToast = toast.loading("Processing your remittance transaction...")

    try {
      console.log("🚀 Starting swap with new ethers.js implementation...")

      const swapResult = await swap(fromCurrency, toCurrency, amount, undefined, recipient)

      console.log("✅ Swap completed successfully:", swapResult)

      try {
        await logRemittance({
          recipient,
          fromCurrency,
          toCurrency,
          amountSent: amount,
          amountReceived: quote.amountOut,
          exchangeRate: quote.exchangeRate,
          platformFee: quote.platformFee,
          mentoTxHash: swapResult.hash,
          corridor: `${fromCurrency.replace("c", "")}-${toCurrency.replace("c", "")}`,
        })
        console.log("✅ logRemittance completed successfully!")
      } catch (logError) {
        console.error("❌ logRemittance failed:", logError)
      }

      toast.dismiss(loadingToast)
      const successMessage = swapResult.message || `🎉 Successfully sent ${amount} ${fromCurrency} to ${recipient}!`
      toast.success(successMessage)

      setAmount("")
      setRecipient("")
    } catch (error) {
      console.error("❌ Transaction failed:", error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : "Transaction failed")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <header className="px-4 sm:px-6 py-6 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">FX</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Send Money</h1>
              <p className="text-sm text-slate-400">Fast & secure transfers</p>
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
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Available Balance</p>
                  <p className="text-xs text-slate-500">{fromCurrencyInfo?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {isLoadingBalance ? (
                    <div className="animate-pulse bg-slate-700 h-8 w-20 rounded"></div>
                  ) : (
                    `${fromCurrencyInfo?.symbol}${balance.toFixed(2)}`
                  )}
                </div>
                <div className="text-sm text-emerald-400 font-medium">{fromCurrency}</div>
              </div>
            </div>
          </div>

          {/* Transfer Form */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-1">Transfer Details</h2>
              <p className="text-sm text-slate-400">Enter the transfer information below</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Currency Selection */}
              <div className="space-y-4">
                {/* From Currency */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">From</label>
                  <div className="relative">
                    <select
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value as Currency)}
                      className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white appearance-none cursor-pointer hover:bg-slate-600 transition-colors"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code} className="bg-slate-800">
                          {currency.flag} {currency.symbol} {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSwapCurrencies}
                    className="w-12 h-12 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <ArrowsUpDownIcon className="w-5 h-5 text-slate-300" />
                  </button>
                </div>

                {/* To Currency */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">To</label>
                  <div className="relative">
                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value as Currency)}
                      className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white appearance-none cursor-pointer hover:bg-slate-600 transition-colors"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code} className="bg-slate-800">
                          {currency.flag} {currency.symbol} {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Amount to Send</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white text-lg placeholder-slate-500 pr-16"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">
                    {fromCurrency}
                  </div>
                </div>
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Recipient Address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Exchange Rate Info */}
          {amount && quote && (
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Transfer Summary</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Exchange Rate</span>
                  <span className="text-white font-medium">
                    1 {fromCurrency} = {Number.parseFloat(quote.exchangeRate).toFixed(4)} {toCurrency}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-300">You send</span>
                  <span className="text-white font-medium">
                    {fromCurrencyInfo?.symbol}
                    {amount} {fromCurrency}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Platform fee (1.5%)</span>
                  <span className="text-white font-medium">
                    {fromCurrencyInfo?.symbol}
                    {Number.parseFloat(quote.platformFee) < 0.01 && Number.parseFloat(quote.platformFee) > 0
                      ? Number.parseFloat(quote.platformFee).toFixed(4)
                      : Number.parseFloat(quote.platformFee).toFixed(2)}{" "}
                    {fromCurrency}
                  </span>
                </div>

                <div className="border-t border-emerald-500/20 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Recipient gets</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {toCurrencyInfo?.symbol}
                      {Number.parseFloat(quote.amountOut).toFixed(2)} {toCurrency}
                    </span>
                  </div>
                </div>
              </div>

              
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!isConnected || !amount || !recipient || !quote || isProcessing || isLoggingRemittance}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-5 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 disabled:cursor-not-allowed text-lg flex items-center justify-center space-x-2"
          >
            {!isConnected ? (
              <span>Connect Wallet</span>
            ) : isProcessing || isLoggingRemittance ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Send Money</span>
                <ArrowRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}

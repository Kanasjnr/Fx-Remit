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
import Link from "next/link"
import {
  ArrowsUpDownIcon,
  ArrowRightIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ChevronDownIcon,
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
                <h1 className="text-xl font-bold text-gray-900">Send Money</h1>
                <p className="text-sm text-gray-500">Fast & secure transfers</p>
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
          {/* Balance Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available Balance</p>
                  <p className="text-xs text-gray-400">{fromCurrencyInfo?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {isLoadingBalance ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                  ) : (
                    `${fromCurrencyInfo?.symbol}${balance.toFixed(2)}`
                  )}
                </div>
                <div className="text-sm text-blue-600 font-medium">{fromCurrency}</div>
              </div>
            </div>
          </div>

          {/* Transfer Form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Transfer Details</h2>
              <p className="text-sm text-gray-500">Enter the transfer information below</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Currency Selection */}
              <div className="space-y-4">
                {/* From Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">From</label>
                  <div className="relative">
                    <select
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value as Currency)}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code} className="bg-white">
                          {currency.flag} {currency.symbol} {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSwapCurrencies}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <ArrowsUpDownIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* To Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">To</label>
                  <div className="relative">
                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value as Currency)}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code} className="bg-white">
                          {currency.flag} {currency.symbol} {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Amount to Send</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-lg placeholder-gray-400 pr-16"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    {fromCurrency}
                  </div>
                </div>
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Recipient Address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Exchange Rate Info */}
          {amount && quote && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Transfer Summary</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Exchange Rate</span>
                  <span className="text-gray-900 font-medium">
                    1 {fromCurrency} = {Number.parseFloat(quote.exchangeRate).toFixed(4)} {toCurrency}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">You send</span>
                  <span className="text-gray-900 font-medium">
                    {fromCurrencyInfo?.symbol}
                    {amount} {fromCurrency}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Platform fee (1.5%)</span>
                  <span className="text-gray-900 font-medium">
                    {fromCurrencyInfo?.symbol}
                    {Number.parseFloat(quote.platformFee) < 0.01 && Number.parseFloat(quote.platformFee) > 0
                      ? Number.parseFloat(quote.platformFee).toFixed(4)
                      : Number.parseFloat(quote.platformFee).toFixed(2)}{" "}
                    {fromCurrency}
                  </span>
                </div>

                <div className="border-t border-blue-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Recipient gets</span>
                    <span className="text-xl font-bold text-blue-600">
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
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed text-lg flex items-center justify-center space-x-2"
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

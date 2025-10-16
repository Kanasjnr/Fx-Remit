"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp"
import BottomNavigation from "@/components/BottomNavigation"
import { useTokenBalance, useQuote } from "@/hooks/useMento"
import { useEthersSwap } from "@/hooks/useEthersSwap"
import type { Currency } from "@/lib/contracts"
import { toast } from "react-toastify"
import { useTransactionStatus } from "@/providers/TransactionStatusProvider"
import Link from "next/link"
import Image from "next/image"
import { AssetPicker, type AssetOption } from "@/components/AssetPicker"
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
  const { isMiniApp } = useFarcasterMiniApp()
  const [fromCurrency, setFromCurrency] = useState<Currency>("cUSD")
  const [toCurrency, setToCurrency] = useState<Currency>("cNGN")
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [pickerOpen, setPickerOpen] = useState<null | "from" | "to">(null)
  const { startProcessing, markSuccess, markFailure, clear } = useTransactionStatus()

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

  const fromCurrencyInfo = currencies.find((c) => c.code === fromCurrency)
  const toCurrencyInfo = currencies.find((c) => c.code === toCurrency)

  const assetOptions: AssetOption[] = currencies.map((c) => ({
    code: c.code,
    label: `${c.code} - ${c.name}`,
  }))

  const insufficientBalance = !isLoadingBalance && amount !== "" && Number.isFinite(Number(amount)) && Number(amount) > balance

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
    startProcessing({
      onRetry: () => {
        clear()
        void handleSend()
      },
      onReset: () => {
        setAmount("")
        setRecipient("")
      },
    })

    try {
      console.log("🚀 Starting swap with new ethers.js implementation...")

      const swapResult = await swap(fromCurrency, toCurrency, amount, undefined, recipient)

      console.log("✅ Swap completed successfully:", swapResult)
      markSuccess()

      setAmount("")
      setRecipient("")
    } catch (error) {
      console.error("❌ Transaction failed:", error)
      markFailure({ reason: error instanceof Error ? error.message : "Transaction failed" })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="px-4 py-6 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              <img
                src="/logo.jpg"
                alt="FX Remit"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log("Logo failed to load:", e);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => console.log("Logo loaded successfully")}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Send Money</h1>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Balance Card */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm text-center">
            <p className="text-sm/5 opacity-90">Available balance</p>
            <div className="mt-2 text-5xl font-bold tracking-tight">
              {isLoadingBalance ? (
                <span className="inline-block h-10 w-28 bg-white/20 rounded animate-pulse" />
              ) : (
                `${fromCurrencyInfo?.symbol}${balance.toFixed(2)}`
              )}
            </div>
            <p className="mt-1 text-white/80 text-sm">{fromCurrency}</p>
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
                  <button
                    type="button"
                    onClick={() => setPickerOpen("from")}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between hover:bg-gray-100"
                  >
                    <span className="text-gray-900">{fromCurrency} - {fromCurrencyInfo?.name}</span>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center -my-2">
                  <button
                    onClick={handleSwapCurrencies}
                    className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg text-white flex items-center justify-center transition-all duration-200"
                    aria-label="Swap"
                  >
                    <ArrowsUpDownIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* To Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">To</label>
                  <button
                    type="button"
                    onClick={() => setPickerOpen("to")}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between hover:bg-gray-100"
                  >
                    <span className="text-gray-900">{toCurrency} - {toCurrencyInfo?.name}</span>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  </button>
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
                    className={`w-full p-4 bg-gray-50 border rounded-xl text-gray-900 text-lg placeholder-gray-400 pr-16 focus:ring-2  ${
                      insufficientBalance
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    {fromCurrency}
                  </div>
                </div>
                {insufficientBalance && (
                  <p className="mt-2 text-sm text-red-600">
                    Insufficient balance. Available: {fromCurrencyInfo?.symbol}
                    {balance.toFixed(2)} {fromCurrency}
                  </p>
                )}
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
            disabled={!isConnected || !amount || !recipient || !quote || isProcessing || insufficientBalance}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed text-lg flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
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

      {/* Asset Picker Modal */}
      <AssetPicker
        open={pickerOpen !== null}
        title="Select Asset"
        options={assetOptions}
        onClose={() => setPickerOpen(null)}
        onSelect={(code) => {
          if (pickerOpen === "from") setFromCurrency(code as Currency)
          if (pickerOpen === "to") setToCurrency(code as Currency)
        }}
      />

      <BottomNavigation />
    </div>
  )
}

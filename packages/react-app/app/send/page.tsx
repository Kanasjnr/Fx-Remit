"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAccount, useWalletClient } from "wagmi"
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp"
import BottomNavigation from "@/components/BottomNavigation"
import { useTokenBalance, useQuote } from "@/hooks/useMento"
import { useEthersSwap } from "@/hooks/useEthersSwap"
import { useFarcasterResolver } from "@/hooks/useFarcasterResolver"
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
  const { data: walletClient } = useWalletClient()
  const { isMiniApp } = useFarcasterMiniApp()
  const [fromCurrency, setFromCurrency] = useState<Currency>("cUSD")
  const [toCurrency, setToCurrency] = useState<Currency>("cNGN")
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [pickerOpen, setPickerOpen] = useState<null | "from" | "to">(null)
  const { startProcessing, markSuccess, markFailure, clear } = useTransactionStatus()

  // Memoize wallet state to prevent unnecessary re-renders
  const walletState = useMemo(() => ({
    address,
    isConnected,
    isMiniApp,
    canSend: isConnected && address
  }), [address, isConnected, isMiniApp])

  const currencies: Array<{ 
    code: Currency; 
    name: string; 
    flag: string; 
    symbol: string;
    tokenLogo: string;
    countryFlag: string;
  }> = [
    { code: "cUSD", name: "US Dollar", flag: "🇺🇸", symbol: "$", tokenLogo: "/cUSD .svg", countryFlag: "/US.svg" },
    { code: "cEUR", name: "Euro", flag: "🇪🇺", symbol: "€", tokenLogo: "/cEUR.svg", countryFlag: "/EUR.svg" },
    { code: "cGBP", name: "British Pound", flag: "🇬🇧", symbol: "£", tokenLogo: "/cGBP.svg", countryFlag: "/GB .svg" },
    { code: "cCAD", name: "Canadian Dollar", flag: "🇨🇦", symbol: "C$", tokenLogo: "/cCAD.svg", countryFlag: "/CA .svg" },
    { code: "cAUD", name: "Australian Dollar", flag: "🇦🇺", symbol: "A$", tokenLogo: "/cAUD.svg", countryFlag: "/AU.svg" },
    { code: "cCHF", name: "Swiss Franc", flag: "🇨🇭", symbol: "CHF", tokenLogo: "/cCHF.svg", countryFlag: "/CH.svg" },
    { code: "cJPY", name: "Japanese Yen", flag: "🇯🇵", symbol: "¥", tokenLogo: "/cJPY.svg", countryFlag: "/JP.svg" },
    { code: "cREAL", name: "Brazilian Real", flag: "🇧🇷", symbol: "R$", tokenLogo: "/cREAL.svg", countryFlag: "/BR.svg" },
    { code: "cCOP", name: "Colombian Peso", flag: "🇨🇴", symbol: "COP$", tokenLogo: "/cCOP.svg", countryFlag: "/CO.svg" },
    { code: "cKES", name: "Kenyan Shilling", flag: "🇰🇪", symbol: "KSh", tokenLogo: "/cKES.svg", countryFlag: "/KE.svg" },
    { code: "cNGN", name: "Nigerian Naira", flag: "🇳🇬", symbol: "₦", tokenLogo: "/cNGN.svg", countryFlag: "/NG.svg" },
    { code: "cZAR", name: "South African Rand", flag: "🇿🇦", symbol: "R", tokenLogo: "/cZAR.svg", countryFlag: "/SA.svg" },
    { code: "cGHS", name: "Ghanaian Cedi", flag: "🇬🇭", symbol: "₵", tokenLogo: "/cGHS.svg", countryFlag: "/GH .svg" },
    { code: "eXOF", name: "CFA Franc", flag: "🌍", symbol: "XOF", tokenLogo: "/eXOF.svg", countryFlag: "/CF.svg" },
    { code: "PUSO", name: "Philippine Peso", flag: "🇵🇭", symbol: "₱", tokenLogo: "/PUSO.svg", countryFlag: "/PH.svg" },
  ]

  const { balance, isLoading: isLoadingBalance } = useTokenBalance(fromCurrency)
  const { quote, isLoading: isLoadingQuote } = useQuote(fromCurrency, toCurrency, amount)
  const { swap, isWalletReady, walletStatus } = useEthersSwap()
  const { resolveUsername, isLoading: isResolvingUsername } = useFarcasterResolver()


  const fromCurrencyInfo = currencies.find((c) => c.code === fromCurrency)
  const toCurrencyInfo = currencies.find((c) => c.code === toCurrency)

  const assetOptions: AssetOption[] = currencies.map((c) => ({
    code: c.code,
    label: c.name,
    tokenLogo: c.tokenLogo,
    countryFlag: c.countryFlag,
  }))

  const insufficientBalance = !isLoadingBalance && amount !== "" && Number.isFinite(Number(amount)) && Number(amount) > balance

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const debouncedResolveUsername = useCallback((value: string) => {
    // Clear previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set new timeout
    const newTimeout = setTimeout(async () => {
      if (value.startsWith('@') && value.length > 1) {
        console.log(' Attempting to resolve username:', value);
        const resolvedAddress = await resolveUsername(value)
        console.log(' Resolved address:', resolvedAddress);
        if (resolvedAddress) {
          setRecipient(resolvedAddress)
        }
      }
    }, 1500); // Wait 1.5 seconds after user stops typing

    setDebounceTimeout(newTimeout);
  }, [resolveUsername, debounceTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  const handleRecipientChange = (value: string) => {
    setRecipient(value)
    debouncedResolveUsername(value)
  }

  const handleSend = async () => {
    if (!walletState.canSend || !amount || !recipient || !quote) {
      return
    }

    setIsProcessing(true)
    startProcessing({
      onRetry: () => {
        clear()
        void handleSend()
      },
      onReset: () => {
        setAmount("")
        setRecipient("")
      },
      transactionData: {
        fromCurrency,
        toCurrency,
        amount,
        recipient,
      },
    })

    try {
      console.log(" Starting swap with new ethers.js implementation...")

      const swapResult = await swap(fromCurrency, toCurrency, amount, undefined, recipient)

      console.log(" Swap result:", swapResult)

      if ((swapResult as any)?.pending) {
        console.log('Batch transaction submitted successfully via Farcaster');
        clear() // Clear the processing modal
        toast.success('Transaction submitted! Processing in Farcaster wallet...', {
          position: "top-center",
          autoClose: 3000,
        });
        setAmount("")
        setRecipient("")
        setIsProcessing(false)
        return
      }

      markSuccess()
      toast.success('Transaction completed successfully!', {
        position: "top-center",
        autoClose: 3000,
      });
      setAmount("")
      setRecipient("")
      setIsProcessing(false)
    } catch (error) {
      console.error(" Transaction failed:", error)
      markFailure({ reason: error instanceof Error ? error.message : "Transaction failed" })
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
                <label className="block text-sm font-medium text-gray-700 mb-3">Recipient</label>
                <div className="relative">
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => handleRecipientChange(e.target.value)}
                    placeholder="@username or 0x..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 pr-12"
                  />
                  {isResolvingUsername && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Enter a wallet address (0x...) or Farcaster username (@username) 
                </p>
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
            disabled={!isWalletReady || !amount || !recipient || !quote || isProcessing || insufficientBalance}
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

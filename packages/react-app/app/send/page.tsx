'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import BottomNavigation from '@/components/BottomNavigation';
import { useTokenBalance, useQuote } from '@/hooks/useMento';
import { useEthersSwap } from '@/hooks/useEthersSwap';
import { useLogRemittance } from '@/hooks/useContract';
import { Currency, CURRENCY_INFO } from '@/lib/contracts';
import { toast } from 'react-toastify';

export default function SendPage() {
  const { address, isConnected } = useAccount();
  const [fromCurrency, setFromCurrency] = useState<Currency>('cUSD');
  const [toCurrency, setToCurrency] = useState<Currency>('cNGN');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currencies: Array<{ code: Currency; name: string; flag: string }> = [
    { code: 'cUSD', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'cEUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'cGBP', name: 'British Pound', flag: '🇬🇧' },
    { code: 'cCAD', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'cAUD', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'cCHF', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'cJPY', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'cREAL', name: 'Brazilian Real', flag: '🇧🇷' },
    { code: 'cCOP', name: 'Colombian Peso', flag: '🇨🇴' },
    { code: 'cKES', name: 'Kenyan Shilling', flag: '🇰🇪' },
    { code: 'cNGN', name: 'Nigerian Naira', flag: '🇳🇬' },
    { code: 'cZAR', name: 'South African Rand', flag: '🇿🇦' },
    { code: 'cGHS', name: 'Ghanaian Cedi', flag: '🇬🇭' },
    { code: 'eXOF', name: 'CFA Franc', flag: '🌍' },
    { code: 'PUSO', name: 'Philippine Peso', flag: '🇵🇭' },
  ];

  const { balance, isLoading: isLoadingBalance } = useTokenBalance(fromCurrency);
  const { quote, isLoading: isLoadingQuote } = useQuote(fromCurrency, toCurrency, amount);
  const { swap } = useEthersSwap(); 
  const { logRemittance, isPending: isLoggingRemittance } = useLogRemittance();

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleSend = async () => {
    if (!address || !amount || !recipient || !quote) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsProcessing(true);
    toast.dismiss(); // Clear any existing toasts
    
    // Show loading toast
    const loadingToast = toast.loading('Processing your remittance transaction...');

    try {
      console.log('🚀 Starting swap with new ethers.js implementation...');
      
      // Execute the swap using the new pure ethers.js implementation
      const swapResult = await swap(
        fromCurrency,
        toCurrency,
        amount,
        undefined, // minAmountOut (optional)
        recipient  // recipient address for remittance
      );

      console.log('✅ Swap completed successfully:', swapResult);

      // Log the remittance to our contract
      console.log('📝 Starting logRemittance call...');
      console.log('📝 Detailed parameter check:');
      console.log('  recipient:', recipient);
      console.log('  fromCurrency:', fromCurrency);
      console.log('  toCurrency:', toCurrency);
      console.log('  amountSent:', amount);
      console.log('  quote object:', quote);
      console.log('  quote.amountOut:', quote?.amountOut);
      console.log('  quote.exchangeRate:', quote?.exchangeRate);
      console.log('  quote.platformFee:', quote?.platformFee);
      console.log('  swapResult object:', swapResult);
      console.log('  swapResult.hash:', swapResult?.hash);
      console.log('  corridor calculation:', `${fromCurrency.replace('c', '')}-${toCurrency.replace('c', '')}`);
      
      console.log('📝 logRemittance params:', {
        recipient,
        fromCurrency,
        toCurrency,
        amountSent: amount,
        amountReceived: quote.amountOut,
        exchangeRate: quote.exchangeRate,
        platformFee: quote.platformFee,
        mentoTxHash: swapResult.hash,
        corridor: `${fromCurrency.replace('c', '')}-${toCurrency.replace('c', '')}`,
      });
      
      try {
        await logRemittance({
          recipient,
          fromCurrency,
          toCurrency,
          amountSent: amount,
          amountReceived: quote.amountOut,
          exchangeRate: quote.exchangeRate,
          platformFee: quote.platformFee,
          mentoTxHash: swapResult.hash, // Changed from transactionHash to hash
          corridor: `${fromCurrency.replace('c', '')}-${toCurrency.replace('c', '')}`,
        });
        console.log('✅ logRemittance completed successfully!');
      } catch (logError) {
        console.error('❌ logRemittance failed:', logError);
        // Don't throw the error - just log it so swap success isn't affected
      }

      // Dismiss loading toast and show success toast
      toast.dismiss(loadingToast);
      const successMessage = swapResult.message || `🎉 Successfully sent ${amount} ${fromCurrency} to ${recipient}!`;
      toast.success(successMessage);
      
      // Reset form
      setAmount('');
      setRecipient('');
      
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      // Dismiss loading toast and show error toast
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20">
      {/* Header */}
      <header className="px-6 py-6 bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">FX</span>
            </div>
            <span className="text-2xl font-bold text-white">FXRemit</span>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-300">Connected</span>
              </>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Send Money</h1>

          {/* Balance Display */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <div className="text-sm text-slate-300 mb-2">Available Balance</div>
            <div className="text-3xl font-bold text-white">
              {isLoadingBalance ? (
                <div className="animate-pulse">Loading...</div>
              ) : (
                `${balance.toFixed(2)}`
              )}
            </div>
            <div className="text-sm text-blue-400 font-semibold">{fromCurrency}</div>
          </div>

          {/* Success/Error Messages now shown as toasts */}

          {/* Currency Selection */}
          <div className="space-y-6 mb-8">
            {/* From Currency */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">From</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as Currency)}
                className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white appearance-none"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code} className="bg-slate-800">
                    {currency.flag} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSwapCurrencies}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* To Currency */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">To</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as Currency)}
                className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white appearance-none"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code} className="bg-slate-800">
                    {currency.flag} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-3">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-xl placeholder-slate-500"
            />
          </div>

          {/* Exchange Rate Info */}
          {amount && quote && (
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-300">Exchange Rate</span>
                <span className="text-sm font-medium text-white">1 {fromCurrency} = {parseFloat(quote.exchangeRate).toFixed(4)} {toCurrency}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-300">You send</span>
                <span className="text-sm font-medium text-white">{amount} {fromCurrency}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-300">Platform fee (1.5%)</span>
                <span className="text-sm font-medium text-white">
                  {parseFloat(quote.platformFee) < 0.01 && parseFloat(quote.platformFee) > 0
                    ? `${parseFloat(quote.platformFee).toFixed(4)} ${fromCurrency}`
                    : `${parseFloat(quote.platformFee).toFixed(2)} ${fromCurrency}`
                  }
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-white/20 pt-3">
                <span className="text-sm font-medium text-slate-300">Recipient gets</span>
                <span className="text-lg font-bold text-blue-400">{parseFloat(quote.amountOut).toFixed(2)} {toCurrency}</span>
              </div>
            </div>
          )}

          {/* Recipient Address */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-3">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!isConnected || !amount || !recipient || !quote || isProcessing || isLoggingRemittance}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:transform-none text-lg"
          >
            {!isConnected ? (
              'Connect Wallet'
            ) : isProcessing || isLoggingRemittance ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              'Send Money →'
            )}
          </button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
} 
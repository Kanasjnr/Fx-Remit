'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformStats } from '@/hooks/useContract';
import Header from '@/components/Header';

export default function LandingPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { stats, isLoading: isLoadingStats } = usePlatformStats();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGetStarted = () => {
    router.push('/send');
  };

  // Format volume numbers dynamically based on size
  const formatVolume = (amount: number) => {
    if (amount >= 1000000) {
      // Millions: $1.2M, $15.5M, etc.
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      // Thousands: $1.2K, $15.5K, etc.
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      // Under 1000: $567, $89, etc.
      return `$${Math.round(amount)}`;
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(79,70,229,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.1),transparent_50%)]"></div>
      </div>
      
      {/* Use Header component */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pt-8 pb-20">
        <div className="max-w-lg mx-auto">
          {/* Hero Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs">✨</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Send Money
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Globally
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-slate-300 mb-10 leading-relaxed">
            Lightning-fast cross-border payments with ultra-low fees. 
            <span className="text-blue-400 font-semibold"> Powered by blockchain.</span>
          </p>

          {/* Features */}
          <div className="space-y-4 mb-12">
            <div className="flex items-center justify-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">💸</span>
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">Ultra Low Fees</div>
                <div className="text-slate-300 text-sm">1-2% vs traditional 7-10%</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">⚡</span>
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">Instant Transfers</div>
                <div className="text-slate-300 text-sm">Seconds, not days</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">🔒</span>
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">Fully Transparent</div>
                <div className="text-slate-300 text-sm">Track every transaction</div>
              </div>
            </div>
          </div>

          {/* Get Started Button */}
          <button
            onClick={handleGetStarted}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105 text-lg"
          >
            Get Started →
          </button>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">
                {isLoadingStats ? (
                  <div className="animate-pulse">Loading...</div>
                ) : stats ? (
                  formatVolume(parseFloat(stats.totalVolume))
                ) : (
                  '$0'
                )}
              </div>
              <div className="text-slate-300">Total Volume</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">
                {isLoadingStats ? (
                  <div className="animate-pulse">Loading...</div>
                ) : stats ? (
                  `${stats.totalTransactions.toLocaleString()}+`
                ) : (
                  '0'
                )}
              </div>
              <div className="text-slate-300">Transactions</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 text-center">
        <div className="text-slate-400 text-sm">
          Powered by 
          <span className="text-blue-400 font-semibold"> Celo & Mento Protocol</span>
        </div>
      </footer>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import BottomNavigation from '@/components/BottomNavigation';

export default function ProfilePage() {
  const [isConnected, setIsConnected] = useState(true);

  const userStats = {
    totalSent: 1250.75,
    totalTransactions: 15,
    totalFees: 18.76,
    favoriteCorridors: ['USD-KES', 'USD-NGN', 'EUR-GHS']
  };

  const mockAddress = '0x742d35Cc6634C0532925a3b8D5C9C4e7fDc5bE1a';

  const handleDisconnect = () => {
    setIsConnected(false);
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
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-slate-300">Connected</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Profile</h1>

          {/* Wallet Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">Wallet</div>
                  <div className="text-sm text-slate-300 font-mono">{mockAddress.slice(0, 6)}...{mockAddress.slice(-4)}</div>
                </div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                Copy
              </button>
            </div>
            <div className="border-t border-white/20 pt-6">
              <div className="text-sm text-slate-300 mb-2">Balance</div>
              <div className="text-3xl font-bold text-white">$1,250.00</div>
              <div className="text-sm text-blue-400 font-semibold">cUSD</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-slate-300 mb-2">Total Sent</div>
              <div className="text-2xl font-bold text-white">${userStats.totalSent.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-slate-300 mb-2">Transactions</div>
              <div className="text-2xl font-bold text-white">{userStats.totalTransactions}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-slate-300 mb-2">Total Fees</div>
              <div className="text-2xl font-bold text-white">${userStats.totalFees.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-slate-300 mb-2">Avg. Fee</div>
              <div className="text-2xl font-bold text-white">{((userStats.totalFees / userStats.totalTransactions) * 100).toFixed(1)}%</div>
            </div>
          </div>

          {/* Favorite Corridors */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Favorite Corridors</h3>
            <div className="space-y-3">
              {userStats.favoriteCorridors.map((corridor, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                  <span className="text-sm text-slate-300">{corridor}</span>
                  <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">Most used</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-300">Export Transactions</span>
                </div>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                  Export
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-300">Security</span>
                </div>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                  Manage
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-300">Help & Support</span>
                </div>
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                  Contact
                </button>
              </div>
            </div>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Disconnect Wallet
          </button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
} 
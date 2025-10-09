"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePlatformStats } from "@/hooks/useContract"
import Header from "@/components/Header"
import WorldMap from "@/components/WorldMap"
import Image from "next/image"
import {
  CurrencyDollarIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  ArrowPathIcon,
  CreditCardIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline"
import { PlayIcon } from "@heroicons/react/24/solid"

export default function LandingPage() {
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const { stats, isLoading: isLoadingStats } = usePlatformStats()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleGetStarted = () => {
    router.push("/send")
  }

  const formatVolume = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    } else {
      return `$${Math.round(amount)}`
    }
  }

  const supportedCountries = [
    { name: "United States", flag: "🇺🇸", currency: "cUSD" },
    { name: "European Union", flag: "🇪🇺", currency: "cEUR" },
    { name: "United Kingdom", flag: "🇬🇧", currency: "cGBP" },
    { name: "Canada", flag: "🇨🇦", currency: "cCAD" },
    { name: "Australia", flag: "🇦🇺", currency: "cAUD" },
    { name: "Switzerland", flag: "🇨🇭", currency: "cCHF" },
    { name: "Japan", flag: "🇯🇵", currency: "cJPY" },
    { name: "Brazil", flag: "🇧🇷", currency: "cREAL" },
    { name: "Colombia", flag: "🇨🇴", currency: "cCOP" },
    { name: "Kenya", flag: "🇰🇪", currency: "cKES" },
    { name: "Nigeria", flag: "🇳🇬", currency: "cNGN" },
    { name: "South Africa", flag: "🇿🇦", currency: "cZAR" },
    { name: "Ghana", flag: "🇬🇭", currency: "cGHS" },
    { name: "West Africa", flag: "🌍", currency: "eXOF" },
    { name: "Philippines", flag: "🇵🇭", currency: "PUSO" },
  ]

  const howItWorksSteps = [
    {
      step: "01",
      title: "Connect Your Wallet",
      description: "Link your crypto wallet or create a new one in seconds",
      icon: CreditCardIcon,
    },
    {
      step: "02",
      title: "Choose Currencies",
      description: "Select from 15 supported currencies with real-time rates",
      icon: ArrowPathIcon,
    },
    {
      step: "03",
      title: "Send Instantly",
      description: "Transfer money globally with sub-second confirmations",
      icon: BoltIcon,
    },
  ]

  if (!isMounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-8">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-blue-700 text-sm font-medium">Live on Celo Mainnet</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Cross-Border
                <span className="block text-blue-600">
                  Payments
                </span>
                <span className="block text-gray-900">Reimagined</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Send money to 15+ countries with ultra-low 1.5% fees, lightning-fast settlements, and enterprise-grade
                security. Powered by Celo blockchain and Mento Protocol.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 text-lg shadow-sm hover:shadow-md"
                >
                  Start Sending Money
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
                <button className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-8 rounded-xl transition-colors duration-200 border border-gray-200 text-lg shadow-sm">
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-8 text-gray-500">
                <div className="flex items-center">
                  <ShieldCheckIcon className="w-5 h-5 mr-2 text-green-500" />
                  <span className="text-sm">Audited Smart Contracts</span>
                </div>
                <div className="flex items-center">
                  <LockClosedIcon className="w-5 h-5 mr-2 text-green-500" />
                  <span className="text-sm">Non-Custodial</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2 text-green-500" />
                  <span className="text-sm">24/7 Available</span>
                </div>
              </div>
            </div>

            {/* Right Content - World Map */}
            <div className="relative">
              <WorldMap />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {isLoadingStats ? "..." : stats ? formatVolume(Number.parseFloat(stats.totalVolume)) : "$2.5M+"}
              </div>
              <div className="text-gray-500">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {isLoadingStats ? "..." : stats ? `${stats.totalTransactions.toLocaleString()}+` : "5,000+"}
              </div>
              <div className="text-gray-500">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">15</div>
              <div className="text-gray-500">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{"<1s"}</div>
              <div className="text-gray-500">Settlement Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Countries */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Send Money to{" "}
              <span className="text-blue-600">
                15+ Countries
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with millions of users worldwide through our expanding network of supported currencies
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {supportedCountries.map((country, index) => (
              <div
                key={country.name}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{country.flag}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{country.currency}</div>
                    <div className="text-sm text-gray-500">{country.name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How FX-Remit Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Send money globally in three simple steps with blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 h-full shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{step.step}</div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRightIcon className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose{" "}
              <span className="text-blue-600">
                FX-Remit
              </span>
              ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on Celo blockchain with enterprise-grade security and user-friendly design
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-blue-300 transition-colors duration-200 shadow-sm">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-6">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ultra Low Fees</h3>
              <p className="text-gray-600 mb-4">
                Pay only 1.5% compared to traditional services that charge 7-10%. Save up to 85% on every transfer.
              </p>
              <div className="text-green-600 font-semibold">Save $85 on every $1000</div>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-blue-300 transition-colors duration-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
                <BoltIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Lightning Fast</h3>
              <p className="text-gray-600 mb-4">
                Sub-second confirmations with Celo&apos;s 5-second block time. No more waiting days for transfers.
              </p>
              <div className="text-blue-600 font-semibold">Available 24/7</div>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-blue-300 transition-colors duration-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-6">
                <GlobeAltIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Global Reach</h3>
              <p className="text-gray-600 mb-4">
                Send to 15+ countries with automatic currency conversion powered by Mento Protocol.
              </p>
              <div className="text-purple-600 font-semibold">Real-time rates</div>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-blue-300 transition-colors duration-200 shadow-sm">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-6">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Bank-Grade Security</h3>
              <p className="text-gray-600 mb-4">
                Audited smart contracts with multiple security layers. Your funds are always under your control.
              </p>
              <div className="text-red-600 font-semibold">Non-custodial</div>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-blue-300 transition-colors duration-200 shadow-sm">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mb-6">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Full Transparency</h3>
              <p className="text-gray-600 mb-4">
                Track every transaction in real-time with comprehensive analytics and detailed history.
              </p>
              <div className="text-yellow-600 font-semibold">Complete visibility</div>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200 hover:border-blue-300 transition-colors duration-200 shadow-sm">
              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mb-6">
                <DevicePhoneMobileIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Easy to Use</h3>
              <p className="text-gray-600 mb-4">
                Intuitive interface that works on all devices with seamless wallet integration.
              </p>
              <div className="text-indigo-600 font-semibold">Mobile optimized</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Send Money Globally?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust FX-Remit for fast, secure, and affordable cross-border payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 text-lg shadow-sm hover:shadow-md"
            >
              Get Started Now
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
            <button className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-8 rounded-xl transition-colors duration-200 border border-gray-200 text-lg shadow-sm">
              <DocumentCheckIcon className="w-5 h-5 mr-2" />
              Read Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden mr-3">
                  <img
                    src="/logo.jpg"
                    alt="FX Remit"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-2xl font-bold text-white">FX-Remit</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Democratizing cross-border payments with blockchain technology. Send money globally with ultra-low fees
                and lightning-fast settlements.
              </p>
              <div className="text-gray-500 text-sm">
                Powered by <span className="text-blue-400">Celo & Mento Protocol</span>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Send Money
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Track Transfer
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Exchange Rates
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            © 2025 FX-Remit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

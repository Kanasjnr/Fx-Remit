"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useConnect, useAccount } from "wagmi"
import { injected } from "wagmi/connectors"
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp"

export default function HeaderHero() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hideConnectBtn, setHideConnectBtn] = useState(false)
  const { connect } = useConnect()
  const { isConnected } = useAccount()
  const { isMiniApp } = useFarcasterMiniApp()

  useEffect(() => {
    if (window.ethereum && window.ethereum.isMiniPay) {
      setHideConnectBtn(true)
      
      connect({ connector: injected() })
    }
  }, [connect])

  const handleLaunchApp = () => {
    router.push("/send")
  }

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="/blur and glass.svg" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header Overlay */}
      <div className="relative z-10">
        {/* Desktop Header */}
        <header className="hidden md:block fixed w-full top-0 left-0 z-50 p-4">
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-lg border-b border-gray-200 px-6 py-4" style={{ width: '1052px', height: '94px' }}>
              <div className="flex justify-between items-center h-full">
                {/* Logo */}
                <div className="flex items-center flex-shrink-0">
                  <img 
                    src="/fx remit.svg" 
                    alt="FX Remit" 
                    className="h-12 w-auto object-contain"
                  />
                </div>

                {/* Desktop Navigation */}
                <nav className="flex space-x-8">
                  <a href="#pricing" className="px-3 py-2 font-normal text-center" style={{ fontFamily: 'SF Pro Rounded', fontSize: '18px', lineHeight: '150%', color: '#050505BF' }}>
                    Pricing
                  </a>
                  <a href="#pricing" className="px-3 py-2 font-normal text-center" style={{ fontFamily: 'SF Pro Rounded', fontSize: '18px', lineHeight: '150%', color: '#050505BF' }}>
                    Pricing
                  </a>
                  <a href="#pricing" className="px-3 py-2 font-normal text-center" style={{ fontFamily: 'SF Pro Rounded', fontSize: '18px', lineHeight: '150%', color: '#050505BF' }}>
                    Pricing
                  </a>
                </nav>

                {/* Desktop CTA Button */}
                <div>
                  {isConnected ? (
                    <button 
                      onClick={handleLaunchApp}
                      className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                    >
                      Launch App
                    </button>
                  ) : (
                    !hideConnectBtn && !isMiniApp && (
                      <ConnectButton
                        showBalance={false}
                        accountStatus="avatar"
                        chainStatus="icon"
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden fixed w-full top-0 left-0 z-50 p-4">
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-lg border-b border-gray-200 px-4 py-3" style={{ width: '400px', height: '65px' }}>
              <div className="flex justify-between items-center h-full">
                {/* Mobile Logo */}
                <div className="flex items-center flex-shrink-0">
                  <img 
                    src="/fx remit.svg" 
                    alt="FX Remit" 
                    className="h-8 w-auto object-contain"
                  />
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed top-20 left-4 right-4 z-40">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 px-4 py-3">
              <div className="space-y-3">
                <a href="#pricing" className="block px-3 py-2 font-normal text-center" style={{ fontFamily: 'SF Pro Rounded', fontSize: '18px', lineHeight: '150%', color: '#050505BF' }}>
                  Pricing
                </a>
                <a href="#pricing" className="block px-3 py-2 font-normal text-center" style={{ fontFamily: 'SF Pro Rounded', fontSize: '18px', lineHeight: '150%', color: '#050505BF' }}>
                  Pricing
                </a>
                <a href="#pricing" className="block px-3 py-2 font-normal text-center" style={{ fontFamily: 'SF Pro Rounded', fontSize: '18px', lineHeight: '150%', color: '#050505BF' }}>
                  Pricing
                </a>
                <div className="flex justify-center">
                  {isConnected ? (
                    <button 
                      onClick={handleLaunchApp}
                      className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                    >
                      Launch App
                    </button>
                  ) : (
                    !hideConnectBtn && !isMiniApp && (
                      <ConnectButton
                        showBalance={false}
                        accountStatus="avatar"
                        chainStatus="icon"
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hero Section Content */}
      <div className="relative pt-26 pb-16 px-4">
        <div className="flex justify-center">
          <div 
            className="text-center"
            style={{ 
              width: '804px', 
              height: '399px', 
              marginTop: '260px',
              marginLeft: 'auto',
              marginRight: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '30px',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Live on Celo Mainnet Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white border border-orange-400 rounded-full">
              <span className="text-orange-400 text-sm font-medium">
                Live on Celo Mainnet
              </span>
            </div>

            {/* Main Headline */}
            <h1 
              className="text-center text-black font-semibold text-[32px] leading-[150%] tracking-[0%] md:text-[64px] md:font-medium"
              style={{
                fontFamily: 'SF Pro Rounded',
                margin: 0
              }}
            >
              CROSS-BORDER<br />
              <span style={{ color: '#2E5EAA' }}>PAYMENTS REIMAGINED</span>
            </h1>

            {/* Subtitle */}
            <p 
              style={{
                fontFamily: 'SF Pro Rounded',
                fontWeight: 400,
                fontStyle: 'normal',
                fontSize: '20px',
                lineHeight: '150%',
                letterSpacing: '0%',
                textAlign: 'center',
                color: '#050505BF'
              }}
            >
              Send money to 15+ countries with ultra-low 1.5% fees, lightning-fast settlements 
              and enterprise-grade security. Powered by Celo blockchain and Mento Protocol.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleLaunchApp}
              style={{
                fontFamily: 'Inter',
                fontWeight: 500,
                fontStyle: 'normal',
                fontSize: '18px',
                lineHeight: '100%',
                letterSpacing: '0%',
                background: '#2E5EAA',
                color: '#F8F8FF',
                width: '210px',
                height: '59px',
                borderRadius: '15px',
                paddingTop: '20px',
                paddingRight: '10px',
                paddingBottom: '20px',
                paddingLeft: '10px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1e4a8c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2E5EAA';
              }}
            >
              Start sending money
            </button>

            {/* Mobile Phone Illustration */}
            <div className="flex justify-center" style={{ marginTop: '-150px' }}>
              <div className="relative">
                <img 
                  src="/hero.svg" 
                  alt="FX Remit Mobile App" 
                  className="w-100 h-auto "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { Disclosure } from "@headlessui/react"
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useEffect, useState } from "react"
import { useConnect, useAccount } from "wagmi"
import { injected } from "wagmi/connectors"
import Link from "next/link"
import Image from "next/image"
import { useFarcasterMiniApp } from "@/hooks/useFarcasterMiniApp"

export default function Header() {
  const [hideConnectBtn, setHideConnectBtn] = useState(false)
  const { connect } = useConnect()
  const { isConnected } = useAccount()
  const { isMiniApp } = useFarcasterMiniApp()

  useEffect(() => {
    if (window.ethereum && window.ethereum.isMiniPay) {
      setHideConnectBtn(true)
      connect({ connector: injected({ target: "metaMask" }) })
    }
  }, [connect])

  return (
    <Disclosure as="nav" className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative flex h-16 justify-between items-center">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>

              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <Link href="/" className="flex flex-shrink-0 items-center space-x-3 hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 rounded-xl overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="FX Remit"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-2xl font-bold text-gray-900 hidden sm:block">FXRemit</span>
                </Link>
              </div>

              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 space-x-4">
                {isConnected && (
                  <div className="hidden sm:block">
                    <button
                      onClick={() => (window.location.href = "/send")}
                      className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm shadow-sm"
                    >
                      Launch App
                    </button>
                  </div>
                )}
                {!hideConnectBtn && !isMiniApp && (
                  <div className="hidden sm:block">
                    <ConnectButton
                      showBalance={{
                        smallScreen: false,
                        largeScreen: true,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-4 pt-2 pb-4 bg-white border-t border-gray-200">
              {isConnected && (
                <button
                  onClick={() => (window.location.href = "/send")}
                  className="w-full inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm mb-4 shadow-sm"
                >
                  Launch App
                </button>
              )}
              {!hideConnectBtn && !isMiniApp && (
                <div className="pt-4 border-t border-gray-200">
                  <ConnectButton
                    showBalance={{
                      smallScreen: true,
                      largeScreen: false,
                    }}
                  />
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}

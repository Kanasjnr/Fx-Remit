"use client"

export default function Footer() {
  return (
    <footer className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Side - Company Info */}
          <div>
            <div className="flex items-center mb-6">
              <img 
                src="/logo.svg" 
                alt="FX Remit" 
                className="h-8 w-auto mr-3"
              />
              <span className="text-xl font-bold text-gray-900">FX Remit</span>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              Democratizing cross-border payments with blockchain technology. Send money globally with ultra low fees and lightning fast transactions.
            </p>
            <p className="text-orange-400 text-sm font-medium">
              Powered by Celo & Mento Protocol
            </p>
          </div>

          {/* Right Side - Links */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Send money
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Track transfer
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Exchange rates
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Support
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Help center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Contact us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            © 2025 FX - Remit. All rights reserved.
          </p>
        </div>

        {/* Watermark */}
        <div className="mt-8 text-center">
          <div className="inline-block opacity-5">
            <span className="text-6xl font-bold text-gray-400">FX Remit</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

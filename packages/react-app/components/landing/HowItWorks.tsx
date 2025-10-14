"use client"

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-24 bg-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="text-orange-300 text-sm font-semibold uppercase tracking-wider mb-4">
              LEARN ABOUT US
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">
              Here&apos;s how it works
            </h2>

            {/* Steps */}
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">01</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Connect wallet</h3>
                  <p className="text-blue-100">
                    Link your crypto wallet or create a new one in seconds.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">02</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Choose currencies</h3>
                  <p className="text-blue-100">
                    Select your sending and receiving currencies from our supported list.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">03</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Send instantly</h3>
                  <p className="text-blue-100">
                    Complete your transaction and watch it settle in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Circular Logo */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="w-80 h-80 bg-orange-400 rounded-full flex items-center justify-center">
                <img 
                  src="/logo.svg" 
                  alt="FX Remit" 
                  className="w-24 h-24 object-contain"
                />
              </div>
              {/* Rotating text around the circle */}
              <div className="absolute inset-0 w-80 h-80">
                <svg className="w-full h-full" viewBox="0 0 320 320">
                  <defs>
                    <path id="circle" d="M 160, 160 m -120, 0 a 120,120 0 1,1 240,0 a 120,120 0 1,1 -240,0" />
                  </defs>
                  <text className="text-white text-sm font-semibold">
                    <textPath href="#circle" className="animate-spin-slow">
                      FX Remit • FX Remit • FX Remit • FX Remit • FX Remit • FX Remit •
                    </textPath>
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

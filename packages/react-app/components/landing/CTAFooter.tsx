"use client"

import { useRouter } from "next/navigation"

export default function CTAFooter() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push("/send")
  }

  const handleLearnMore = () => {
    // Handle learn more action
    console.log("Learn more clicked")
  }

  return (
    <section className="relative py-16 sm:py-24 bg-gray-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <img 
          src="/blur and glass.svg" 
          alt="Background pattern" 
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-orange-400 text-sm font-semibold uppercase tracking-wider mb-4">
            TRY IT NOW
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to make global transactions?
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Join thousands of users who trust FX Remit for fast, secure and affordable cross-border payments.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGetStarted}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Get started now
            </button>
            <button
              onClick={handleLearnMore}
              className="border-2 border-orange-400 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-400 hover:text-white transition-colors"
            >
              Learn more
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

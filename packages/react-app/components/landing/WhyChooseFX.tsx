"use client"

export default function WhyChooseFX() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="text-orange-400 text-sm font-semibold uppercase tracking-wider mb-4">
            WHY US
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Why choose FX Remit?
          </h2>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Top Left - Send money to 15+ countries */}
          <div className="bg-blue-50 p-8 rounded-2xl">
            <div className="text-orange-400 text-sm font-semibold mb-2">
              Send money in
            </div>
            <div className="text-6xl font-bold text-blue-600 mb-4">
              15+
            </div>
            <p className="text-gray-600">
              countries where you can connect with millions of users around the globe through our expanding network of supported currencies.
            </p>
          </div>

          {/* Top Right - Instant withdrawal */}
          <div className="bg-blue-50 p-8 rounded-2xl">
            <h3 className="text-xl font-semibold text-blue-600 mb-4">
              Instant withdrawal of your funds at any time
            </h3>
          </div>

          {/* Bottom Left - Ultra low fees */}
          <div className="bg-blue-50 p-8 rounded-2xl relative overflow-hidden">
            <h3 className="text-xl font-semibold text-blue-600 mb-2">
              Ultra low fees
            </h3>
            <p className="text-gray-600">
              Pay only 1.5% compared to traditional services that charge 7-10%. Save up to 85% on every transfer.
            </p>
            
            {/* Child illustration */}
            <div className="absolute bottom-0 right-0 w-32 h-32">
              <img 
                src="/child.svg" 
                alt="Happy child" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Bottom Right - Empty card with illustration */}
          <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/child.svg" 
                alt="Happy child" 
                className="w-48 h-48 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

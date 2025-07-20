"use client"

import { useEffect, useState } from "react"

export default function WorldMap() {
  const [connections, setConnections] = useState<Array<{ id: number; delay: number }>>([])

  useEffect(() => {
    // Create animated connection lines
    const connectionData = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: i * 0.5,
    }))
    setConnections(connectionData)
  }, [])

  return (
    <div className="relative w-full h-96 bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden">
      {/* World Map Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 800 400" className="w-full h-full opacity-20" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Simplified world map paths */}
          <path
            d="M150 200 Q200 180 250 200 Q300 220 350 200 Q400 180 450 200"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-600"
          />
          <path
            d="M100 150 Q150 130 200 150 Q250 170 300 150"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-600"
          />
          <path
            d="M500 180 Q550 160 600 180 Q650 200 700 180"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-600"
          />
        </svg>
      </div>

      {/* Connection Points */}
      <div className="absolute inset-0">
        {/* Center Hub */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
          <div className="absolute inset-0 w-4 h-4 bg-emerald-500/30 rounded-full animate-ping"></div>
        </div>

        {/* Connection Points */}
        {[
          { top: "20%", left: "15%", flag: "🇺🇸" },
          { top: "25%", left: "45%", flag: "🇪🇺" },
          { top: "30%", left: "55%", flag: "🇬🇧" },
          { top: "45%", left: "25%", flag: "🇧🇷" },
          { top: "40%", left: "70%", flag: "🇳🇬" },
          { top: "35%", left: "75%", flag: "🇰🇪" },
          { top: "25%", left: "85%", flag: "🇯🇵" },
          { top: "60%", left: "85%", flag: "🇵🇭" },
        ].map((point, index) => (
          <div
            key={index}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ top: point.top, left: point.left }}
          >
            <div className="relative">
              <div className="w-8 h-8 bg-slate-700 rounded-full border-2 border-emerald-500/50 flex items-center justify-center hover:border-emerald-500 transition-colors cursor-pointer">
                <span className="text-sm">{point.flag}</span>
              </div>
              <div className="absolute inset-0 w-8 h-8 bg-emerald-500/20 rounded-full animate-ping"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Animated Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
            <stop offset="50%" stopColor="rgb(16, 185, 129)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {connections.map((connection) => (
          <g key={connection.id}>
            <line
              x1="50%"
              y1="50%"
              x2={`${20 + connection.id * 10}%`}
              y2={`${30 + connection.id * 5}%`}
              stroke="url(#connectionGradient)"
              strokeWidth="2"
              className="animate-pulse"
              style={{ animationDelay: `${connection.delay}s` }}
            />
          </g>
        ))}
      </svg>

      {/* Overlay Text */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
          <div className="text-white font-semibold mb-1">Global Network</div>
          <div className="text-slate-300 text-sm">Connected to 15+ countries worldwide</div>
        </div>
      </div>
    </div>
  )
}

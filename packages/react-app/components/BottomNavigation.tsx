"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Send, History, User } from "lucide-react"

export default function BottomNavigation() {
  const pathname = usePathname()

  const tabs = [
    {
      name: "Send",
      href: "/send",
      icon: Send,
    },
    {
      name: "History",
      href: "/history",
      icon: History,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-4 py-3 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex flex-col items-center space-y-1 px-6 py-3 rounded-xl transition-all duration-200 ${
                  isActive(tab.href)
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <IconComponent className="w-6 h-6" />
                <span className="text-sm font-semibold">{tab.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

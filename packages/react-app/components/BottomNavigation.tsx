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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 shadow-lg">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                  isActive(tab.href)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

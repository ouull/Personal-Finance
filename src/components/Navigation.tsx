"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, HandCoins, TrendingUp, RefreshCw, LogOut, ReceiptText, Target, FolderOpen, Settings, User } from "lucide-react"
import { signOut } from "next-auth/react"
import { NotificationCenter } from "./NotificationCenter"

export function Navigation({ translations }: { translations?: Record<string, string> }) {
  const pathname = usePathname()
  
  if (pathname.startsWith("/auth")) return null

  const t = translations || {}

  const navItems = [
    { name: t.dashboard || "Dashboard", href: "/", icon: LayoutDashboard },
    { name: t.transactions || "Transactions", href: "/transactions", icon: ReceiptText },
    { name: t.lending || "Lending", href: "/lending", icon: HandCoins },
    { name: t.investments || "Investments", href: "/investments", icon: TrendingUp },
    { name: t.recurring || "Recurring", href: "/recurring", icon: RefreshCw },
    { name: t.goals || "Goals", href: "/goals", icon: Target },
    { name: t.categories || "Categories", href: "/categories", icon: FolderOpen },
  ]

  const accountItems = [
    { name: t.profile || "Profile", href: "/profile", icon: User },
    { name: t.settings || "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <nav className="flex items-center justify-between gap-4 mb-8 bg-white/50 p-2 rounded-2xl backdrop-blur-md border border-white/60 shadow-sm overflow-hidden">
      <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 pb-1 -mb-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ${
                isActive 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          )
        })}
      </div>
      
      <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
        {accountItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ${
                isActive 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden lg:inline">{item.name}</span>
            </Link>
          )
        })}
        <NotificationCenter />
        <button 
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t.signOut || "Sign Out"}</span>
        </button>
      </div>
    </nav>
  )
}

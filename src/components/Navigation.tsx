"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HandCoins,
  TrendingUp,
  RefreshCw,
  LogOut,
  ReceiptText,
  Target,
  FolderOpen,
  Settings,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { NotificationCenter } from "./NotificationCenter";
import { useCurrency } from "@/lib/CurrencyContext";

export function Navigation({
  translations,
}: {
  translations?: Record<string, string>;
}) {
  const pathname = usePathname();
  const { hideBalances, toggleHideBalances } = useCurrency();

  if (pathname.startsWith("/auth")) return null;

  const t = translations || {};

  const navItems = [
    { name: t.dashboard || "Dashboard", href: "/", icon: LayoutDashboard },
    {
      name: t.transactions || "Transactions",
      href: "/transactions",
      icon: ReceiptText,
    },
    { name: t.lending || "Lending", href: "/lending", icon: HandCoins },
    {
      name: t.investments || "Investments",
      href: "/investments",
      icon: TrendingUp,
    },
    { name: t.recurring || "Recurring", href: "/recurring", icon: RefreshCw },
    { name: t.goals || "Goals", href: "/goals", icon: Target },
    {
      name: t.categories || "Categories",
      href: "/categories",
      icon: FolderOpen,
    },
  ];

  const accountItems = [
    { name: t.profile || "Profile", href: "/profile", icon: User },
    { name: t.settings || "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 relative">
      {/* App Logo */}
      <div className="p-8 pb-6 flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-black text-slate-900 text-lg leading-tight tracking-tight">
            Personal Finance
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[15px] font-semibold transition-all group overflow-hidden ${
                isActive
                  ? "text-blue-600 bg-blue-50/50"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicatorSidebar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-blue-600 rounded-r-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon
                className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"} transition-colors`}
              />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="p-6 pt-2 flex flex-col gap-4">
        <div className="flex flex-col gap-1 mt-2">
          {accountItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[14px] font-semibold transition-colors ${
                  isActive
                    ? "text-slate-900 bg-slate-50"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-[18px] h-[18px] text-slate-400" />
                {item.name}
              </Link>
            );
          })}
          <button
            onClick={toggleHideBalances}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[14px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left w-full"
          >
            {hideBalances ? (
              <EyeOff className="w-[18px] h-[18px] text-slate-400" />
            ) : (
              <Eye className="w-[18px] h-[18px] text-slate-400" />
            )}
            {hideBalances ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[14px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors text-left w-full mt-2"
          >
            <LogOut className="w-[18px] h-[18px]" />
            {t.signOut || "Keluar"}
          </button>
        </div>
      </div>
    </aside>
  );
}

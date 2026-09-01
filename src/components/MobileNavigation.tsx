"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HandCoins,
  TrendingUp,
  RefreshCw,
  Target,
  MoreHorizontal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReceiptText, FolderOpen, User, Settings, LogOut, Eye, EyeOff } from "lucide-react";
import { signOut } from "next-auth/react";
import { useCurrency } from "@/lib/CurrencyContext";

export function MobileNavigation({
  translations,
}: {
  translations?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { hideBalances, toggleHideBalances } = useCurrency();
  
  if (pathname.startsWith("/auth")) return null;

  const t = translations || {};

  const mainItems = [
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
  ];

  const moreItems = [
    { name: t.recurring || "Recurring", href: "/recurring", icon: RefreshCw },
    { name: t.goals || "Goals", href: "/goals", icon: Target },
    {
      name: t.categories || "Categories",
      href: "/categories",
      icon: FolderOpen,
    },
    { name: t.profile || "Profile", href: "/profile", icon: User },
    { name: t.settings || "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-around px-2 py-2">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[64px] ${
                isActive
                  ? "text-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div
                className={`p-1 rounded-xl ${isActive ? "bg-blue-50" : ""}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">{item.name}</span>
            </Link>
          );
        })}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <button className="flex flex-col items-center gap-1 p-2 rounded-xl min-w-[64px] text-slate-400 hover:text-slate-600">
                <div className="p-1 rounded-xl">
                  <MoreHorizontal className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold">{t.more || "Lainnya"}</span>
              </button>
            }
          />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="text-left">
              <DialogTitle>{t.menu || "Menu Utama"}</DialogTitle>
            </DialogHeader>
            <div className="p-4 grid grid-cols-4 gap-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center gap-2 text-center"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium leading-tight text-slate-600">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
              
              <button
                onClick={toggleHideBalances}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                  {hideBalances ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </div>
                <span className="text-[11px] font-medium leading-tight text-slate-600">
                  {hideBalances ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
                </span>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium leading-tight text-red-600">
                  {t.signOut || "Keluar"}
                </span>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

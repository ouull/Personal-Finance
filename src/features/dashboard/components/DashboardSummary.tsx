"use client";

import { FadeIn } from "@/components/MotionWrapper";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { Wallet, TrendingUp, ArrowDownUp, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { useCurrency } from "@/lib/CurrencyContext";

export function DashboardSummary({
  t,
  netWorthData,
  currentMonthData,
}: {
  t: any;
  netWorthData: any;
  currentMonthData: {
    income: number;
    expense: number;
  };
}) {
  const { hideBalances, toggleHideBalances } = useCurrency();

  return (
    <FadeIn delay={0.2}>
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-5 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between group gap-6 w-full">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

        <div className="relative z-10 w-full xl:w-auto">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-medium text-indigo-200/80 uppercase tracking-widest">
              {t.dashboard.netWorth}
            </h2>
            <button
              onClick={toggleHideBalances}
              className="text-indigo-200/60 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
              title={hideBalances ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
            >
              {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-4xl sm:text-5xl lg:text-6xl font-black mt-2 text-white tracking-tighter drop-shadow-sm">
            <CurrencyDisplay amount={netWorthData?.netWorth || 0} />
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 mt-6">
            <div className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <ArrowUp className="w-3 h-3 text-green-400" />
              <span className="text-sm font-medium text-green-100">
                {t.transactionsPage?.income || "In"}:{" "}
                <CurrencyDisplay amount={currentMonthData.income} />
              </span>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <ArrowDown className="w-3 h-3 text-red-400" />
              <span className="text-sm font-medium text-red-100">
                {t.transactionsPage?.expense || "Out"}:{" "}
                <CurrencyDisplay amount={currentMonthData.expense} />
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3 sm:gap-4 xl:justify-end w-full xl:w-auto">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 sm:p-4 rounded-xl text-white grow basis-[140px] flex flex-col justify-center">
            <div className="text-xs text-indigo-200 mb-1 flex items-center gap-1">
              <ArrowDownUp className="w-3 h-3 shrink-0" /> <span>{t.dashboard.lentOut}</span>
            </div>
            <div className="text-base sm:text-lg font-bold">
              <CurrencyDisplay amount={netWorthData?.totalReceivables || 0} />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 sm:p-4 rounded-xl text-white grow basis-[140px] flex flex-col justify-center">
            <div className="text-xs text-indigo-200 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 shrink-0" /> <span>{t.dashboard.invested}</span>
            </div>
            <div className="text-base sm:text-lg font-bold">
              <CurrencyDisplay amount={netWorthData?.totalInvestments || 0} />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-3 sm:p-4 rounded-xl text-white grow basis-[140px] flex flex-col justify-center">
            <div className="text-xs text-indigo-200 mb-1 flex items-center gap-1">
              <Wallet className="w-3 h-3 shrink-0" /> <span>{t.dashboard.availableCash}</span>
            </div>
            <div className="text-base sm:text-lg font-bold">
              <CurrencyDisplay amount={netWorthData?.totalCash || 0} />
            </div>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}

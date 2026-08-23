import { getAccounts } from "@/features/accounts/actions"
import { getRecentTransactions } from "@/features/transactions/actions"
import { getCashFlowData, getComprehensiveAnalytics } from "@/features/analytics/actions"
import { getGoals } from "@/features/goals/actions"
import { AccountList } from "@/features/accounts/components/AccountList"
import { AccountDialog } from "@/features/accounts/components/AccountDialog"
import { TransactionDialog } from "@/features/transactions/components/TransactionDialog"
import { TransactionList } from "@/features/transactions/components/TransactionList"
import { CashFlowChart } from "@/features/analytics/components/CashFlowChart"
import { SpendingChart } from "@/features/analytics/components/SpendingChart"
import { AccountDistributionChart } from "@/features/analytics/components/AccountDistributionChart"
import { GoalList } from "@/features/goals/components/GoalList"
import { Button } from "@/components/ui/button"
import { ArrowRight, Target } from "lucide-react"
import Link from "next/link"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/MotionWrapper"

export default async function DashboardPage() {
  const [accountsResult, txResult, cashFlowResult, goalsResult, compAnalyticsResult] = await Promise.all([
    getAccounts(),
    getRecentTransactions(5),
    getCashFlowData(),
    getGoals(),
    getComprehensiveAnalytics()
  ])
  
  const accounts = accountsResult.success ? accountsResult.data || [] : []
  const recentTransactions = txResult.success ? txResult.data || [] : []
  const cashFlowData = cashFlowResult.success ? cashFlowResult.data || [] : []
  const goals = goalsResult.success ? goalsResult.data || [] : []
  
  const spendingByCategoryData = compAnalyticsResult.success ? compAnalyticsResult.data?.spendingByCategory || [] : []
  const accountDistributionData = compAnalyticsResult.success ? compAnalyticsResult.data?.accountDistribution || [] : []

  const totalBalance = accounts.reduce((acc: number, account: any) => {
    return acc + Number(account.balance)
  }, 0)

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-8 pb-10">
      <FadeIn delay={0.1}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-transparent pb-1">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-lg font-medium">
              A summary of your financial status today.
            </p>
          </div>
          <div className="flex gap-2 bg-white/50 p-2 rounded-2xl backdrop-blur-md border border-white/60 shadow-sm">
            <TransactionDialog accounts={accounts} />
          </div>
        </header>
      </FadeIn>

      {/* Net Worth Summary */}
      <FadeIn delay={0.2}>
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-8 rounded-3xl border border-indigo-500/20 shadow-2xl flex items-center justify-between group">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
          <div className="relative z-10">
            <h2 className="text-sm font-medium text-indigo-200/80 uppercase tracking-widest mb-2">Net Worth</h2>
            <div className="text-5xl md:text-6xl font-black mt-2 text-white tracking-tighter drop-shadow-sm">
              {formatRupiah(totalBalance)}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Main Grid Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cash Flow Chart */}
          <FadeIn delay={0.3}>
            <section>
              <CashFlowChart data={cashFlowData} />
            </section>
          </FadeIn>

          {/* Additional Analytics Charts */}
          <FadeIn delay={0.4}>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SpendingChart data={spendingByCategoryData} />
              <AccountDistributionChart data={accountDistributionData} />
            </section>
          </FadeIn>

          {/* Accounts Section */}
          <FadeIn delay={0.5}>
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-800">Accounts</h2>
                <AccountDialog />
              </div>
              <AccountList accounts={accounts} />
            </section>
          </FadeIn>
        </div>

        {/* Right Column (Narrow) */}
        <div className="space-y-10">
          {/* Goals Section */}
          <FadeIn delay={0.6}>
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" /> Financial Goals
                </h2>
              </div>
              <GoalList goals={goals} />
            </section>
          </FadeIn>

          {/* Recent Transactions Section */}
          <FadeIn delay={0.7}>
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-800">Recent Transactions</h2>
              </div>
              <TransactionList transactions={recentTransactions} accounts={accounts} />
            </section>
          </FadeIn>
        </div>

      </div>
    </div>
  )
}

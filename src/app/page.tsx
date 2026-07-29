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

  const totalBalance = accounts.reduce((acc, account) => {
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Ringkasan kondisi finansial Anda hari ini.
          </p>
        </div>
        <div className="flex gap-2">
          <TransactionDialog accounts={accounts} />
        </div>
      </header>

      {/* Net Worth Summary */}
      <section className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Kekayaan Bersih</h2>
          <div className="text-4xl font-extrabold mt-2 text-slate-900 tracking-tight">
            {formatRupiah(totalBalance)}
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cash Flow Chart */}
          <section>
            <CashFlowChart data={cashFlowData} />
          </section>

          {/* Additional Analytics Charts */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SpendingChart data={spendingByCategoryData} />
            <AccountDistributionChart data={accountDistributionData} />
          </section>

          {/* Accounts Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Daftar Akun</h2>
              <AccountDialog />
            </div>
            <AccountList accounts={accounts} />
          </section>
        </div>

        {/* Right Column (Narrow) */}
        <div className="space-y-8">
          {/* Goals Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Target Finansial
              </h2>
            </div>
            <GoalList goals={goals} />
          </section>

          {/* Recent Transactions Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Transaksi Terbaru</h2>
            </div>
            <TransactionList transactions={recentTransactions} accounts={accounts} />
          </section>
        </div>

      </div>
    </div>
  )
}

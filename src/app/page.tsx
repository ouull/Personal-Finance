import { getAccounts } from "@/features/accounts/actions"
import { getRecentTransactions } from "@/features/transactions/actions"
import { getCashFlowData, getComprehensiveAnalytics, getNetWorth } from "@/features/analytics/actions"
import { getGoals } from "@/features/goals/actions"
import { getLoans } from "@/features/lending/actions"
import { getRecurringPayments } from "@/features/recurring/actions"
import { AccountList } from "@/features/accounts/components/AccountList"
import { AccountDialog } from "@/features/accounts/components/AccountDialog"
import { TransactionDialog } from "@/features/transactions/components/TransactionDialog"
import { TransactionList } from "@/features/transactions/components/TransactionList"
import { SpendingChart } from "@/features/analytics/components/SpendingChart"
import { AccountDistributionChart } from "@/features/analytics/components/AccountDistributionChart"
import { GoalList } from "@/features/goals/components/GoalList"
import { GoalDialog } from "@/features/goals/components/GoalDialog"
import { Target, TrendingUp, Wallet, ArrowDownUp, RefreshCw, HandCoins, ArrowDown, ArrowUp } from "lucide-react"
import { FadeIn } from "@/components/MotionWrapper"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { differenceInDays, format } from "date-fns"
import { getTranslation } from "@/lib/i18n"

export default async function DashboardPage() {
  const { t } = await getTranslation();
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const [
    accountsResult, 
    txResult, 
    cashFlowResult, 
    goalsResult, 
    compAnalyticsResult, 
    netWorthResult,
    loansResult,
    recurringResult,
    categoriesResult,
    frequentCategoriesResult
  ] = await Promise.all([
    getAccounts(true),
    getRecentTransactions(5),
    getCashFlowData(),
    getGoals(),
    getComprehensiveAnalytics(),
    getNetWorth(),
    getLoans(),
    getRecurringPayments(),
    import("@/features/categories/actions").then(m => m.getCategories(undefined, false)),
    import("@/features/categories/actions").then(m => m.getFrequentCategories(4))
  ])
  
  const allAccounts = accountsResult.success ? accountsResult.data || [] : []
  const accounts = allAccounts.filter((a: any) => a.isActive)
  const recentTransactions = txResult.success ? txResult.data || [] : []
  const cashFlowData = cashFlowResult.success ? cashFlowResult.data || [] : []
  const goals = goalsResult.success ? goalsResult.data || [] : []
  const categories = categoriesResult.success ? categoriesResult.data || [] : []
  const frequentCategories = frequentCategoriesResult.success ? frequentCategoriesResult.data || [] : []
  
  const spendingByCategoryData = compAnalyticsResult.success ? compAnalyticsResult.data?.spendingByCategory || [] : []
  const accountDistributionData = compAnalyticsResult.success ? compAnalyticsResult.data?.accountDistribution || [] : []
  const topCategory = compAnalyticsResult.success ? compAnalyticsResult.data?.topCategory : null
  const totalExpense = compAnalyticsResult.success ? compAnalyticsResult.data?.totalExpense : 0

  const netWorthData = netWorthResult.success ? netWorthResult.data : { netWorth: 0, totalCash: 0, totalReceivables: 0, totalInvestments: 0 }

  const loans = loansResult.success ? loansResult.data || [] : []
  const outstandingLoans = loans.filter((l: any) => l.remainingAmount > 0).slice(0, 3) // Top 3

  const recurring = recurringResult.success ? recurringResult.data || [] : []
  const upcomingPayments = recurring
    .filter((p: any) => {
      if (p.status !== "ACTIVE") return false
      const days = differenceInDays(new Date(p.nextDueDate), new Date())
      return days <= 30 // Upcoming in next 30 days (including overdue)
    })
    .sort((a: any, b: any) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
    .slice(0, 5) // Top 5

  // Get current month income/expense from cashFlowData (last item)
  const currentMonthData = cashFlowData.length > 0 ? cashFlowData[cashFlowData.length - 1] : { income: 0, expense: 0 }

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
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-transparent pb-1">{t.dashboard.title}</h1>
            <p className="text-muted-foreground mt-1 text-lg font-medium">
              {t.dashboard.greeting.replace("{name}", session.user.name!)}
            </p>
          </div>
          <div className="flex gap-2 bg-white/50 p-2 rounded-2xl backdrop-blur-md border border-white/60 shadow-sm">
            <TransactionDialog accounts={accounts} categories={categories} groupTranslations={(t as any).groups || {}} />
          </div>
        </header>
      </FadeIn>

      {/* Net Worth Summary */}
      <FadeIn delay={0.2}>
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-8 rounded-3xl border border-indigo-500/20 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between group gap-6">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <h2 className="text-sm font-medium text-indigo-200/80 uppercase tracking-widest mb-2">{t.dashboard.netWorth}</h2>
            <div className="text-5xl md:text-6xl font-black mt-2 text-white tracking-tighter drop-shadow-sm">
              {formatRupiah(netWorthData?.netWorth || 0)}
            </div>
            
            <div className="flex gap-4 mt-6">
              <div className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <ArrowUp className="w-3 h-3 text-green-400" />
                <span className="text-sm font-medium text-green-100">{t.transactionsPage?.income || "In"}: {formatRupiah(currentMonthData.income)}</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <ArrowDown className="w-3 h-3 text-red-400" />
                <span className="text-sm font-medium text-red-100">{t.transactionsPage?.expense || "Out"}: {formatRupiah(currentMonthData.expense)}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-4 md:justify-end">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl text-white">
              <div className="text-xs text-indigo-200 mb-1 flex items-center gap-1"><Wallet className="w-3 h-3" /> {t.dashboard.availableCash}</div>
              <div className="text-lg font-bold">{formatRupiah(netWorthData?.totalCash || 0)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl text-white">
              <div className="text-xs text-indigo-200 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {t.dashboard.invested}</div>
              <div className="text-lg font-bold">{formatRupiah(netWorthData?.totalInvestments || 0)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl text-white">
              <div className="text-xs text-indigo-200 mb-1 flex items-center gap-1"><ArrowDownUp className="w-3 h-3" /> {t.dashboard.lentOut}</div>
              <div className="text-lg font-bold">{formatRupiah(netWorthData?.totalReceivables || 0)}</div>
            </div>
          </div>
        </section>
      </FadeIn>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          <FadeIn delay={0.3}>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-4">
                {topCategory && (
                  <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Top Spending</h3>
                      <p className="text-lg font-black text-indigo-900">
                        {topCategory.slug && (t as any).categories?.[topCategory.slug] 
                          ? (t as any).categories[topCategory.slug] 
                          : topCategory.name}
                      </p>
                      <p className="text-sm font-medium text-indigo-700 mt-1">{topCategory.percentage.toFixed(1)}% of expenses</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-indigo-900">{formatRupiah(topCategory.value)}</p>
                    </div>
                  </div>
                )}
                <SpendingChart 
                  data={spendingByCategoryData} 
                  categoryTranslations={(t as any).categories || {}} 
                />
              </div>
              <AccountDistributionChart data={accountDistributionData} />
            </section>
          </FadeIn>

          <FadeIn delay={0.4}>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming Payments */}
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-500" /> {t.dashboard?.upcomingPayments || "Upcoming Payments"}
                </h3>
                {upcomingPayments.length === 0 ? (
                  <p className="text-sm text-slate-500">{t.dashboard?.noUpcomingPayments || "No upcoming payments in the next 14 days."}</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingPayments.map((payment: any) => (
                      <div key={payment.id} className="flex justify-between items-center pb-4 border-b last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{payment.name}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(payment.nextDueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <p className="font-bold text-slate-800 text-sm">{formatRupiah(payment.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outstanding Loans */}
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <HandCoins className="w-4 h-4 text-indigo-500" /> {t.dashboard?.outstandingLoans || "Outstanding Loans"}
                </h3>
                {outstandingLoans.length === 0 ? (
                  <p className="text-sm text-slate-500">{t.dashboard?.noOutstandingLoans || "No outstanding loans right now."}</p>
                ) : (
                  <div className="space-y-3">
                    {outstandingLoans.map((l: any) => (
                      <div key={l.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium text-slate-800">{l.borrowerName}</p>
                          <p className="text-xs text-slate-500">
                            {l.status === "OVERDUE" ? "Overdue" : "Pending"}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900">{formatRupiah(l.remainingAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </FadeIn>

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

        {/* Right Column */}
        <div className="space-y-10">
          <FadeIn delay={0.6}>
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" /> Financial Goals
                </h2>
                <GoalDialog />
              </div>
              <GoalList goals={goals} />
            </section>
          </FadeIn>

          <FadeIn delay={0.7}>
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-800">{t.dashboard.recentTransactions}</h2>
              </div>
              <TransactionList transactions={recentTransactions} accounts={allAccounts} categories={categories} groupTranslations={(t as any).groups || {}} />
            </section>
          </FadeIn>
        </div>

      </div>
    </div>
  )
}

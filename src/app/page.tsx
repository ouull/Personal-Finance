import { getAccounts } from "@/features/accounts/actions";
import { getRecentTransactions } from "@/features/transactions/actions";
import {
  getCashFlowData,
  getComprehensiveAnalytics,
  getNetWorth,
} from "@/features/analytics/actions";
import { getGoals } from "@/features/goals/actions";
import { getLoans } from "@/features/lending/actions";
import { getRecurringPayments } from "@/features/recurring/actions";
import { AccountList } from "@/features/accounts/components/AccountList";
import { AccountDialog } from "@/features/accounts/components/AccountDialog";
import { TransactionDialog } from "@/features/transactions/components/TransactionDialog";
import { TransactionList } from "@/features/transactions/components/TransactionList";
import { SpendingChart } from "@/features/analytics/components/SpendingChart";
import { AccountDistributionChart } from "@/features/analytics/components/AccountDistributionChart";
import { GoalList } from "@/features/goals/components/GoalList";
import { GoalDialog } from "@/features/goals/components/GoalDialog";
import { DashboardSummary } from "@/features/dashboard/components/DashboardSummary";
import { DashboardReminders } from "@/features/dashboard/components/DashboardReminders";
import {
  Target,
  TrendingUp,
  Wallet,
  ArrowDownUp,
  RefreshCw,
  HandCoins,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { FadeIn } from "@/components/MotionWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { differenceInDays, format } from "date-fns";
import { getTranslation } from "@/lib/i18n";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";

export default async function DashboardPage() {
  const { t } = await getTranslation();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
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
    frequentCategoriesResult,
  ] = await Promise.all([
    getAccounts(true),
    getRecentTransactions(5),
    getCashFlowData(),
    getGoals(),
    getComprehensiveAnalytics(),
    getNetWorth(),
    getLoans(),
    getRecurringPayments(),
    import("@/features/categories/actions").then((m) =>
      m.getCategories(undefined, false),
    ),
    import("@/features/categories/actions").then((m) =>
      m.getFrequentCategories(4),
    ),
  ]);

  const allAccounts = accountsResult.success ? accountsResult.data || [] : [];
  const accounts = allAccounts.filter((a: any) => a.isActive);
  const recentTransactions = txResult.success ? txResult.data || [] : [];
  const cashFlowData = cashFlowResult.success ? cashFlowResult.data || [] : [];
  const goals = goalsResult.success ? goalsResult.data || [] : [];
  const categories = categoriesResult.success
    ? categoriesResult.data || []
    : [];
  const frequentCategories = frequentCategoriesResult.success
    ? frequentCategoriesResult.data || []
    : [];

  const spendingByCategoryData = compAnalyticsResult.success
    ? compAnalyticsResult.data?.spendingByCategory || []
    : [];
  const accountDistributionData = compAnalyticsResult.success
    ? compAnalyticsResult.data?.accountDistribution || []
    : [];
  const topCategory = compAnalyticsResult.success
    ? compAnalyticsResult.data?.topCategory
    : null;
  const totalExpense = compAnalyticsResult.success
    ? compAnalyticsResult.data?.totalExpense
    : 0;

  const netWorthData = netWorthResult.success
    ? netWorthResult.data
    : { netWorth: 0, totalCash: 0, totalReceivables: 0, totalInvestments: 0 };

  const loans = loansResult.success ? loansResult.data || [] : [];
  const outstandingLoans = loans
    .filter((l: any) => l.remainingAmount > 0)
    .slice(0, 3); // Top 3

  const recurring = recurringResult.success ? recurringResult.data || [] : [];
  const upcomingPayments = recurring
    .filter((p: any) => {
      if (p.status !== "ACTIVE") return false;
      const days = differenceInDays(new Date(p.nextDueDate), new Date());
      return days <= 30; // Upcoming in next 30 days (including overdue)
    })
    .sort(
      (a: any, b: any) =>
        new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime(),
    )
    .slice(0, 5); // Top 5

  // Get current month income/expense from cashFlowData (last item)
  const currentMonthData =
    cashFlowData.length > 0
      ? cashFlowData[cashFlowData.length - 1]
      : { income: 0, expense: 0 };

  // Dynamic greeting based on server time (approximation)
  const hour = new Date().getHours();
  let greeting = t.dashboard.greeting.replace("{name}", session.user.name!);
  if (hour >= 4 && hour < 11)
    greeting =
      ((t.dashboard as any).goodMorning || "Good Morning") +
      ", " +
      session.user.name;
  else if (hour >= 11 && hour < 15)
    greeting =
      ((t.dashboard as any).goodAfternoon || "Good Afternoon") +
      ", " +
      session.user.name;
  else if (hour >= 15 && hour < 18)
    greeting =
      ((t.dashboard as any).goodLateAfternoon || "Good Afternoon") +
      ", " +
      session.user.name;
  else
    greeting =
      ((t.dashboard as any).goodEvening || "Good Evening") +
      ", " +
      session.user.name;

  return (
    <div className="space-y-8 pb-10">
      <FadeIn delay={0.1}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-transparent pb-1">
              {t.dashboard.title}
            </h1>
            <p className="text-muted-foreground mt-1 text-lg font-medium">
              {greeting}
            </p>
          </div>
          <div className="flex gap-2 bg-white/50 p-2 rounded-2xl backdrop-blur-md border border-white/60 shadow-sm">
            <TransactionDialog
              accounts={accounts}
              categories={categories}
              groupTranslations={(t as any).groups || {}}
            />
          </div>
        </header>
      </FadeIn>

      {/* Net Worth Summary */}
      <DashboardSummary
        t={t}
        netWorthData={netWorthData}
        currentMonthData={currentMonthData}
      />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8 min-w-0">
          <FadeIn delay={0.3}>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-4 min-w-0">
                {topCategory && (
                  <div className="bg-indigo-50 p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between gap-2 overflow-hidden">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 truncate">
                        Top Spending
                      </h3>
                      <p className="text-lg font-black text-indigo-900 truncate">
                        {topCategory.slug &&
                        (t as any).categories?.[topCategory.slug]
                          ? (t as any).categories[topCategory.slug]
                          : topCategory.name}
                      </p>
                      <p className="text-sm font-medium text-indigo-700 mt-1">
                        {topCategory.percentage.toFixed(1)}% of expenses
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg sm:text-xl font-bold text-indigo-900">
                        <CurrencyDisplay amount={topCategory.value} />
                      </p>
                    </div>
                  </div>
                )}
                <AccountDistributionChart data={accountDistributionData} />
              </div>
              <div className="h-full flex flex-col min-w-0">
                <SpendingChart
                  data={spendingByCategoryData}
                  categoryTranslations={(t as any).categories || {}}
                  className="h-full"
                />
              </div>
            </section>
          </FadeIn>

          <DashboardReminders
            t={t}
            upcomingPayments={upcomingPayments}
            outstandingLoans={outstandingLoans}
          />

          <FadeIn delay={0.5}>
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-800 shrink-0">
                  {t.dashboard.recentTransactions}
                </h2>
              </div>
              <TransactionList
                transactions={recentTransactions}
                accounts={allAccounts}
                categories={categories}
                groupTranslations={(t as any).groups || {}}
                hideHeader={true}
              />
            </section>
          </FadeIn>
        </div>

        {/* Right Column */}
        <div className="space-y-10">
          <FadeIn delay={0.6}>
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2 shrink-0">
                  <Target className="w-6 h-6 text-indigo-600" /> Financial Goals
                </h2>
                <GoalDialog />
              </div>
              <GoalList goals={goals} />
            </section>
          </FadeIn>

          <FadeIn delay={0.7}>
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-800">
                  Accounts
                </h2>
                <AccountDialog />
              </div>
              <AccountList accounts={accounts} />
            </section>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

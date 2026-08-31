import { getRecurringPayments } from "@/features/recurring/actions"
import { getAccounts } from "@/features/accounts/actions"
import { getCategories } from "@/features/categories/actions"
import { RecurringPaymentList } from "@/features/recurring/components/RecurringPaymentList"
import { FadeIn } from "@/components/MotionWrapper"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RefreshCw, CalendarClock, CreditCard } from "lucide-react"
import { getTranslation } from "@/lib/i18n"
import { useCurrency } from "@/lib/CurrencyContext"

export default async function RecurringPage() {
  const { t } = await getTranslation()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const [paymentsResult, accountsResult, categoriesResult] = await Promise.all([
    getRecurringPayments(),
    getAccounts(),
    getCategories()
  ])

  const payments = paymentsResult.success ? paymentsResult.data || [] : []
  const accounts = accountsResult.success ? accountsResult.data || [] : []
  const categories = categoriesResult.success ? categoriesResult.data || [] : []

  const activeSubscriptionsCount = payments.filter((p: any) => p.type === "SUBSCRIPTION").length
  
  // Calculate monthly commitments roughly (normalizing weekly and yearly)
  const monthlyCommitments = payments.reduce((sum: number, p: any) => {
    let monthlyAmount = p.amount
    if (p.billingCycle === "WEEKLY") monthlyAmount = p.amount * 4.33
    if (p.billingCycle === "QUARTERLY") monthlyAmount = p.amount / 3
    if (p.billingCycle === "YEARLY") monthlyAmount = p.amount / 12
    return sum + monthlyAmount
  }, 0)

  const dueThisWeek = payments.reduce((sum: number, p: any) => {
    const dueDate = new Date(p.nextDueDate)
    const diffTime = dueDate.getTime() - new Date().getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays <= 7 && diffDays >= -30) {
      return sum + p.amount
    }
    return sum
  }, 0)

  const { formatRupiah } = useCurrency()

  return (
    <div className="space-y-8 pb-10">
      <FadeIn delay={0.1}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 pb-1">{t.recurringPage?.title || "Recurring"}</h1>
            <p className="text-muted-foreground mt-1 text-base">
              {t.recurringPage?.description || "Manage your bills, subscriptions, and recurring expenses."}
            </p>
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-500" /> {t.recurringPage?.monthlyCommitments || "Monthly Commitments"}
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">~{formatRupiah(monthlyCommitments)}</div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between">
            <div className="text-sm font-medium text-amber-600 flex items-center gap-2">
              <CalendarClock className="w-4 h-4" /> {t.recurringPage?.dueThisWeek || "Due This Week"}
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-2">{formatRupiah(dueThisWeek)}</div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-500" /> {t.recurringPage?.activeSubscriptions || "Active Subscriptions"}
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{activeSubscriptionsCount}</div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <RecurringPaymentList payments={payments} accounts={accounts} categories={categories} />
      </FadeIn>
    </div>
  )
}

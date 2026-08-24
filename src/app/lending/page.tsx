import { getLoans } from "@/features/lending/actions"
import { getAccounts } from "@/features/accounts/actions"
import { LoanList } from "@/features/lending/components/LoanList"
import { FadeIn } from "@/components/MotionWrapper"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { HandCoins, UserMinus, Clock } from "lucide-react"
import { getTranslation } from "@/lib/i18n"

export default async function LendingPage() {
  const { t } = await getTranslation()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const [loansResult, accountsResult] = await Promise.all([
    getLoans(),
    getAccounts()
  ])

  const loans = loansResult.success ? loansResult.data || [] : []
  const accounts = accountsResult.success ? accountsResult.data || [] : []

  const totalLent = loans.reduce((sum: number, loan: any) => sum + loan.amount, 0)
  const totalOutstanding = loans.reduce((sum: number, loan: any) => sum + loan.remainingAmount, 0)
  const totalReceived = loans.reduce((sum: number, loan: any) => sum + loan.totalRepaid, 0)
  const overdueCount = loans.filter((loan: any) => loan.status === "OVERDUE").length

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
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 pb-1">{t.lendingPage?.title || "Lending"}</h1>
            <p className="text-muted-foreground mt-1 text-base">
              {t.lendingPage?.description || "Track money you've lent to friends, family, or others."}
            </p>
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <UserMinus className="w-4 h-4 text-indigo-500" /> {t.lendingPage?.totalLent || "Total Lent"}
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{formatRupiah(totalLent)}</div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-orange-500" /> {t.lendingPage?.outstanding || "Outstanding"}
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-2">{formatRupiah(totalOutstanding)}</div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-green-500" /> {t.lendingPage?.totalReceived || "Total Received"}
            </div>
            <div className="text-2xl font-bold text-green-600 mt-2">{formatRupiah(totalReceived)}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-between">
            <div className="text-sm font-medium text-red-500 flex items-center gap-2">
              <Clock className="w-4 h-4" /> {t.lendingPage?.overdueLoans || "Overdue Loans"}
            </div>
            <div className="text-2xl font-bold text-red-600 mt-2">{overdueCount}</div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <LoanList loans={loans} accounts={accounts} />
      </FadeIn>
    </div>
  )
}

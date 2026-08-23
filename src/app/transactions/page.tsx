import { getAccounts } from "@/features/accounts/actions"
import { getTransactions } from "@/features/transactions/actions"
import { TransactionList } from "@/features/transactions/components/TransactionList"
import { TransactionDialog } from "@/features/transactions/components/TransactionDialog"
import { FadeIn } from "@/components/MotionWrapper"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

import { getCategories } from "@/features/categories/actions"

import { getTranslation } from "@/lib/i18n"

export default async function TransactionsPage() {
  const { t } = await getTranslation()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/auth/login")
  }


  const [txResult, allAccountsResult, categoriesResult] = await Promise.all([
    getTransactions(),
    getAccounts(true),
    getCategories("EXPENSE", false)
  ])

  const transactions = txResult.success ? txResult.data || [] : []
  const allAccounts = allAccountsResult.success ? allAccountsResult.data || [] : []
  const activeAccounts = allAccounts.filter((a: any) => a.isActive)
  const categories = categoriesResult.success ? categoriesResult.data || [] : []

  return (
    <div className="space-y-8 pb-10">
      <FadeIn delay={0.1}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 pb-1">{t.transactionsPage?.title || "Transactions"}</h1>
            <p className="text-muted-foreground mt-1 text-base">
              {t.transactionsPage?.description || "View and manage all your income, expenses, and transfers."}
            </p>
          </div>
          <div className="flex gap-2 bg-white/50 p-2 rounded-2xl backdrop-blur-md border border-white/60 shadow-sm">
            <TransactionDialog accounts={activeAccounts} categories={categories} groupTranslations={(t as any).groups || {}} />
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.2}>
        <TransactionList transactions={transactions} accounts={allAccounts} categories={categories} groupTranslations={(t as any).groups || {}} />
      </FadeIn>
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Building2, Smartphone, TrendingUp } from "lucide-react"
import { AddCashDialog } from "./AddCashDialog"
import { DeleteAccountDialog } from "./DeleteAccountDialog"
import { useTranslation } from "@/lib/TranslationContext"
import { useCurrency } from "@/lib/CurrencyContext"

// Gunakan tipe dari Prisma atau custom interface
interface Account {
  id: string
  name: string
  type: string
  balance: any
  currency: string
}

const icons: Record<string, React.ReactNode> = {
  CASH: <Wallet className="h-5 w-5 text-emerald-500" />,
  BANK: <Building2 className="h-5 w-5 text-blue-500" />,
  EWALLET: <Smartphone className="h-5 w-5 text-purple-500" />,
  INVESTMENT: <TrendingUp className="h-5 w-5 text-orange-500" />,
}

export function AccountList({ accounts }: { accounts: Account[] }) {
  const { t } = useTranslation()

  if (accounts.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-white/50 border-dashed">
        <p className="text-muted-foreground text-sm">{t.accountsPage?.empty || "No accounts yet."}</p>
      </div>
    )
  }

  const { formatRupiah } = useCurrency()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <Card key={account.id} className="bg-white/60 backdrop-blur-xl border-white/40 hover:shadow-xl hover:-translate-y-1 hover:bg-white/80 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              {account.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              {account.type !== "CASH" && (
                <DeleteAccountDialog accountId={account.id} accountName={account.name} />
              )}
              {icons[account.type] || <Wallet className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(Number(account.balance))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {account.type === "CASH" ? "Cash" : account.type === "BANK" ? (t.accountsPage?.bank || "Bank") : account.type === "EWALLET" ? (t.accountsPage?.ewallet || "E-Wallet") : (t.accountsPage?.investment || "Investment")}
            </p>
          </CardContent>
          {account.type === "CASH" && (
            <div className="px-6 pb-6 pt-2">
              <AddCashDialog accountId={account.id} />
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

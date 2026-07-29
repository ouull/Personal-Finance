"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Building2, Smartphone, TrendingUp } from "lucide-react"

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
  if (accounts.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-white/50 border-dashed">
        <p className="text-muted-foreground text-sm">Belum ada akun. Silakan tambahkan akun pertama Anda.</p>
      </div>
    )
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <Card key={account.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              {account.name}
            </CardTitle>
            {icons[account.type] || <Wallet className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(Number(account.balance))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Tipe: {account.type}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

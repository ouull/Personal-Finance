"use client"

import { useState } from "react"
import { LoanDialog } from "./LoanDialog"
import { RepaymentDialog } from "./RepaymentDialog"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/TranslationContext"
import { useCurrency } from "@/lib/CurrencyContext"

interface Account {
  id: string
  name: string
  balance: any
}

interface Loan {
  id: string
  borrowerName: string
  amount: number
  totalRepaid: number
  remainingAmount: number
  lentDate: string | Date
  dueDate?: string | Date
  status: string
  type?: string
  notes?: string
}

interface LoanListProps {
  loans: Loan[]
  accounts: Account[]
}

export function LoanList({ loans, accounts }: LoanListProps) {
  const { t } = useTranslation()
  const { formatRupiah } = useCurrency()
  const [filterType, setFilterType] = useState("ALL")

  const filteredLoans = loans.filter(l => filterType === "ALL" || (l.type || "LENT") === filterType)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OUTSTANDING": return <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-200">{t.lendingPage?.outstanding || "Outstanding"}</Badge>
      case "PARTIALLY_PAID": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">{t.lendingPage?.partiallyPaid || "Partially Paid"}</Badge>
      case "PAID": return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">{t.lendingPage?.paid || "Paid"}</Badge>
      case "OVERDUE": return <Badge variant="destructive">{t.lendingPage?.overdue || "Overdue"}</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/50 shadow-sm text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <span className="text-2xl">🤝</span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{t.lendingPage?.noLoans || "No outstanding loans"}</h3>
        <p className="text-slate-500 mb-6 max-w-sm">{t.lendingPage?.empty || "You haven't lent money to anyone yet. When you do, it will show up here."}</p>
        <LoanDialog accounts={accounts} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="font-semibold text-slate-800">{t.lendingPage?.yourLoans || "Daftar Pinjaman"}</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl flex-1 sm:flex-none">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterType === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType("LENT")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterType === "LENT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Piutang
            </button>
            <button
              onClick={() => setFilterType("BORROWED")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterType === "BORROWED" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Hutang
            </button>
          </div>
          <LoanDialog accounts={accounts} />
        </div>
      </div>
      
      {filteredLoans.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
          Tidak ada pinjaman dengan filter ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLoans.map((loan) => (
          <div key={loan.id} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${(loan.type || 'LENT') === 'BORROWED' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                    {(loan.type || 'LENT') === 'BORROWED' ? (t.lendingPage?.iOwe || "Hutang") : (t.lendingPage?.owedToMe || "Piutang")}
                  </Badge>
                  {getStatusBadge(loan.status)}
                </div>
                <h4 className="font-bold text-lg text-slate-800">{loan.borrowerName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.lendingPage?.lentOn ? `${t.lendingPage.lentOn} ` : "Lent on "}{format(new Date(loan.lentDate), "d MMM yyyy")}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 flex-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">{t.lendingPage?.originalAmount || "Original Amount"}</span>
                <span className="font-medium text-slate-700">{formatRupiah(loan.amount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">{t.lendingPage?.alreadyPaid || "Already Paid"}</span>
                <span className="font-medium text-green-600">{formatRupiah(loan.totalRepaid)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-800">{t.lendingPage?.remaining || "Remaining"}</span>
                <span className="font-bold text-slate-900">{formatRupiah(loan.remainingAmount)}</span>
              </div>
              {loan.dueDate && (
                <div className="flex justify-between items-center text-xs mt-2 bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-500">{t.lendingPage?.dueDate ? t.lendingPage.dueDate.replace(" (Opsional)", "").replace(" (Optional)", "") : "Due Date"}</span>
                  <span className="font-medium text-orange-600">{format(new Date(loan.dueDate), "d MMM yyyy")}</span>
                </div>
              )}
            </div>

            {loan.status !== "PAID" && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <RepaymentDialog accounts={accounts} loan={loan} />
              </div>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  )
}

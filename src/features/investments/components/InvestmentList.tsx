"use client"

import { InvestmentDialog } from "./InvestmentDialog"
import { InvestmentTransactionDialog } from "./InvestmentTransactionDialog"
import { UpdateValueDialog } from "./UpdateValueDialog"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/TranslationContext"

interface Account {
  id: string
  name: string
}

interface Investment {
  id: string
  name: string
  type: string
  platform?: string
  totalInvested: number
  currentValue: number
  realizedGain: number
  status: string
}

interface InvestmentListProps {
  investments: Investment[]
  accounts: Account[]
}

export function InvestmentList({ investments, accounts }: InvestmentListProps) {
  const { t } = useTranslation()
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/50 shadow-sm text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <span className="text-2xl">📈</span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{t.investmentsPage?.noInvestments || "You haven't added any investments yet."}</h3>
        <p className="text-slate-500 mb-6 max-w-sm">{t.investmentsPage?.emptyState || "Start tracking your portfolio by adding your first asset."}</p>
        <InvestmentDialog />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-slate-800">Your Portfolio</h3>
        <InvestmentDialog />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {investments.map((inv) => {
          const unrealizedGain = inv.currentValue - inv.totalInvested
          const returnPct = inv.totalInvested > 0 ? unrealizedGain / inv.totalInvested : 0
          
          return (
            <div key={inv.id} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-lg text-slate-800">{inv.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{inv.type.replace("_", " ")}</Badge>
                    {inv.platform && <span className="text-xs text-slate-500">{inv.platform}</span>}
                  </div>
                </div>
                {inv.status === "SOLD" ? (
                  <Badge variant="secondary">Sold</Badge>
                ) : (
                  <UpdateValueDialog investment={inv} />
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 flex-1">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Invested</p>
                  <p className="font-medium text-slate-700">{formatRupiah(inv.totalInvested)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Current Value</p>
                  <p className="font-bold text-slate-900">{formatRupiah(inv.currentValue)}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Unrealized Return</p>
                  <p className={`font-medium ${unrealizedGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {unrealizedGain >= 0 ? "+" : ""}{formatRupiah(unrealizedGain)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Return %</p>
                  <p className={`font-bold ${returnPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {returnPct >= 0 ? "+" : ""}{formatPercentage(returnPct)}
                  </p>
                </div>
                
                {inv.realizedGain !== 0 && (
                  <div className="col-span-2 pt-2 border-t border-slate-100 mt-1 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">Total Realized Gain</span>
                    <span className={`text-sm font-bold ${inv.realizedGain >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {inv.realizedGain >= 0 ? "+" : ""}{formatRupiah(inv.realizedGain)}
                    </span>
                  </div>
                )}
              </div>

              {inv.status !== "SOLD" && (
                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                  <InvestmentTransactionDialog accounts={accounts} investment={inv} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

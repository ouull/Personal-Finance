"use client"

import { useState } from "react"
import { RecurringPaymentDialog } from "./RecurringPaymentDialog"
import { processRecurringPayment } from "../actions"
import { format, differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"
import { useTranslation } from "@/lib/TranslationContext"

interface Account {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  type: string
}

interface RecurringPayment {
  id: string
  name: string
  type: string
  amount: number
  billingCycle: string
  nextDueDate: string | Date
  status: string
}

interface RecurringPaymentListProps {
  payments: RecurringPayment[]
  accounts: Account[]
  categories: Category[]
}

export function RecurringPaymentList({ payments, accounts, categories }: RecurringPaymentListProps) {
  const { t } = useTranslation()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleProcess = async (id: string, name: string) => {
    if (!confirm(t.common?.confirmDelete || `Are you sure you want to mark ${name} as paid? This will deduct from your account.`)) return

    setProcessingId(id)
    const result = await processRecurringPayment(id)
    setProcessingId(null)

    if (result.success) {
      toast.success(t.common?.success || `${name} marked as paid!`)
    } else {
      toast.error(result.error || t.common?.error || `Failed to process ${name}`)
    }
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/50 shadow-sm text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <span className="text-2xl">📅</span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{t.recurringPage?.noRecurring || "No recurring payments yet"}</h3>
        <p className="text-slate-500 mb-6 max-w-sm">{t.recurringPage?.empty || "Set up your subscriptions, bills, and other regular payments to track them automatically."}</p>
        <RecurringPaymentDialog accounts={accounts} categories={categories} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-slate-800">Your Commitments</h3>
        <RecurringPaymentDialog accounts={accounts} categories={categories} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {payments.map((payment) => {
          const dueDate = new Date(payment.nextDueDate)
          const daysUntilDue = differenceInDays(dueDate, new Date())
          
          let statusLabel = ""
          let statusColor = ""
          
          if (daysUntilDue < 0) {
            statusLabel = "Overdue"
            statusColor = "text-red-600 bg-red-50 border-red-200"
          } else if (daysUntilDue === 0) {
            statusLabel = "Due Today"
            statusColor = "text-orange-600 bg-orange-50 border-orange-200"
          } else if (daysUntilDue <= 7) {
            statusLabel = `Due in ${daysUntilDue} days`
            statusColor = "text-amber-600 bg-amber-50 border-amber-200"
          } else {
            statusLabel = "Upcoming"
            statusColor = "text-slate-600 bg-slate-50 border-slate-200"
          }

          return (
            <div key={payment.id} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-lg text-slate-800">{payment.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{payment.type.replace("_", " ")}</Badge>
                    <span className="text-xs font-medium text-slate-500">{payment.billingCycle}</span>
                  </div>
                </div>
                <RecurringPaymentDialog accounts={accounts} categories={categories} payment={payment} />
              </div>

              <div className="mt-4 space-y-3 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Amount</span>
                  <span className="font-bold text-lg text-slate-900">{formatRupiah(payment.amount)}</span>
                </div>
                
                <div className={`mt-2 p-3 rounded-xl border ${statusColor} flex justify-between items-center`}>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">{statusLabel}</p>
                    <p className="text-sm font-bold">{format(dueDate, "d MMM yyyy")}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleProcess(payment.id, payment.name)}
                    disabled={processingId === payment.id}
                  >
                    {processingId === payment.id ? (
                      t.common?.loading || "Processing..."
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t.recurringPage?.markAsPaid || "Mark as Paid"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

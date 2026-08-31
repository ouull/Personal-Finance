"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowDownRight, ArrowRightLeft, ArrowUpRight, Wallet, Download } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { EditTransactionDialog } from "./EditTransactionDialog"
import { useTranslation } from "@/lib/TranslationContext"
import { useCurrency } from "@/lib/CurrencyContext"

interface Account {
  id: string
  name: string
  type: string
}

interface Transaction {
  id: string
  type: string
  amount: any
  description: string | null
  date: Date
  sourceAccount?: { id: string, name: string } | null
  destinationAccount?: { id: string, name: string } | null
}

interface Category {
  id: string
  name: string
  type: string
  icon?: string | null
}

export function TransactionList({ transactions, accounts = [], categories = [], groupTranslations = {} }: { transactions: Transaction[], accounts?: Account[], categories?: Category[], groupTranslations?: Record<string, string> }) {
  const { t, language } = useTranslation()
  const [filterType, setFilterType] = useState<string>("ALL")
  const [filterAccount, setFilterAccount] = useState<string>("ALL")

  const filteredTransactions = transactions.filter((t: any) => {
    if (filterType !== "ALL" && t.type !== filterType) return false
    if (filterAccount !== "ALL") {
      const isSourceMatch = t.sourceAccount?.id === filterAccount
      const isDestMatch = t.destinationAccount?.id === filterAccount
      if (!isSourceMatch && !isDestMatch) return false
    }
    return true
  })

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return
    
    // Header
    let csv = "Date;Type;Amount;Description;From Account;To Account\n"
    
    // Rows
    filteredTransactions.forEach((t: any) => {
      const dateStr = format(new Date(t.date), "yyyy-MM-dd")
      const typeStr = t.type === "INCOME" ? "Income" : t.type === "EXPENSE" ? "Expense" : "Transfer"
      const amountStr = t.amount.toString()
      const descStr = `"${(t.description || "").replace(/"/g, '""')}"`
      const sourceStr = `"${t.sourceAccount?.name || ""}"`
      const destStr = `"${t.destinationAccount?.name || ""}"`
      
      csv += `${dateStr};${typeStr};${amountStr};${descStr};${sourceStr};${destStr}\n`
    })
    
    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `transactions_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const { formatRupiah } = useCurrency()

  return (
    <div className="space-y-4">
      {/* Filters and Export Actions */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            className="text-sm border rounded-md p-1.5 bg-white text-slate-700 outline-none flex-1 sm:flex-none focus:ring-2 focus:ring-slate-200"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">{t.transactionsPage?.allTypes || "All Types"}</option>
            <option value="INCOME">{t.transactionsPage?.income || "Income"}</option>
            <option value="EXPENSE">{t.transactionsPage?.expense || "Expense"}</option>
            <option value="TRANSFER">{t.transactionsPage?.transfer || "Transfer"}</option>
          </select>

          <select 
            className="text-sm border rounded-md p-1.5 bg-white text-slate-700 outline-none flex-1 sm:flex-none focus:ring-2 focus:ring-slate-200"
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
          >
            <option value="ALL">{t.transactionsPage?.allAccounts || "All Accounts"}</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>

        <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
          <Download className="w-4 h-4" /> {t.transactionsPage?.exportCSV || "Export CSV"}
        </Button>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center p-8 border rounded-xl bg-slate-50/50 border-dashed">
          <p className="text-muted-foreground text-sm">{t.transactionsPage?.emptyFiltered || "No transactions match the filter."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((t) => {
            const isIncome = t.type === "INCOME" || t.type === "INITIAL_BALANCE"
            const isInitial = t.type === "INITIAL_BALANCE"
            const isTransfer = t.type === "TRANSFER"
            
            return (
              <Card key={t.id} className="p-4 flex flex-row items-center justify-between bg-white/60 backdrop-blur-md border-white/50 hover:bg-white/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-sm">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`p-2 rounded-full shrink-0 ${
                    isInitial ? "bg-indigo-100 text-indigo-600"
                    : isIncome ? "bg-emerald-100 text-emerald-600" 
                    : isTransfer ? "bg-blue-100 text-blue-600" 
                    : "bg-rose-100 text-rose-600"
                  }`}>
                    {isIncome ? <ArrowDownRight className="w-5 h-5" /> : 
                     isTransfer ? <ArrowRightLeft className="w-5 h-5" /> : 
                     <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-base truncate">
                      {t.description || (isIncome ? "Income" : isTransfer ? "Transfer" : "Expense")}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5 truncate">
                      <span>{format(new Date(t.date), "dd MMM yyyy", { locale: id })}</span>
                      <span>•</span>
                      {isTransfer ? (
                        <span className="flex items-center gap-1 min-w-0">
                          <span className="truncate">{t.sourceAccount?.name}</span> <ArrowRightLeft className="w-3 h-3 shrink-0" /> <span className="truncate">{t.destinationAccount?.name}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 min-w-0">
                          <Wallet className="w-3 h-3 shrink-0" />
                          <span className="truncate">{isIncome ? t.destinationAccount?.name : t.sourceAccount?.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3 shrink-0 pl-2">
                  <div className={`font-bold text-right sm:text-left ${isIncome ? "text-emerald-600" : isTransfer ? "text-slate-900" : "text-slate-900"}`}>
                    {isIncome ? "+" : isTransfer ? "" : "-"}{formatRupiah(Number(t.amount))}
                  </div>
                  <EditTransactionDialog transaction={t as any} accounts={accounts} categories={categories} groupTranslations={groupTranslations} />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

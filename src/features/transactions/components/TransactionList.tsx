"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowDownRight, ArrowRightLeft, ArrowUpRight, Wallet, Download } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

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

export function TransactionList({ transactions, accounts = [] }: { transactions: Transaction[], accounts?: Account[] }) {
  const [filterType, setFilterType] = useState<string>("ALL")
  const [filterAccount, setFilterAccount] = useState<string>("ALL")

  const filteredTransactions = transactions.filter(t => {
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
    let csv = "Tanggal;Tipe;Nominal;Keterangan;Dari Akun;Ke Akun\n"
    
    // Rows
    filteredTransactions.forEach(t => {
      const dateStr = format(new Date(t.date), "yyyy-MM-dd")
      const typeStr = t.type === "INCOME" ? "Pemasukan" : t.type === "EXPENSE" ? "Pengeluaran" : "Transfer"
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
    link.setAttribute("download", `transaksi_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

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
            <option value="ALL">Semua Tipe</option>
            <option value="INCOME">Pemasukan</option>
            <option value="EXPENSE">Pengeluaran</option>
            <option value="TRANSFER">Transfer</option>
          </select>

          <select 
            className="text-sm border rounded-md p-1.5 bg-white text-slate-700 outline-none flex-1 sm:flex-none focus:ring-2 focus:ring-slate-200"
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
          >
            <option value="ALL">Semua Akun</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>

        <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center p-8 border rounded-xl bg-slate-50/50 border-dashed">
          <p className="text-muted-foreground text-sm">Belum ada transaksi yang sesuai filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((t) => {
            const isIncome = t.type === "INCOME"
            const isTransfer = t.type === "TRANSFER"
            
            return (
              <Card key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    isIncome ? "bg-emerald-100 text-emerald-600" 
                    : isTransfer ? "bg-blue-100 text-blue-600" 
                    : "bg-rose-100 text-rose-600"
                  }`}>
                    {isIncome ? <ArrowDownRight className="w-5 h-5" /> : 
                     isTransfer ? <ArrowRightLeft className="w-5 h-5" /> : 
                     <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  
                  <div>
                    <p className="font-semibold text-slate-900 text-base">
                      {t.description || (isIncome ? "Pemasukan" : isTransfer ? "Transfer" : "Pengeluaran")}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <span>{format(new Date(t.date), "dd MMM yyyy", { locale: id })}</span>
                      <span>•</span>
                      {isTransfer ? (
                        <span className="flex items-center gap-1">
                          {t.sourceAccount?.name} <ArrowRightLeft className="w-3 h-3" /> {t.destinationAccount?.name}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          {isIncome ? t.destinationAccount?.name : t.sourceAccount?.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`font-bold ${isIncome ? "text-emerald-600" : isTransfer ? "text-slate-900" : "text-slate-900"}`}>
                  {isIncome ? "+" : isTransfer ? "" : "-"}{formatRupiah(Number(t.amount))}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle, Wallet } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createTransaction } from "@/features/transactions/actions"

import { useTranslation } from "@/lib/TranslationContext"

interface AddCashDialogProps {
  accountId: string;
}

export function AddCashDialog({ accountId }: AddCashDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [amount, setAmount] = useState<number>(0)
  const [cashType, setCashType] = useState<"INITIAL" | "INCOME">("INITIAL")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || amount <= 0) return toast.error("Masukkan jumlah yang valid")
    
    setIsPending(true)
    
    // For INITIAL, we'll just create a transaction categorized as Opening Balance
    // Wait, the financial engine requires a transaction for INFLOW.
    // We'll create an INCOME transaction. The user can classify it.
    
    const res = await createTransaction({
      amount: amount,
      type: cashType === "INITIAL" ? "INITIAL_BALANCE" : "INCOME",
      date: new Date(),
      destinationAccountId: accountId,
      description: cashType === "INITIAL" ? "Saldo Awal Tunai" : "Pemasukan Tunai Baru",
      // Optional categoryId for system income categories if they exist, otherwise null
    })
    
    setIsPending(false)
    if (res.success) {
      toast.success("Saldo tunai berhasil ditambahkan")
      setOpen(false)
      setAmount(0)
    } else {
      toast.error(res.error || "Gagal menambahkan saldo")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border-emerald-200">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t.accountsPage?.addCash || "Add Cash Balance"}
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.accountsPage?.addCashTitle || "Add Cash Balance"}</DialogTitle>
          <DialogDescription>
            {t.accountsPage?.addCashDesc || "Record newly received cash or establish your opening cash balance."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-4 pt-2 pb-4">
            <Label>{t.accountsPage?.accountType || "Transaction Type"}</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setCashType("INITIAL")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  cashType === "INITIAL" 
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                    : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-200"
                }`}
              >
                <Wallet className="w-6 h-6 mb-2" />
                <span className="font-semibold text-sm">{t.accountsPage?.typeInitial || "Opening Balance"}</span>
              </button>
              <button
                type="button"
                onClick={() => setCashType("INCOME")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  cashType === "INCOME" 
                    ? "border-blue-500 bg-blue-50 text-blue-700" 
                    : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-200"
                }`}
              >
                <PlusCircle className="w-6 h-6 mb-2" />
                <span className="font-semibold text-sm">{t.accountsPage?.typeNewIncome || "New Income"}</span>
              </button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">{t.accountsPage?.amountToProceed || "Amount"}</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amount ? new Intl.NumberFormat("id-ID").format(amount) : ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "")
                setAmount(val ? Number(val) : 0)
              }}
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? t.common?.loading || "Menyimpan..." : t.common?.save || "Simpan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

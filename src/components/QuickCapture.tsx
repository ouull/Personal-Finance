"use client"

import { useState } from "react"
import { Plus, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CategoryPicker } from "@/components/CategoryPicker"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
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

interface Merchant {
  id: string
  name: string
}

interface QuickCaptureProps {
  accounts: Account[]
  categories: Category[]
  merchants: Merchant[]
  frequentCategories?: Category[]
  groupTranslations?: Record<string, string>
}

export function QuickCapture({ accounts, categories, merchants, frequentCategories = [], groupTranslations = {} }: QuickCaptureProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const [amount, setAmount] = useState<number>(0)
  const [accountId, setAccountId] = useState(accounts[0]?.id || "")
  const [categoryId, setCategoryId] = useState("")
  const [merchantName, setMerchantName] = useState("")
  const [notes, setNotes] = useState("")

  const expenseCategories = categories.filter(c => c.type === "EXPENSE")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !accountId || !categoryId) {
      toast.error("Please fill in Amount, Account, and Category")
      return
    }

    setIsPending(true)
    try {
      const res = await fetch("/api/transactions/quick-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EXPENSE",
          amount,
          sourceAccountId: accountId,
          categoryId,
          merchantName: merchantName ? merchantName : undefined,
          description: notes || "Quick Capture"
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Transaction captured fast!")
        setOpen(false)
        setAmount(0)
        setMerchantName("")
        setNotes("")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to capture transaction")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl shadow-indigo-500/50 hover:scale-105 transition-transform z-50">
          <Plus className="h-6 w-6" />
        </Button>} />
      <DialogContent className="sm:max-w-[425px] sm:rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
        <div className="bg-indigo-600 p-6 text-white text-center pb-8">
          <DialogTitle className="text-xl font-bold mb-1">Quick Capture</DialogTitle>
          <p className="text-indigo-200 text-sm">Add an expense in seconds</p>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 -mt-6 bg-white rounded-t-3xl space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">{t.quickCapture?.amount || "Amount"} (Rp)</label>
            <Input 
              type="text" 
              inputMode="numeric"
              autoFocus
              className="text-3xl font-black border-0 border-b-2 border-slate-100 rounded-none px-0 h-14 focus-visible:ring-0 focus-visible:border-indigo-600 transition-colors" 
              value={amount ? new Intl.NumberFormat("id-ID").format(amount) : ""}
              placeholder="0"
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");
                setAmount(rawValue ? Number(rawValue) : 0);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">{t.quickCapture?.account || "Account"}</label>
              <Select value={accountId} onValueChange={(val: any) => setAccountId(val)}>
                <SelectTrigger className="w-full text-sm">
                  {accountId ? (
                    <span className="truncate">{accounts.find(a => a.id === accountId)?.name}</span>
                  ) : (
                    <SelectValue placeholder={t.quickCapture?.selectAccount || "Select account"} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">{t.quickCapture?.category || "Category"}</label>
              <CategoryPicker
                categories={expenseCategories}
                value={categoryId}
                onChange={setCategoryId}
                groupTranslations={groupTranslations}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">{t.quickCapture?.merchant || "Merchant (Optional)"}</label>
            <Input 
              className="border-0 border-b-2 border-slate-100 rounded-none px-0 focus-visible:ring-0 focus-visible:border-indigo-600 transition-colors bg-transparent"
              placeholder="e.g. Starbucks, Steam, etc"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
            />
          </div>

          <div className="space-y-1 pb-4">
            <label className="text-xs font-semibold text-slate-500 uppercase">{t.quickCapture?.notes || "Notes"}</label>
            <Input 
              className="border-0 border-b-2 border-slate-100 rounded-none px-0 focus-visible:ring-0 focus-visible:border-indigo-600 transition-colors bg-transparent"
              placeholder="What was this for?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
            disabled={isPending || amount <= 0 || !categoryId}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span className="font-semibold">{t.quickCapture?.addExpense || "Record Expense"}</span>
              </div>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

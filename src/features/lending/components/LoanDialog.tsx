/* eslint-disable react-hooks/incompatible-library */

"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { LoanFormValues, loanSchema } from "@/shared/schemas/lending"
import { createLoan } from "../actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useTranslation } from "@/lib/TranslationContext"

interface Account {
  id: string
  name: string
  balance: any
}

interface LoanDialogProps {
  accounts: Account[]
}

export function LoanDialog({ accounts }: LoanDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors }, reset, watch } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema) as any,
    defaultValues: {
      amount: 0,
      borrowerName: "",
      lentDate: new Date(),
      type: "LENT"
    },
  })

  const loanType = watch("type")

  async function onSubmit(data: LoanFormValues) {
    setIsPending(true)
    const result = await createLoan(data)
    setIsPending(false)

    if (result.success) {
      toast.success(t.common?.success || "Loan recorded successfully")
      reset()
      setOpen(false)
    } else {
      toast.error(result.error || t.common?.error || "An error occurred")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> {t.lendingPage?.addLoan || "Add Record"}
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.lendingPage?.recordLoan || "Record New Loan"}</DialogTitle>
          <DialogDescription>
            {t.lendingPage?.loanDescription || "Record money you've lent to someone. This will deduct from your account balance."}
          </DialogDescription>
        </DialogHeader>
        {accounts.length === 0 ? (
          <div className="text-center p-6 text-sm text-muted-foreground">
            You don&apos;t have any accounts yet. Please add an account first.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setValue("type", "LENT")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${loanType === "LENT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t.lendingPage?.owedToMe || "Saya Meminjamkan"}
              </button>
              <button
                type="button"
                onClick={() => setValue("type", "BORROWED")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${loanType === "BORROWED" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t.lendingPage?.iOwe || "Saya Meminjam"}
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="borrowerName">
                {loanType === "LENT" 
                  ? (t.lendingPage?.borrowerName || "Nama Peminjam") 
                  : (t.lendingPage?.lenderName || "Nama Pemberi Pinjaman")}
              </Label>
              <Input 
                id="borrowerName" 
                placeholder={loanType === "LENT" ? "Cth. Budi" : "Cth. Bank / Teman"} 
                {...register("borrowerName")} 
              />
              {errors.borrowerName && <p className="text-sm text-red-500">{errors.borrowerName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t.lendingPage?.amount || "Amount"} (Rp)</Label>
              <Input 
                id="amount" 
                type="text" 
                inputMode="numeric"
                placeholder="0" 
                className="text-lg font-bold" 
                value={(() => {
                  const val = watch("amount");
                  if (!val) return "";
                  return new Intl.NumberFormat("id-ID").format(val);
                })()}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, "");
                  setValue("amount", rawValue ? Number(rawValue) : 0, { shouldValidate: true });
                }}
              />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId">
                {loanType === "LENT" 
                  ? (t.lendingPage?.sourceAccount || "Gunakan Saldo Dari Akun")
                  : (t.lendingPage?.destAccount || "Simpan Saldo Ke Akun")}
              </Label>
              <Select 
                value={watch("accountId") || undefined}
                onValueChange={(val: any) => setValue("accountId", val, { shouldValidate: true })} 
              >
                <SelectTrigger id="accountId">
                  {watch("accountId") ? (
                    <span className="flex flex-1 text-left line-clamp-1">
                      {accounts.find((a: any) => a.id === watch("accountId"))?.name}
                    </span>
                  ) : (
                    <SelectValue placeholder={t.transactionsPage?.selectAccount || "Select account"} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && <p className="text-sm text-red-500">{errors.accountId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lentDate">{t.lendingPage?.lentDate || "Lent Date"}</Label>
                <Input 
                  id="lentDate" 
                  type="date" 
                  {...register("lentDate")} 
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
                {errors.lentDate && <p className="text-sm text-red-500">{errors.lentDate.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">{t.lendingPage?.dueDate || "Due Date (Optional)"}</Label>
                <Input 
                  id="dueDate" 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  {...register("dueDate")} 
                />
                {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t.lendingPage?.notes || "Notes (Optional)"}</Label>
              <Input id="notes" placeholder={t.lendingPage?.notesPlaceholder || "Reason or terms"} {...register("notes")} />
              {errors.notes && <p className="text-sm text-red-500">{errors.notes.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (t.common?.loading || "Saving...") : (t.common?.save || "Record Loan")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

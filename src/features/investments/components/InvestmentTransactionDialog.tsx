/* eslint-disable react-hooks/incompatible-library */

"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { InvestmentTransactionFormValues, investmentTransactionSchema } from "@/shared/schemas/investments"
import { addInvestmentTransaction } from "../actions"
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
import { ArrowLeftRight } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Account {
  id: string
  name: string
}

interface Investment {
  id: string
  name: string
  currentValue: number
}

interface InvestmentTransactionDialogProps {
  accounts: Account[]
  investment: Investment
}

export function InvestmentTransactionDialog({ accounts, investment }: InvestmentTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const { handleSubmit, setValue, formState: { errors }, reset, watch } = useForm<InvestmentTransactionFormValues>({
    resolver: zodResolver(investmentTransactionSchema) as any,
    defaultValues: {
      investmentId: investment.id,
      type: "BUY",
      amount: 0,
      date: new Date(),
    },
  })

  async function onSubmit(data: InvestmentTransactionFormValues) {
    if ((data.type === "SELL" || data.type === "WITHDRAW") && data.amount > investment.currentValue) {
      toast.error("Cannot sell more than current value")
      return
    }

    setIsPending(true)
    const result = await addInvestmentTransaction(data)
    setIsPending(false)

    if (result.success) {
      toast.success("Transaction recorded")
      reset({
        investmentId: investment.id,
        type: "BUY",
        amount: 0,
        date: new Date(),
      })
      setOpen(false)
    } else {
      toast.error(result.error || "Failed to record transaction")
    }
  }

  const txTypes = ["BUY", "SELL", "DEPOSIT", "WITHDRAW", "DIVIDEND", "INTEREST", "FEE"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="text-xs h-8">
          <ArrowLeftRight className="mr-2 h-3 w-3" /> Transact
        </Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transact: {investment.name}</DialogTitle>
          <DialogDescription>
            Record a buy, sell, or dividend transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select 
              value={watch("type")}
              onValueChange={(val: any) => setValue("type", val as any, { shouldValidate: true })} 
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {txTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Rp)</Label>
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
            <Label htmlFor="accountId">Related Account (Optional)</Label>
            <Select 
              value={watch("accountId") || ""}
              onValueChange={(val) => setValue("accountId", val as any, { shouldValidate: true })} 
            >
              <SelectTrigger id="accountId">
                {watch("accountId") ? (
                  <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1">
                    {accounts.find(a => a.id === watch("accountId"))?.name}
                  </span>
                ) : (
                  <SelectValue placeholder="No account / External" />
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
            <p className="text-xs text-muted-foreground">Select the bank account where money was withdrawn from or deposited to.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setValue("date", e.target.value ? new Date(e.target.value) : new Date(), { shouldValidate: true });
              }} 
            />
            {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
          </div>

          <Button type="submit" className="w-full font-bold" size="lg" disabled={isPending}>
            {isPending ? "Saving..." : "Save Transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* eslint-disable react-hooks/incompatible-library */

"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { RecurringPaymentFormValues, recurringPaymentSchema } from "../schema"
import { createRecurringPayment } from "../actions"
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
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

interface RecurringPaymentDialogProps {
  accounts: Account[]
  categories: Category[]
}

export function RecurringPaymentDialog({ accounts, categories }: RecurringPaymentDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const expenseCategories = categories.filter(c => c.type === "EXPENSE")

  const { register, handleSubmit, setValue, formState: { errors }, reset, watch } = useForm<RecurringPaymentFormValues>({
    resolver: zodResolver(recurringPaymentSchema) as any,
    defaultValues: {
      name: "",
      type: "SUBSCRIPTION",
      billingCycle: "MONTHLY",
      amount: 0,
      nextDueDate: new Date(),
      reminderDays: 3,
    },
  })

  const accountIdVal = watch("accountId")
  const categoryIdVal = watch("categoryId")

  async function onSubmit(data: RecurringPaymentFormValues) {
    setIsPending(true)
    const result = await createRecurringPayment(data)
    setIsPending(false)

    if (result.success) {
      toast.success(t.common?.success || "Recurring payment scheduled")
      reset()
      setOpen(false)
    } else {
      toast.error(result.error || t.common?.error || "Failed to schedule payment")
    }
  }

  const types = ["SUBSCRIPTION", "BILL", "RECURRING_EXPENSE"]
  const cycles = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> {t.recurringPage?.addRecurring || "Add Recurring"}
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.recurringPage?.addRecurring || "Schedule Recurring Payment"}</DialogTitle>
          <DialogDescription>
            {t.recurringPage?.addRecurringDesc || "Keep track of your subscriptions and regular bills."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.recurringPage?.name || "Name"}</Label>
            <Input id="name" placeholder="e.g. Netflix" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t.recurringPage?.type || "Type"}</Label>
              <Select 
                value={watch("type")}
                onValueChange={(val: any) => setValue("type", val as any, { shouldValidate: true })} 
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingCycle">{t.recurringPage?.billingCycle || "Billing Cycle"}</Label>
              <Select 
                value={watch("billingCycle")}
                onValueChange={(val: any) => setValue("billingCycle", val as any, { shouldValidate: true })} 
              >
                <SelectTrigger id="billingCycle">
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.billingCycle && <p className="text-sm text-red-500">{errors.billingCycle.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t.recurringPage?.amount || "Amount"} (Rp)</Label>
            <Input 
              id="amount" 
              type="text" 
              inputMode="numeric"
              placeholder="0"
              value={new Intl.NumberFormat("id-ID").format(watch("amount") || 0)}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");
                const numValue = rawValue ? Number(rawValue) : 0;
                setValue("amount", numValue, { shouldValidate: true });
              }}
            />
            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">{t.recurringPage?.sourceAccount || "Auto-deduct from Account"}</Label>
            <Select 
              value={accountIdVal || ""}
              onValueChange={(val: any) => setValue("accountId", val, { shouldValidate: true })} 
            >
              <SelectTrigger id="accountId">
                {accountIdVal ? (
                  <span className="flex flex-1 text-left line-clamp-1">
                    {accounts.find(a => a.id === accountIdVal)?.name}
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

          {watch("type") === "RECURRING_EXPENSE" && (
            <div className="space-y-2">
              <Label htmlFor="categoryId">{t.recurringPage?.category || "Category"}</Label>
              <Select 
                value={categoryIdVal || ""}
                onValueChange={(val: any) => setValue("categoryId", val, { shouldValidate: true })} 
              >
                <SelectTrigger id="categoryId">
                  {categoryIdVal ? (
                    <span className="flex flex-1 text-left line-clamp-1">
                      {expenseCategories.find(c => c.id === categoryIdVal)?.name}
                    </span>
                  ) : (
                    <SelectValue placeholder={t.transactionsPage?.selectCategory || "Select category"} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextDueDate">{t.recurringPage?.nextDueDate || "Next Due Date"}</Label>
              <Input 
                id="nextDueDate" 
                type="date"
                onChange={(e) => {
                  setValue("nextDueDate", e.target.value ? new Date(e.target.value) : undefined as any, { shouldValidate: true });
                }} 
              />
              {errors.nextDueDate && <p className="text-sm text-red-500">{errors.nextDueDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderDays">{t.recurringPage?.reminderDays || "Remind me before (days)"}</Label>
              <Input 
                id="reminderDays" 
                type="number"
                min="0"
                max="30"
                {...register("reminderDays", { valueAsNumber: true })} 
              />
              {errors.reminderDays && <p className="text-sm text-red-500">{errors.reminderDays.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t.recurringPage?.notes || "Notes (Optional)"}</Label>
            <Input id="notes" placeholder={t.recurringPage?.notesPlaceholder || "e.g. Shared with Andi"} {...register("notes")} />
          </div>

          <Button type="submit" className="w-full font-bold" size="lg" disabled={isPending}>
            {isPending ? (t.common?.loading || "Saving...") : (t.common?.save || "Schedule Payment")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

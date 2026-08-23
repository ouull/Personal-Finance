/* eslint-disable react-hooks/incompatible-library */

"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { TransactionFormValues, transactionSchema } from "../schema"
import { updateTransaction, deleteTransaction } from "../actions"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { CategoryPicker } from "@/components/CategoryPicker"
import { useTranslation } from "@/lib/TranslationContext"

interface Account {
  id: string
  name: string
}

interface Transaction {
  id: string
  type: string
  amount: any
  description: string | null
  date: Date
  sourceAccountId?: string | null
  destinationAccountId?: string | null
  categoryId?: string | null
}

interface Category { id: string, name: string, icon?: string | null }

interface EditTransactionDialogProps {
  transaction: Transaction
  accounts: Account[]
  categories?: Category[]
  groupTranslations?: Record<string, string>
}

export function EditTransactionDialog({ transaction, accounts, categories = [], groupTranslations = {} }: EditTransactionDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [activeTab, setActiveTab] = useState<"EXPENSE" | "INCOME" | "TRANSFER">(transaction.type as any)

  const { register, handleSubmit, setValue, formState: { errors }, watch, clearErrors } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: transaction.type as any,
      amount: Number(transaction.amount) || 0,
      description: transaction.description || undefined,
      date: new Date(transaction.date),
      sourceAccountId: transaction.sourceAccountId || undefined,
      destinationAccountId: transaction.destinationAccountId || undefined,
      categoryId: transaction.categoryId || undefined,
    },
  })

  const sourceAccountIdVal = watch("sourceAccountId")
  const destinationAccountIdVal = watch("destinationAccountId")

  const handleTabChange = (val: string) => {
    const type = val as "EXPENSE" | "INCOME" | "TRANSFER"
    setActiveTab(type)
    setValue("type", type)
    clearErrors()
  }

  async function onSubmit(data: TransactionFormValues) {
    setIsPending(true)
    const result = await updateTransaction(transaction.id, data)
    setIsPending(false)

    if (result.success) {
      toast.success(t.common?.success || "Transaction updated")
      setOpen(false)
    } else {
      toast.error(result.error || t.common?.error || "Failed to update transaction")
    }
  }

  async function handleDelete() {
    if (!confirm(t.common?.confirmDelete || "Are you sure you want to delete this transaction?")) return
    
    setIsPending(true)
    const result = await deleteTransaction(transaction.id)
    setIsPending(false)

    if (result.success) {
      toast.success(t.common?.success || "Transaction deleted")
      setOpen(false)
    } else {
      toast.error(result.error || t.common?.error || "Failed to delete transaction")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
          <Edit2 className="h-4 w-4" />
        </Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-row justify-between items-start">
          <div>
            <DialogTitle>{t.transactionsPage?.editTransaction || "Edit Transaction"}</DialogTitle>
            <DialogDescription>{t.transactionsPage?.editDescription || "Update details below."}</DialogDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="EXPENSE">{t.transactionsPage?.expense || "Expense"}</TabsTrigger>
            <TabsTrigger value="INCOME">{t.transactionsPage?.income || "Income"}</TabsTrigger>
            <TabsTrigger value="TRANSFER">{t.transactionsPage?.transfer || "Transfer"}</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">{t.transactionsPage?.amount || "Amount"}</Label>
              <Input 
                id="edit-amount" 
                type="text" 
                inputMode="numeric"
                className="text-lg font-bold" 
                value={(() => {
                  const val = watch("amount");
                  if (val === undefined || val === null) return "";
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
              <Label htmlFor="date">{t.transactionsPage?.date || "Date"}</Label>
              <Input 
                id="date" 
                type="date" 
                {...register("date", { valueAsDate: true })} 
              />
              {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
            </div>

            {activeTab === "EXPENSE" && (
              <div className="space-y-2">
                <Label htmlFor="edit-category">{t.transactionsPage?.category || "Category"}</Label>
                <CategoryPicker
                  categories={categories}
                  value={watch("categoryId") || ""}
                  onChange={(val) => setValue("categoryId", val, { shouldValidate: true })}
                  error={!!errors.categoryId}
                  groupTranslations={groupTranslations}
                />
                {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
              </div>
            )}

            {(activeTab === "EXPENSE" || activeTab === "TRANSFER") && (
              <div className="space-y-2">
                <Label htmlFor="edit-sourceAccountId">{activeTab === "TRANSFER" ? (t.transactionsPage?.sourceAccount || "Source Account") : (t.transactionsPage?.payFrom || "Pay from")}</Label>
                <Select 
                  value={sourceAccountIdVal || ""}
                  onValueChange={(val) => setValue("sourceAccountId", (val || undefined) as any, { shouldValidate: true })} 
                >
                  <SelectTrigger id="edit-sourceAccountId">
                    {sourceAccountIdVal ? (
                      <span className="flex flex-1 text-left line-clamp-1">
                        {accounts.find((a: any) => a.id === sourceAccountIdVal)?.name}
                      </span>
                    ) : (
                      <SelectValue placeholder={t.transactionsPage?.selectAccount || "Select account"} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sourceAccountId && <p className="text-sm text-red-500">{errors.sourceAccountId.message}</p>}
              </div>
            )}

            {(activeTab === "INCOME" || activeTab === "TRANSFER") && (
              <div className="space-y-2">
                <Label htmlFor="edit-destinationAccountId">{activeTab === "TRANSFER" ? (t.transactionsPage?.toAccount || "To Account") : (t.transactionsPage?.depositTo || "Deposit to")}</Label>
                <Select 
                  value={destinationAccountIdVal || ""}
                  onValueChange={(val) => setValue("destinationAccountId", (val || undefined) as any, { shouldValidate: true })} 
                >
                  <SelectTrigger id="edit-destinationAccountId">
                    {destinationAccountIdVal ? (
                      <span className="flex flex-1 text-left line-clamp-1">
                        {accounts.find((a: any) => a.id === destinationAccountIdVal)?.name}
                      </span>
                    ) : (
                      <SelectValue placeholder={t.transactionsPage?.selectAccount || "Select account"} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.destinationAccountId && <p className="text-sm text-red-500">{errors.destinationAccountId.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-description">{t.transactionsPage?.note || "Note (Optional)"}</Label>
              <Input id="edit-description" placeholder={t.transactionsPage?.notePlaceholder || "Note"} {...register("description")} />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="destructive" 
                className="w-12 px-0" 
                disabled={isPending}
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button type="submit" className="flex-1 font-bold" disabled={isPending}>
                {isPending ? (t.common?.loading || "Saving...") : (t.common?.save || "Save Changes")}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

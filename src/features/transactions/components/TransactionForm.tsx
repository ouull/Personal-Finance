/* eslint-disable react-hooks/incompatible-library */

"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { TransactionFormValues, transactionSchema } from "../schema"
import { createTransaction } from "../actions"
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
import { CategoryPicker } from "@/components/CategoryPicker"
import { Tabs,  TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useTranslation } from "@/lib/TranslationContext"

interface Account {
  id: string
  name: string
  balance: any
}

interface Category {
  id: string
  name: string
  type: string
  icon?: string | null
}

interface TransactionFormProps {
  accounts: Account[]
  categories?: Category[]
  groupTranslations?: Record<string, string>
  onSuccess?: () => void
}

export function TransactionForm({ accounts, categories = [], groupTranslations = {}, onSuccess }: TransactionFormProps) {
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)
  const [activeTab, setActiveTab] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE")

  const filteredCategories = categories.filter(c => c.type === activeTab)

  const { register, handleSubmit, setValue, formState: { errors }, reset, clearErrors, watch } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: "EXPENSE",
      amount: 0,
      description: "",
      date: new Date(),
    },
  })

  const sourceAccountIdVal = watch("sourceAccountId")
  const destinationAccountIdVal = watch("destinationAccountId")

  // Perbarui tipe saat tab berubah
  const handleTabChange = (val: string) => {
    const type = val as "EXPENSE" | "INCOME" | "TRANSFER"
    setActiveTab(type)
    setValue("type", type)
    clearErrors() // Bersihkan error saat ganti tab
  }

  async function onSubmit(data: TransactionFormValues) {
    setIsPending(true)
    const result = await createTransaction(data)
    setIsPending(false)

    if (result.success) {
      toast.success(t.common?.success || "Berhasil")
      reset()
      onSuccess?.()
    } else {
      const errorMessage = result.error && t.errors && t.errors[result.error] 
        ? t.errors[result.error] 
        : (result.error || t.common?.error || "Gagal")
      toast.error(errorMessage as string)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="EXPENSE">{t.transactionsPage?.expense || "Expense"}</TabsTrigger>
        <TabsTrigger value="INCOME">{t.transactionsPage?.income || "Income"}</TabsTrigger>
        <TabsTrigger value="TRANSFER">{t.transactionsPage?.transfer || "Transfer"}</TabsTrigger>
      </TabsList>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">{t.transactionsPage?.amount || "Amount"}</Label>
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

        {(activeTab === "EXPENSE" || activeTab === "TRANSFER") && (
          <div className="space-y-2">
            <Label htmlFor="sourceAccountId">{activeTab === "TRANSFER" ? (t.transactionsPage?.sourceAccount || "From Account") : (t.transactionsPage?.payFrom || "Pay from")}</Label>
            <Select 
              value={sourceAccountIdVal || ""}
              onValueChange={(val) => setValue("sourceAccountId", (val || undefined) as any, { shouldValidate: true })} 
            >
              <SelectTrigger id="sourceAccountId">
                {sourceAccountIdVal ? (
                  <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1">
                    {accounts.find((a: any) => a.id === sourceAccountIdVal)?.name}
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
            {errors.sourceAccountId && <p className="text-sm text-red-500">{errors.sourceAccountId.message}</p>}
          </div>
        )}

        {(activeTab === "EXPENSE" || activeTab === "INCOME") && (
          <div className="space-y-2">
            <Label htmlFor="categoryId">{t.transactionsPage?.category || "Category"}</Label>
            <CategoryPicker
              categories={filteredCategories}
              value={watch("categoryId") || ""}
              onChange={(val) => setValue("categoryId", val as any, { shouldValidate: true })}
              error={!!errors.categoryId}
              groupTranslations={groupTranslations}
            />
            {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
          </div>
        )}

        {(activeTab === "INCOME" || activeTab === "TRANSFER") && (
          <div className="space-y-2">
            <Label htmlFor="destinationAccountId">{activeTab === "TRANSFER" ? (t.transactionsPage?.destinationAccount || "To Account") : (t.transactionsPage?.depositTo || "Deposit to")}</Label>
            <Select 
              value={destinationAccountIdVal || ""}
              onValueChange={(val) => setValue("destinationAccountId", (val || undefined) as any, { shouldValidate: true })} 
            >
              <SelectTrigger id="destinationAccountId">
                {destinationAccountIdVal ? (
                  <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1">
                    {accounts.find((a: any) => a.id === destinationAccountIdVal)?.name}
                  </span>
                ) : (
                  <SelectValue placeholder={t.transactionsPage?.selectAccount || "Select account"} />
                )}
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id} disabled={acc.id === watch("sourceAccountId")}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.destinationAccountId && <p className="text-sm text-red-500">{errors.destinationAccountId.message}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">{t.transactionsPage?.note || "Note (Optional)"}</Label>
          <Input id="description" placeholder={t.transactionsPage?.notePlaceholder || "e.g. Lunch, Salary, etc"} {...register("description")} />
          {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
        </div>

        <Button type="submit" className="w-full font-bold" size="lg" disabled={isPending}>
          {isPending ? (t.common?.saving || "Saving...") : (t.common?.saveTransaction || "Save Transaction")}
        </Button>
      </form>
    </Tabs>
  )
}

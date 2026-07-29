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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface Account {
  id: string
  name: string
  balance: any
}

interface TransactionFormProps {
  accounts: Account[]
  onSuccess?: () => void
}

export function TransactionForm({ accounts, onSuccess }: TransactionFormProps) {
  const [isPending, setIsPending] = useState(false)
  const [activeTab, setActiveTab] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE")

  const { register, handleSubmit, setValue, formState: { errors }, reset, clearErrors, watch } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: "EXPENSE",
      amount: 0,
      description: "",
      date: new Date(),
    },
  })

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
      toast.success("Transaksi berhasil dicatat")
      reset({
        type: activeTab,
        amount: 0,
        description: "",
        date: new Date(),
      })
      onSuccess?.()
    } else {
      toast.error(result.error || "Terjadi kesalahan")
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="EXPENSE">Pengeluaran</TabsTrigger>
        <TabsTrigger value="INCOME">Pemasukan</TabsTrigger>
        <TabsTrigger value="TRANSFER">Transfer</TabsTrigger>
      </TabsList>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Nominal (Rp)</Label>
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
            <Label htmlFor="sourceAccountId">{activeTab === "TRANSFER" ? "Dari Akun" : "Bayar Dari"}</Label>
            <Select 
              value={watch("sourceAccountId") || ""}
              onValueChange={(val) => setValue("sourceAccountId", val || undefined, { shouldValidate: true })} 
            >
              <SelectTrigger id="sourceAccountId">
                {watch("sourceAccountId") ? (
                  <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1">
                    {accounts.find(a => a.id === watch("sourceAccountId"))?.name}
                  </span>
                ) : (
                  <SelectValue placeholder="Pilih akun" />
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

        {(activeTab === "INCOME" || activeTab === "TRANSFER") && (
          <div className="space-y-2">
            <Label htmlFor="destinationAccountId">{activeTab === "TRANSFER" ? "Ke Akun" : "Masuk Ke"}</Label>
            <Select 
              value={watch("destinationAccountId") || ""}
              onValueChange={(val) => setValue("destinationAccountId", val || undefined, { shouldValidate: true })} 
            >
              <SelectTrigger id="destinationAccountId">
                {watch("destinationAccountId") ? (
                  <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1">
                    {accounts.find(a => a.id === watch("destinationAccountId"))?.name}
                  </span>
                ) : (
                  <SelectValue placeholder="Pilih akun" />
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
            {errors.destinationAccountId && <p className="text-sm text-red-500">{errors.destinationAccountId.message}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">Catatan (Opsional)</Label>
          <Input id="description" placeholder="Misal: Makan siang, Gaji, dll" {...register("description")} />
          {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
        </div>

        <Button type="submit" className="w-full font-bold" size="lg" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Transaksi"}
        </Button>
      </form>
    </Tabs>
  )
}

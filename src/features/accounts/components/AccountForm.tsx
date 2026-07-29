"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AccountFormValues, accountSchema } from "../schema"
import { createAccount } from "../actions"
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
import { toast } from "sonner"

interface AccountFormProps {
  onSuccess?: () => void
}

export function AccountForm({ onSuccess }: AccountFormProps) {
  const [isPending, setIsPending] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema) as any,
    defaultValues: {
      name: "",
      type: "BANK",
      balance: 0,
      currency: "IDR",
    },
  })

  async function onSubmit(data: AccountFormValues) {
    setIsPending(true)
    const result = await createAccount(data)
    setIsPending(false)

    if (result.success) {
      toast.success("Akun berhasil dibuat")
      reset()
      onSuccess?.()
    } else {
      toast.error(result.error || "Terjadi kesalahan")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Akun</Label>
        <Input id="name" placeholder="Contoh: BCA Utama, Gopay" {...register("name")} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="type">Tipe Akun</Label>
        <Select 
          defaultValue="BANK" 
          onValueChange={(value) => setValue("type", value as any)}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Pilih tipe akun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BANK">Bank</SelectItem>
            <SelectItem value="EWALLET">E-Wallet</SelectItem>
            <SelectItem value="CASH">Tunai (Cash)</SelectItem>
            <SelectItem value="INVESTMENT">Investasi</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="balance">Saldo Awal (Rp)</Label>
        <Input 
          id="balance" 
          type="text" 
          inputMode="numeric"
          placeholder="0" 
          value={(() => {
            const val = watch("balance");
            if (!val) return "";
            return new Intl.NumberFormat("id-ID").format(val);
          })()}
          onChange={(e) => {
            const rawValue = e.target.value.replace(/\D/g, "");
            setValue("balance", rawValue ? Number(rawValue) : 0, { shouldValidate: true });
          }}
        />
        {errors.balance && <p className="text-sm text-red-500">{errors.balance.message}</p>}
      </div>
      
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Menyimpan..." : "Simpan Akun"}
      </Button>
    </form>
  )
}

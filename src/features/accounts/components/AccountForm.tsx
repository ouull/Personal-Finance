/* eslint-disable react-hooks/incompatible-library */

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
import { useTranslation } from "@/lib/TranslationContext"

interface AccountFormProps {
  onSuccess?: () => void
}

export function AccountForm({ onSuccess }: AccountFormProps) {
  const { t } = useTranslation()
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
      toast.success(t.common?.success || "Account created successfully")
      reset()
      onSuccess?.()
    } else {
      const errorMessage = result.error && t.errors && t.errors[result.error] 
        ? t.errors[result.error] 
        : (result.error || t.common?.error || "An error occurred")
      toast.error(errorMessage as string)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t.accountsPage?.accountName || "Account Name"}</Label>
        <Input id="name" placeholder="e.g. Main Bank, Cash" {...register("name")} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="type">{t.accountsPage?.accountType || "Account Type"}</Label>
        <Select 
          defaultValue="BANK" 
          onValueChange={(value) => setValue("type", value as any)}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BANK">{t.accountsPage?.bank || "Bank Account"}</SelectItem>
            <SelectItem value="EWALLET">{t.accountsPage?.ewallet || "E-Wallet"}</SelectItem>
            <SelectItem value="INVESTMENT">{t.accountsPage?.investment || "Investment"}</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-red-500">{errors.type.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="balance">{t.accountsPage?.initialBalance || "Initial Balance"} (Rp)</Label>
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
        {isPending ? (t.common?.loading || "Saving...") : (t.common?.save || "Save Account")}
      </Button>
    </form>
  )
}

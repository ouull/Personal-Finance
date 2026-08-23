/* eslint-disable react-hooks/incompatible-library */

"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { InvestmentFormValues, investmentSchema } from "../schema"
import { createInvestment } from "../actions"
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

export function InvestmentDialog() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors }, reset, watch } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema) as any,
    defaultValues: {
      name: "",
      type: "STOCK",
      platform: "",
    },
  })

  async function onSubmit(data: InvestmentFormValues) {
    setIsPending(true)
    const result = await createInvestment(data)
    setIsPending(false)

    if (result.success) {
      toast.success(t.common?.success || "Investment portfolio created")
      reset()
      setOpen(false)
    } else {
      toast.error(result.error || t.common?.error || "Failed to create investment")
    }
  }

  const types = ["STOCK", "MUTUAL_FUND", "BOND", "GOLD", "CRYPTO", "OTHER"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> {t.investmentsPage?.addInvestment || "Add Investment"}
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.investmentsPage?.addInvestment || "Add New Investment Portfolio"}</DialogTitle>
          <DialogDescription>
            {t.investmentsPage?.addInvestmentDesc || "Create a new portfolio to track your assets."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t.investmentsPage?.portfolioName || "Portfolio Name"}</Label>
            <Input id="name" placeholder="e.g. S&P 500 ETF, Apple Stock" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t.investmentsPage?.assetType || "Asset Type"}</Label>
            <Select 
              value={watch("type")}
              onValueChange={(val) => setValue("type", val as any, { shouldValidate: true })} 
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">{t.investmentsPage?.platform || "Platform / Broker (Optional)"}</Label>
            <Input id="platform" placeholder="e.g. Ajaib, Bibit, Binance" {...register("platform")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t.investmentsPage?.notes || "Notes (Optional)"}</Label>
            <Input id="notes" placeholder={t.investmentsPage?.notesPlaceholder || "e.g. Long term target"} {...register("notes")} />
            {errors.notes && <p className="text-sm text-red-500">{errors.notes.message as string}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (t.common?.loading || "Saving...") : (t.common?.save || "Create Portfolio")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

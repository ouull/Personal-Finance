/* eslint-disable react-hooks/incompatible-library */

/* eslint-disable react-hooks/incompatible-library */

"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { UpdateValueFormValues, updateValueSchema } from "../schema"
import { updateInvestmentValue } from "../actions"
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
import { TrendingUp } from "lucide-react"
import { toast } from "sonner"

interface Investment {
  id: string
  name: string
  currentValue: number
}

interface UpdateValueDialogProps {
  investment: Investment
}

export function UpdateValueDialog({ investment }: UpdateValueDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const { handleSubmit, setValue, formState: { errors }, watch } = useForm<UpdateValueFormValues>({
    resolver: zodResolver(updateValueSchema) as any,
    defaultValues: {
      currentValue: investment.currentValue,
    },
  })

  async function onSubmit(data: UpdateValueFormValues) {
    setIsPending(true)
    const result = await updateInvestmentValue(investment.id, data.currentValue)
    setIsPending(false)

    if (result.success) {
      toast.success("Current value updated")
      setOpen(false)
    } else {
      toast.error(result.error || "Failed to update value")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="text-xs h-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
          <TrendingUp className="mr-2 h-3 w-3" /> Update Value
        </Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Valuation: {investment.name}</DialogTitle>
          <DialogDescription>
            Update the current market value of this asset to reflect unrealized gains or losses.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentValue">Current Value (Rp)</Label>
            <Input 
              id="currentValue" 
              type="text" 
              inputMode="numeric"
              className="text-lg font-bold" 
              value={(() => {
                const val = watch("currentValue");
                if (val === undefined || val === null) return "";
                return new Intl.NumberFormat("id-ID").format(val);
              })()}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");
                setValue("currentValue", rawValue ? Number(rawValue) : 0, { shouldValidate: true });
              }}
            />
            {errors.currentValue && <p className="text-sm text-red-500">{errors.currentValue.message}</p>}
          </div>

          <Button type="submit" className="w-full font-bold" size="lg" disabled={isPending}>
            {isPending ? "Updating..." : "Update Value"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

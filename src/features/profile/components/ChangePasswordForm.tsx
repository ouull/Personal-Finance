"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { changePasswordSchema, ChangePasswordValues } from "../schema"
import { changePassword } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function ChangePasswordForm({ translations }: { translations: any }) {
  const [isPending, setIsPending] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema) as any,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: ChangePasswordValues) {
    setIsPending(true)
    const result = await changePassword(data)
    setIsPending(false)

    if (result.success) {
      toast.success(translations.success || "Password changed successfully")
      reset()
    } else {
      toast.error(result.error === "Incorrect current password" ? (translations.incorrectPassword || "Incorrect current password") : (translations.error || "Failed to change password"))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">{translations.currentPassword || "Current Password"}</Label>
        <Input 
          id="currentPassword" 
          type="password" 
          {...register("currentPassword")} 
        />
        {errors.currentPassword && <p className="text-sm text-red-500">{errors.currentPassword.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">{translations.newPassword || "New Password"}</Label>
        <Input 
          id="newPassword" 
          type="password" 
          {...register("newPassword")} 
        />
        {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{translations.confirmPassword || "Confirm New Password"}</Label>
        <Input 
          id="confirmPassword" 
          type="password" 
          {...register("confirmPassword")} 
        />
        {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
        {isPending ? (translations.saving || "Saving...") : (translations.changePassword || "Change Password")}
      </Button>
    </form>
  )
}

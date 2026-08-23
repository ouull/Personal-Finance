import { z } from "zod"

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Sandi saat ini wajib diisi"),
  newPassword: z.string().min(8, "Sandi baru minimal 8 karakter"),
  confirmPassword: z.string().min(8, "Konfirmasi sandi minimal 8 karakter")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi sandi tidak cocok",
  path: ["confirmPassword"],
}).refine(data => data.newPassword !== data.currentPassword, {
  message: "Sandi baru tidak boleh sama dengan sandi saat ini",
  path: ["newPassword"],
})

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

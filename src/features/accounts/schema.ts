import { z } from "zod"

export const accountSchema = z.object({
  name: z.string().min(1, "Nama akun wajib diisi"),
  type: z.enum(["CASH", "BANK", "EWALLET", "INVESTMENT"]),
  balance: z.coerce.number(),
  currency: z.string(),
})

export type AccountFormValues = z.infer<typeof accountSchema>

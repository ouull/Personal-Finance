import { z } from "zod"

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.coerce.number().min(1, "Nominal minimal 1"),
  description: z.string().optional(),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  
  categoryId: z.string().optional(),
  
  sourceAccountId: z.string().optional(),
  destinationAccountId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "INCOME" && !data.destinationAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Akun tujuan wajib diisi untuk Pemasukan",
      path: ["destinationAccountId"],
    })
  }
  if (data.type === "EXPENSE" && !data.sourceAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Akun sumber wajib diisi untuk Pengeluaran",
      path: ["sourceAccountId"],
    })
  }
  if (data.type === "TRANSFER") {
    if (!data.sourceAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Akun asal wajib diisi untuk Transfer",
        path: ["sourceAccountId"],
      })
    }
    if (!data.destinationAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Akun tujuan wajib diisi untuk Transfer",
        path: ["destinationAccountId"],
      })
    }
    if (data.sourceAccountId === data.destinationAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Akun asal dan tujuan tidak boleh sama",
        path: ["destinationAccountId"],
      })
    }
  }
})

export type TransactionFormValues = z.infer<typeof transactionSchema>

import { z } from "zod"

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.coerce.number().min(1, "Minimum amount is 1"),
  description: z.string().optional(),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  
  categoryId: z.string().optional(),
  
  sourceAccountId: z.string().optional(),
  destinationAccountId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "INCOME" && !data.destinationAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Destination account is required for Income",
      path: ["destinationAccountId"],
    })
  }
  if (data.type === "EXPENSE" && !data.sourceAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Source account is required for Expense",
      path: ["sourceAccountId"],
    })
  }
  if (data.type === "TRANSFER") {
    if (!data.sourceAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Source account is required for Transfer",
        path: ["sourceAccountId"],
      })
    }
    if (!data.destinationAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Destination account is required for Transfer",
        path: ["destinationAccountId"],
      })
    }
    if (data.sourceAccountId === data.destinationAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Source and destination accounts cannot be the same",
        path: ["destinationAccountId"],
      })
    }
  }
})

export type TransactionFormValues = z.infer<typeof transactionSchema>

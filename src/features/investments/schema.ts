import { z } from "zod"

export const investmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  platform: z.string().optional(),
  notes: z.string().optional()
})

export type InvestmentFormValues = z.infer<typeof investmentSchema>

export const investmentTransactionSchema = z.object({
  investmentId: z.string().min(1, "Investment is required"),
  accountId: z.string().optional(), // Optional depending on transaction type
  type: z.enum(["BUY", "SELL", "DEPOSIT", "WITHDRAW", "DIVIDEND", "INTEREST", "FEE"]),
  amount: z.coerce.number().min(1, "Minimum amount is 1"),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  notes: z.string().optional()
})

export type InvestmentTransactionFormValues = z.infer<typeof investmentTransactionSchema>

export const updateValueSchema = z.object({
  currentValue: z.coerce.number().min(0, "Value cannot be negative"),
})

export type UpdateValueFormValues = z.infer<typeof updateValueSchema>

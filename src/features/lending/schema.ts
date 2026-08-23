import { z } from "zod"

export const loanSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  borrowerName: z.string().min(1, "Borrower name is required"),
  amount: z.coerce.number().min(1, "Minimum amount is 1"),
  lentDate: z.string().or(z.date()).transform((val) => new Date(val)),
  dueDate: z.string().or(z.date()).optional().transform((val) => val ? new Date(val) : undefined),
  notes: z.string().optional()
})

export type LoanFormValues = z.infer<typeof loanSchema>

export const repaymentSchema = z.object({
  loanId: z.string().min(1, "Loan is required"),
  accountId: z.string().min(1, "Account is required"),
  amount: z.coerce.number().min(1, "Minimum amount is 1"),
  paidDate: z.string().or(z.date()).transform((val) => new Date(val)),
  notes: z.string().optional()
})

export type RepaymentFormValues = z.infer<typeof repaymentSchema>

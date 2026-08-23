import { z } from "zod"

export const recurringPaymentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["SUBSCRIPTION", "BILL", "RECURRING_EXPENSE"]),
  amount: z.coerce.number().min(1, "Minimum amount is 1"),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
  billingCycle: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  nextDueDate: z.string().or(z.date()).transform((val) => new Date(val)),
  reminderDays: z.coerce.number().min(0).default(3),
  notes: z.string().optional()
})

export type RecurringPaymentFormValues = z.infer<typeof recurringPaymentSchema>

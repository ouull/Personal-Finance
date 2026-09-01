import { z } from "zod";

export const recurringPaymentSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["SUBSCRIPTION", "BILL", "RECURRING_EXPENSE"]),
    amount: z.coerce.number().min(1, "Minimum amount is 1"),
    accountId: z.string().min(1, "Account is required"),
    categoryId: z.string().optional(),
    billingCycle: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
    nextDueDate: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
    reminderDays: z.coerce.number().min(0).default(3),
    status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.nextDueDate) {
        const nextDueDate = new Date(data.nextDueDate);
        nextDueDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return nextDueDate >= today;
      }
      return true;
    },
    {
      message: "Tenggat waktu tidak boleh di masa lampau",
      path: ["nextDueDate"],
    },
  );

export type RecurringPaymentFormValues = z.infer<typeof recurringPaymentSchema>;

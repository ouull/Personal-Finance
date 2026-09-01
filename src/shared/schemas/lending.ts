import { z } from "zod";

export const loanSchema = z
  .object({
    type: z.enum(["LENT", "BORROWED"]).default("LENT"),
    accountId: z.string().min(1, "Account is required"),
    borrowerName: z.string().min(1, "Borrower name is required"),
    amount: z.coerce.number().min(1, "Minimum amount is 1"),
    lentDate: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
    dueDate: z
      .string()
      .or(z.date())
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.dueDate) {
        const lentDate = new Date(data.lentDate);
        lentDate.setHours(0, 0, 0, 0);
        const dueDate = new Date(data.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= lentDate;
      }
      return true;
    },
    {
      message: "Tenggat waktu tidak boleh sebelum tanggal pinjaman",
      path: ["dueDate"],
    },
  )
  .refine(
    (data) => {
      if (data.dueDate) {
        const dueDate = new Date(data.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate >= today;
      }
      return true;
    },
    {
      message: "Tenggat waktu tidak boleh di masa lampau",
      path: ["dueDate"],
    },
  );

export type LoanFormValues = z.infer<typeof loanSchema>;

export const repaymentSchema = z.object({
  loanId: z.string().min(1, "Loan is required"),
  accountId: z.string().min(1, "Account is required"),
  amount: z.coerce.number().min(1, "Minimum amount is 1"),
  paidDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  notes: z.string().optional(),
});

export type RepaymentFormValues = z.infer<typeof repaymentSchema>;

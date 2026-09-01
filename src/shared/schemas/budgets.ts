import { z } from "zod";

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  amount: z.coerce.number().min(1, "Target anggaran minimal 1"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;

import { z } from "zod";

export const goalSchema = z
  .object({
    name: z.string().min(1, "Nama tujuan wajib diisi"),
    targetAmount: z.coerce.number().min(1, "Target minimal 1"),
    currentAmount: z.coerce.number().default(0),
    deadline: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.deadline) {
        const deadlineDate = new Date(data.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return deadlineDate >= today;
      }
      return true;
    },
    {
      message: "Tenggat waktu tidak boleh di masa lampau",
      path: ["deadline"],
    },
  );

export type GoalFormValues = z.infer<typeof goalSchema>;

export const goalDepositSchema = z.object({
  amount: z.coerce.number().min(1, "Jumlah minimal 1"),
  accountId: z.string().min(1, "Akun wajib dipilih"),
  notes: z.string().optional(),
});

export type GoalDepositFormValues = z.infer<typeof goalDepositSchema>;

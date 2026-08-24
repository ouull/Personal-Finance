import { z } from "zod"

export const goalSchema = z.object({
  name: z.string().min(1, "Nama tujuan wajib diisi"),
  targetAmount: z.coerce.number().min(1, "Target minimal 1"),
  currentAmount: z.coerce.number().default(0),
  deadline: z.string().optional(),
})

export type GoalFormValues = z.infer<typeof goalSchema>

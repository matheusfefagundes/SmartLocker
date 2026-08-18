import { z } from "zod";

export const checkInSchema = z.object({
  armarioId: z.string().min(1, "Informe o armário"),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

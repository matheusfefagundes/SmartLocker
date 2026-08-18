import { z } from "zod";

export const tamanhoSchema = z.enum(["P", "M", "G"]);
export const statusArmarioSchema = z.enum(["LIVRE", "OCUPADO", "MANUTENCAO"]);

export const createArmarioSchema = z.object({
  numero: z.number().int().positive(),
  bloco: z.string().trim().min(1, "Informe o bloco"),
  tamanho: tamanhoSchema,
});

export type CreateArmarioInput = z.infer<typeof createArmarioSchema>;

export const updateArmarioSchema = z.object({
  status: statusArmarioSchema,
});

export type UpdateArmarioInput = z.infer<typeof updateArmarioSchema>;

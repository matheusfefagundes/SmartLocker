import { z } from "zod";

export const tamanhoSchema = z.enum(["P", "M", "G"]);
export const statusArmarioSchema = z.enum(["LIVRE", "OCUPADO", "MANUTENCAO"]);

const numeroSchema = z
  .number("Informe o número do armário")
  .int("O número deve ser um número inteiro")
  .positive("O número deve ser maior que zero");

export const createArmarioSchema = z.object({
  numero: numeroSchema,
  bloco: z.string().trim().min(1, "Informe o bloco"),
  tamanho: tamanhoSchema,
});

export type CreateArmarioInput = z.infer<typeof createArmarioSchema>;

export const updateArmarioSchema = z.object({
  numero: numeroSchema.optional(),
  bloco: z.string().trim().min(1, "Informe o bloco").optional(),
  tamanho: tamanhoSchema.optional(),
  status: statusArmarioSchema.optional(),
});

export type UpdateArmarioInput = z.infer<typeof updateArmarioSchema>;

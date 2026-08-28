import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo"),
  email: z.string().email("E-mail inválido"),
  matricula: z.string().trim().min(1, "Informe a matrícula"),
  senha: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres")
    .max(20, "A senha deve ter no máximo 20 caracteres")
    .regex(/[a-zA-Z]/, "A senha deve conter ao menos uma letra")
    .regex(/[0-9]/, "A senha deve conter ao menos um número"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

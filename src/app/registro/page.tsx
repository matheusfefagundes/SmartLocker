import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Cadastro exclusivo para alunos da academia"
      switchLink={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary underline underline-offset-4">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}

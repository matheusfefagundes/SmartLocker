import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="SmartLocker"
      subtitle="Entre com seu e-mail e senha"
      switchLink={
        <>
          Ainda não tem conta?{" "}
          <Link href="/registro" className="font-medium text-primary underline underline-offset-4">
            Cadastre-se
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

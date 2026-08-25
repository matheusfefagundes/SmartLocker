import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

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

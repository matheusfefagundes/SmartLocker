import { NextResponse } from "next/server";

export function validarOuResponder400(erro: { flatten: () => unknown }) {
  return NextResponse.json(
    { error: "Dados inválidos", issues: erro.flatten() },
    { status: 400 }
  );
}

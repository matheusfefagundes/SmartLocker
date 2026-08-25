import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type MapaErros = Partial<Record<string, { status: number; mensagem: string }>>;

export function mapearErroPrisma(error: unknown, mapa: MapaErros) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const tratamento = mapa[error.code];
    if (tratamento) {
      return NextResponse.json({ error: tratamento.mensagem }, { status: tratamento.status });
    }
  }
  return null;
}

import { NextResponse } from "next/server";

import { comRotaDeJob } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { verificarArmariosAbandonados } from "@/server/usoService";

export const dynamic = "force-dynamic";

const executar = comRotaDeJob(async () => {
  const resultado = await verificarArmariosAbandonados(prisma);
  return NextResponse.json(resultado);
});

export const GET = executar;
export const POST = executar;

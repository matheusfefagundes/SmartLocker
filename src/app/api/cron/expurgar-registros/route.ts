import { NextResponse } from "next/server";

import { comRotaDeJob } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/server/auditoriaService";
import { executarExpurgoERetencao } from "@/server/retencaoService";

export const dynamic = "force-dynamic";

const executar = comRotaDeJob(async (operadorId) => {
  const resultado = await executarExpurgoERetencao(prisma);
  await registrarAuditoria({
    operadorId,
    acao: "EXPURGO_RETENCAO",
    entidade: "Sistema",
    detalhes: `Tentativas removidas: ${resultado.tentativasRemovidas} | Usos arquivados: ${resultado.usosArquivados}`,
  });
  return NextResponse.json(resultado);
});

export const GET = executar;
export const POST = executar;

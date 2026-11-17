import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/apiAuth";
import { exigirAssinaturaWebhook } from "@/lib/credenciaisServico";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { webhookPagamentoPixSchema } from "@/schemas/operacoes";
import { processarWebhookPagamentoPix } from "@/server/tarifacaoService";

export async function POST(request: Request) {
  try {
    const corpoCru = await request.text();
    exigirAssinaturaWebhook(request, corpoCru);

    let body: unknown;
    try {
      body = JSON.parse(corpoCru);
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const parsed = webhookPagamentoPixSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const resultado = await processarWebhookPagamentoPix(parsed.data, prisma);
    return NextResponse.json({ recebido: true, ...resultado });
  } catch (error) {
    return handleApiError(error);
  }
}

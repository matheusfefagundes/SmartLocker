import crypto from "crypto";
import { ApiAuthError } from "@/lib/erros";

function compararEmTempoConstante(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function lerSegredoObrigatorio(nomeVariavel: string): string {
  const valor = process.env[nomeVariavel];
  if (!valor) {
    // Sem segredo configurado a rota fica fechada (fail-closed).
    throw new ApiAuthError(503, `${nomeVariavel} não configurado no servidor`);
  }
  return valor;
}

export function hmacHex(segredo: string, conteudo: string) {
  return crypto.createHmac("sha256", segredo).update(conteudo).digest("hex");
}

/** Jobs agendados (Vercel Cron envia `Authorization: Bearer <CRON_SECRET>`). */
export function possuiSegredoDeJob(request: Request): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;
  const cabecalho = request.headers.get("authorization") ?? "";
  return compararEmTempoConstante(cabecalho, `Bearer ${segredo}`);
}

/**
 * Token de dispositivo: cada fechadura recebe um token próprio, derivado do
 * id do armário com HMAC. Assim um token vazado só vale para um armário.
 */
export function gerarTokenDispositivo(armarioId: string) {
  return hmacHex(lerSegredoObrigatorio("IOT_DEVICE_SECRET"), armarioId);
}

export function exigirTokenDispositivo(request: Request, armarioId: string) {
  const recebido = request.headers.get("x-dispositivo-token");
  if (!recebido) {
    throw new ApiAuthError(401, "Token do dispositivo ausente");
  }
  if (!compararEmTempoConstante(recebido, gerarTokenDispositivo(armarioId))) {
    throw new ApiAuthError(401, "Token do dispositivo inválido");
  }
}

/** Webhook PIX: o provedor assina o corpo cru com HMAC-SHA256. */
export function exigirAssinaturaWebhook(request: Request, corpoCru: string) {
  const segredo = lerSegredoObrigatorio("PIX_WEBHOOK_SECRET");
  const assinatura = request.headers.get("x-webhook-assinatura");
  if (!assinatura) {
    throw new ApiAuthError(401, "Assinatura do webhook ausente");
  }
  if (!compararEmTempoConstante(assinatura, hmacHex(segredo, corpoCru))) {
    throw new ApiAuthError(401, "Assinatura do webhook inválida");
  }
}

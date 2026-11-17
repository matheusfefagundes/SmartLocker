import crypto from "crypto";

export const DURACAO_PIN_HORAS = 4;
export const LIMITE_TENTATIVAS_PIN = 5;
export const JANELA_TENTATIVAS_PIN_SEGUNDOS = 15 * 60;

function lerSegredoDoPin() {
  const segredo = process.env.PIN_SECRET || process.env.NEXTAUTH_SECRET;
  if (!segredo) {
    throw new Error("PIN_SECRET (ou NEXTAUTH_SECRET) precisa estar definido");
  }
  return segredo;
}

function hmacDoPin(sal: string, pin: string) {
  return crypto
    .createHmac("sha256", lerSegredoDoPin())
    .update(`${sal}:${pin}`)
    .digest("hex");
}

export function gerarPinTemporario(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function calcularValidadePin(agora: Date = new Date()) {
  return new Date(agora.getTime() + DURACAO_PIN_HORAS * 60 * 60 * 1000);
}

export function calcularHashPin(pin: string): string {
  const sal = crypto.randomBytes(16).toString("hex");
  return `${sal}$${hmacDoPin(sal, pin)}`;
}

export function conferirPin(pin: string, hashArmazenado: string): boolean {
  const [sal, esperado] = hashArmazenado.split("$");
  if (!sal || !esperado) return false;
  const recebido = Buffer.from(hmacDoPin(sal, pin));
  const alvo = Buffer.from(esperado);
  return recebido.length === alvo.length && crypto.timingSafeEqual(recebido, alvo);
}

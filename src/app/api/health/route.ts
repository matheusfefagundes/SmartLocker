import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verificarConexaoMqtt } from "@/server/telemetriaService";

export const dynamic = "force-dynamic";

async function verificarBanco() {
  const inicio = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { conectado: true, latenciaMs: Date.now() - inicio };
  } catch {
    return { conectado: false, latenciaMs: null };
  }
}

export async function GET() {
  const [postgresql, mqtt] = await Promise.all([
    verificarBanco(),
    verificarConexaoMqtt(),
  ]);

  const mqttOk = !mqtt.configurado || mqtt.conectado;
  const status = !postgresql.conectado ? "down" : mqttOk ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      servicos: { postgresql, mqtt },
    },
    { status: status === "down" ? 503 : 200 }
  );
}

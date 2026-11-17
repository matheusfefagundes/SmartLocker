import net from "net";

import type { PrismaClient } from "@prisma/client";

import { ErroRegraDeNegocio } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
import type { TelemetriaInput } from "@/schemas/operacoes";

export const LIMIAR_ALERTA_BATERIA_PERCENTUAL = 25;
export const LIMIAR_BLOQUEIO_BATERIA_PERCENTUAL = 10;
export const LIMITE_PORTA_ABERTA_SEGUNDOS = 300; // 5 minutos

export interface AvaliacaoTelemetria {
  alertaBateriaPreventivo: boolean;
  bloqueioBateriaCritica: boolean;
  alertaPortaAbertaProlongada: boolean;
  alertas: string[];
}

/**
 * MNT-08 & MNT-17: Avalia leituras dos sensores IoT do armário.
 */
export function avaliarLeituraTelemetria(
  leitura: Pick<
    TelemetriaInput,
    "nivelBateria" | "temperatura" | "portaAberta" | "tempoPortaAbertaSegundos"
  >
): AvaliacaoTelemetria {
  const alertas: string[] = [];
  const bloqueioBateriaCritica =
    leitura.nivelBateria <= LIMIAR_BLOQUEIO_BATERIA_PERCENTUAL;
  const alertaBateriaPreventivo =
    leitura.nivelBateria <= LIMIAR_ALERTA_BATERIA_PERCENTUAL;
  const alertaPortaAbertaProlongada =
    leitura.portaAberta &&
    leitura.tempoPortaAbertaSegundos > LIMITE_PORTA_ABERTA_SEGUNDOS;

  if (bloqueioBateriaCritica) {
    alertas.push(
      `Bateria crítica (${leitura.nivelBateria}% <= 10%). Armário bloqueado preventivamente para MANUTENCAO.`
    );
  } else if (alertaBateriaPreventivo) {
    alertas.push(
      `Alerta preventivo de bateria baixa (${leitura.nivelBateria}% <= 25%). Programar recarga/troca.`
    );
  }

  if (alertaPortaAbertaProlongada) {
    alertas.push(
      `Porta aberta há mais de 5 minutos (${leitura.tempoPortaAbertaSegundos}s). Verificar fechamento físico.`
    );
  }

  return {
    alertaBateriaPreventivo,
    bloqueioBateriaCritica,
    alertaPortaAbertaProlongada,
    alertas,
  };
}

/**
 * MNT-08 & MNT-17: Registra telemetria em tempo real e aplica bloqueio preditivo quando bateria <= 10%.
 */
export async function registrarTelemetriaArmario(
  dados: TelemetriaInput,
  cliente: PrismaClient = prisma
) {
  return cliente.$transaction(async (tx) => {
    const armario = await tx.armario.findUnique({
      where: { id: dados.armarioId },
    });

    if (!armario) {
      throw new ErroRegraDeNegocio(
        "ARMARIO_NAO_ENCONTRADO",
        "Armário não encontrado para registro de telemetria",
        404
      );
    }

    const avaliacao = avaliarLeituraTelemetria(dados);
    const deveBloquearPorBateria =
      avaliacao.bloqueioBateriaCritica && armario.status === "LIVRE";

    const telemetria = await tx.armarioTelemetria.create({
      data: {
        armarioId: dados.armarioId,
        nivelBateria: dados.nivelBateria,
        temperatura: dados.temperatura,
        portaAberta: dados.portaAberta,
        tempoPortaAbertaSegundos: dados.tempoPortaAbertaSegundos,
      },
    });

    const armarioAtualizado = await tx.armario.update({
      where: { id: dados.armarioId },
      data: {
        nivelBateria: dados.nivelBateria,
        temperatura: dados.temperatura,
        portaAberta: dados.portaAberta,
        portaAbertaDesde: dados.portaAberta
          ? armario.portaAbertaDesde ?? new Date()
          : null,
        ...(deveBloquearPorBateria
          ? {
              status: "MANUTENCAO",
              modalidadeManutencao: "PREDITIVA_BATERIA",
            }
          : {}),
      },
    });

    if (deveBloquearPorBateria) {
      await tx.ordemManutencao.create({
        data: {
          armarioId: dados.armarioId,
          tipo: "PREDITIVA",
          status: "ABERTA",
          descricao: `Bloqueio preditivo automático: tensão de bateria crítica (${dados.nivelBateria}%).`,
        },
      });
    }

    return {
      telemetria,
      armario: armarioAtualizado,
      avaliacao,
    };
  });
}

export async function listarTelemetriaRecente(
  limite: number = 30,
  cliente: PrismaClient = prisma
) {
  return cliente.armarioTelemetria.findMany({
    include: {
      armario: {
        select: { id: true, numero: true, bloco: true, status: true },
      },
    },
    orderBy: { criadoEm: "desc" },
    take: limite,
  });
}

export interface StatusMqtt {
  configurado: boolean;
  conectado: boolean;
  broker: string | null;
  latenciaMs: number | null;
}

const TIMEOUT_MQTT_MS = 2000;

export function verificarConexaoMqtt(
  brokerUrl: string | undefined = process.env.MQTT_BROKER_URL
): Promise<StatusMqtt> {
  if (!brokerUrl) {
    return Promise.resolve({
      configurado: false,
      conectado: false,
      broker: null,
      latenciaMs: null,
    });
  }

  let host: string;
  let porta: number;
  try {
    const url = new URL(brokerUrl);
    host = url.hostname;
    porta = Number(url.port) || (url.protocol === "mqtts:" ? 8883 : 1883);
  } catch {
    return Promise.resolve({
      configurado: true,
      conectado: false,
      broker: brokerUrl,
      latenciaMs: null,
    });
  }

  const inicio = Date.now();
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port: porta });
    const finalizar = (conectado: boolean) => {
      socket.destroy();
      resolve({
        configurado: true,
        conectado,
        broker: `${host}:${porta}`,
        latenciaMs: conectado ? Date.now() - inicio : null,
      });
    };
    socket.setTimeout(TIMEOUT_MQTT_MS, () => finalizar(false));
    socket.once("connect", () => finalizar(true));
    socket.once("error", () => finalizar(false));
  });
}

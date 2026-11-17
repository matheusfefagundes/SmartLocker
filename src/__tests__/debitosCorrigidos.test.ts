import net from "net";

import { getServerSession } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  criarPrismaMock,
  registroDoUsuario,
  requisicao,
  resetarPrismaMock,
  sessaoDe,
  type UsuarioSessao,
} from "./helpers/mockPrisma";

const prismaMock = vi.hoisted(() => ({}) as ReturnType<typeof criarPrismaMock>);

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  OMITIR_PIN: { pinHash: true },
}));

vi.mock("next-auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-auth")>()),
  getServerSession: vi.fn(),
}));

import { POST as validarAcesso } from "@/app/api/armarios/validar-acesso/route";
import { GET as cronAbandono } from "@/app/api/cron/verificar-armarios-abandonados/route";
import { POST as cronExpurgo } from "@/app/api/cron/expurgar-registros/route";
import { POST as postTelemetria } from "@/app/api/iot/telemetria/route";
import { GET as getMeuUso } from "@/app/api/usos/me/route";
import { POST as webhookPix } from "@/app/api/webhooks/pagamentos/route";
import { gerarTokenDispositivo, hmacHex } from "@/lib/credenciaisServico";
import { listarArmarios } from "@/server/armarioService";
import { atualizarOrdemManutencao } from "@/server/manutencaoService";
import { calcularHashPin } from "@/server/pinAcesso";
import { verificarConexaoMqtt } from "@/server/telemetriaService";
import { realizarCheckIn } from "@/server/usoService";
import type { PrismaClient } from "@prisma/client";

const sessaoMock = vi.mocked(getServerSession);

function logarComo(usuario: UsuarioSessao | null) {
  if (!usuario) {
    sessaoMock.mockResolvedValue(null);
    return;
  }
  sessaoMock.mockResolvedValue(sessaoDe(usuario));
  prismaMock.user.findUnique.mockResolvedValue(registroDoUsuario(usuario));
}

const ADMIN: UsuarioSessao = { id: "admin-1", role: "ADMIN" };
const ALUNO: UsuarioSessao = { id: "aluno-1", role: "ALUNO" };

beforeEach(() => {
  resetarPrismaMock(prismaMock);
  sessaoMock.mockReset();
});

describe("DT-01: jobs exigem CRON_SECRET ou admin", () => {
  it("recusa chamada anônima", async () => {
    logarComo(null);
    const resposta = await cronAbandono(requisicao("/api/cron/verificar-armarios-abandonados"));
    expect(resposta.status).toBe(401);
    expect(prismaMock.usoArmario.findMany).not.toHaveBeenCalled();
  });

  it("recusa aluno logado", async () => {
    logarComo(ALUNO);
    const resposta = await cronExpurgo(
      requisicao("/api/cron/expurgar-registros", { method: "POST" })
    );
    expect(resposta.status).toBe(403);
  });

  it("recusa segredo errado", async () => {
    logarComo(null);
    const resposta = await cronAbandono(
      requisicao("/api/cron/verificar-armarios-abandonados", {
        headers: { authorization: "Bearer segredo-errado" },
      })
    );
    expect(resposta.status).toBe(401);
  });

  it("aceita o Vercel Cron com Bearer CRON_SECRET", async () => {
    prismaMock.usoArmario.findMany.mockResolvedValue([]);
    const resposta = await cronAbandono(
      requisicao("/api/cron/verificar-armarios-abandonados", {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      })
    );
    expect(resposta.status).toBe(200);
    expect(sessaoMock).not.toHaveBeenCalled();
  });

  it("aceita admin disparando pelo painel", async () => {
    logarComo(ADMIN);
    prismaMock.tentativaAcesso.deleteMany.mockResolvedValue({ count: 3 });
    prismaMock.usoArmario.updateMany.mockResolvedValue({ count: 2 });
    const resposta = await cronExpurgo(
      requisicao("/api/cron/expurgar-registros", { method: "POST" })
    );
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toMatchObject({
      tentativasRemovidas: 3,
      usosArquivados: 2,
    });
  });
});

describe("DT-02: validação de PIN pela fechadura", () => {
  const corpo = { armarioId: "arm-1", pin: "123456" };
  const comToken = (armarioId = "arm-1") => ({
    "x-dispositivo-token": gerarTokenDispositivo(armarioId),
  });

  it("exige o token do dispositivo", async () => {
    const resposta = await validarAcesso(requisicao("/api/armarios/validar-acesso", { body: corpo }));
    expect(resposta.status).toBe(401);
    expect(prismaMock.usoArmario.findFirst).not.toHaveBeenCalled();
  });

  it("recusa token de outro armário", async () => {
    const resposta = await validarAcesso(
      requisicao("/api/armarios/validar-acesso", { body: corpo, headers: comToken("arm-2") })
    );
    expect(resposta.status).toBe(401);
  });

  it("bloqueia depois de 5 tentativas em 15 minutos", async () => {
    prismaMock.tentativaAcesso.count.mockResolvedValue(5);
    const resposta = await validarAcesso(
      requisicao("/api/armarios/validar-acesso", { body: corpo, headers: comToken() })
    );
    expect(resposta.status).toBe(429);
    expect(prismaMock.usoArmario.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.tentativaAcesso.count).toHaveBeenCalledWith({
      where: { identificador: "pin:arm-1", criadoEm: expect.any(Object) },
    });
  });

  it("recusa PIN errado e aceita o PIN certo comparando com o hash", async () => {
    prismaMock.usoArmario.findFirst.mockResolvedValue({
      id: "uso-1",
      pinHash: calcularHashPin("123456"),
      pinExpiraEm: new Date(Date.now() + 60_000),
    });
    prismaMock.armario.update.mockResolvedValue({
      id: "arm-1",
      numero: 1,
      bloco: "A",
      totalCiclosAbertura: 10,
    });

    const errado = await validarAcesso(
      requisicao("/api/armarios/validar-acesso", {
        body: { ...corpo, pin: "654321" },
        headers: comToken(),
      })
    );
    expect(errado.status).toBe(401);

    const certo = await validarAcesso(
      requisicao("/api/armarios/validar-acesso", { body: corpo, headers: comToken() })
    );
    expect(certo.status).toBe(200);
    expect(await certo.json()).toMatchObject({ autorizado: true });
  });

  it("não devolve o hash do PIN para o aluno", async () => {
    logarComo(ALUNO);
    prismaMock.usoArmario.findFirst.mockResolvedValue({ id: "uso-1" });
    await getMeuUso();
    expect(prismaMock.usoArmario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ omit: { pinHash: true } })
    );
  });
});

describe("DT-03: telemetria só do dispositivo autenticado", () => {
  const leitura = {
    armarioId: "arm-1",
    nivelBateria: 1,
    temperatura: 25,
    portaAberta: false,
    tempoPortaAbertaSegundos: 0,
  };

  it("recusa leitura sem token (bateria 1% não bloqueia mais o armário)", async () => {
    const resposta = await postTelemetria(requisicao("/api/iot/telemetria", { body: leitura }));
    expect(resposta.status).toBe(401);
    expect(prismaMock.armario.update).not.toHaveBeenCalled();
  });

  it("aceita leitura com o token do próprio armário", async () => {
    prismaMock.armario.findUnique.mockResolvedValue({ id: "arm-1", status: "OCUPADO" });
    prismaMock.armarioTelemetria.create.mockResolvedValue({ id: "tel-1" });
    prismaMock.armario.update.mockResolvedValue({ id: "arm-1" });
    const resposta = await postTelemetria(
      requisicao("/api/iot/telemetria", {
        body: leitura,
        headers: { "x-dispositivo-token": gerarTokenDispositivo("arm-1") },
      })
    );
    expect(resposta.status).toBe(201);
  });
});

describe("DT-04 e DT-05: webhook PIX", () => {
  const evento = { pixTxId: "PIX-1", status: "APROVADO", valorPago: 16 };
  const assinar = (corpo: string) => ({
    "x-webhook-assinatura": hmacHex(process.env.PIX_WEBHOOK_SECRET!, corpo),
  });

  it("recusa chamada sem assinatura ou com assinatura inválida", async () => {
    const corpo = JSON.stringify(evento);
    const semAssinatura = await webhookPix(requisicao("/api/webhooks/pagamentos", { body: corpo }));
    expect(semAssinatura.status).toBe(401);

    const assinaturaErrada = await webhookPix(
      requisicao("/api/webhooks/pagamentos", {
        body: corpo,
        headers: { "x-webhook-assinatura": "0".repeat(64) },
      })
    );
    expect(assinaturaErrada.status).toBe(401);
    expect(prismaMock.usoArmario.update).not.toHaveBeenCalled();
  });

  it("recusa pagamento menor que o cobrado e nunca altera valorCobrado", async () => {
    prismaMock.usoArmario.findFirst.mockResolvedValue({
      id: "uso-1",
      valorCobrado: 16,
      statusPagamento: "PENDENTE",
    });
    const corpo = JSON.stringify({ ...evento, valorPago: 0.01 });
    const resposta = await webhookPix(
      requisicao("/api/webhooks/pagamentos", { body: corpo, headers: assinar(corpo) })
    );
    expect(resposta.status).toBe(422);
    expect(prismaMock.usoArmario.update).not.toHaveBeenCalled();
  });

  it("marca como pago guardando o valor pago à parte", async () => {
    prismaMock.usoArmario.findFirst.mockResolvedValue({
      id: "uso-1",
      valorCobrado: 16,
      statusPagamento: "PENDENTE",
    });
    prismaMock.usoArmario.update.mockResolvedValue({ id: "uso-1", statusPagamento: "PAGO" });
    const corpo = JSON.stringify(evento);
    const resposta = await webhookPix(
      requisicao("/api/webhooks/pagamentos", { body: corpo, headers: assinar(corpo) })
    );
    expect(resposta.status).toBe(200);
    const dados = prismaMock.usoArmario.update.mock.calls[0][0].data;
    expect(dados).not.toHaveProperty("valorCobrado");
    expect(dados.statusPagamento).toBe("PAGO");
    expect(Number(dados.valorPago)).toBe(16);
  });

  it("ignora evento repetido de cobrança já paga", async () => {
    prismaMock.usoArmario.findFirst.mockResolvedValue({
      id: "uso-1",
      valorCobrado: 16,
      statusPagamento: "PAGO",
    });
    const corpo = JSON.stringify(evento);
    const resposta = await webhookPix(
      requisicao("/api/webhooks/pagamentos", { body: corpo, headers: assinar(corpo) })
    );
    expect(await resposta.json()).toMatchObject({ duplicado: true });
    expect(prismaMock.usoArmario.update).not.toHaveBeenCalled();
  });
});

describe("DT-06: reativar OS com uso aberto", () => {
  it("recusa reativação quando o armário ainda tem aluno dentro", async () => {
    prismaMock.ordemManutencao.findUnique.mockResolvedValue({
      id: "os-1",
      armarioId: "arm-1",
      status: "EM_ANDAMENTO",
      testadoAntesReativar: true,
    });
    prismaMock.usoArmario.findFirst.mockResolvedValue({ id: "uso-aberto" });

    await expect(
      atualizarOrdemManutencao(
        { ordemId: "os-1", reativarArmario: true, testadoAntesReativar: true },
        prismaMock as unknown as PrismaClient
      )
    ).rejects.toMatchObject({ codigo: "ARMARIO_COM_USO_ABERTO", status: 409 });
    expect(prismaMock.armario.update).not.toHaveBeenCalled();
  });
});

describe("DT-07: bloqueio vale na próxima requisição", () => {
  it("aluno bloqueado com sessão ainda válida recebe 401", async () => {
    logarComo({ ...ALUNO, bloqueado: true });
    const resposta = await getMeuUso();
    expect(resposta.status).toBe(401);
    expect(prismaMock.usoArmario.findFirst).not.toHaveBeenCalled();
  });

  it("aluno rebaixado/promovido usa o papel atual do banco", async () => {
    sessaoMock.mockResolvedValue(sessaoDe(ADMIN));
    prismaMock.user.findUnique.mockResolvedValue(registroDoUsuario(ALUNO));
    const resposta = await cronExpurgo(
      requisicao("/api/cron/expurgar-registros", { method: "POST" })
    );
    expect(resposta.status).toBe(403);
  });
});

describe("DT-08: isolamento por filial", () => {
  const cliente = () => prismaMock as unknown as PrismaClient;

  it("aluno de filial só lista armários da própria unidade", async () => {
    prismaMock.armario.findMany.mockResolvedValue([]);
    await listarArmarios({ unidadeId: "outra-filial" }, "filial-a", cliente());
    expect(prismaMock.armario.findMany.mock.calls[0][0].where).toEqual({
      unidadeId: "filial-a",
    });
  });

  it("admin global pode filtrar por qualquer filial", async () => {
    prismaMock.armario.findMany.mockResolvedValue([]);
    await listarArmarios({ unidadeId: "filial-b" }, null, cliente());
    expect(prismaMock.armario.findMany.mock.calls[0][0].where).toEqual({
      unidadeId: "filial-b",
    });
  });

  it("check-in só ocupa armário da filial do aluno", async () => {
    prismaMock.usoArmario.findFirst.mockResolvedValue(null);
    prismaMock.armario.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      realizarCheckIn(cliente(), "aluno-1", "arm-de-outra-filial", "filial-a")
    ).rejects.toMatchObject({ codigo: "ARMARIO_INDISPONIVEL" });
    expect(prismaMock.armario.updateMany.mock.calls[0][0].where).toEqual({
      id: "arm-de-outra-filial",
      status: "LIVRE",
      unidadeId: "filial-a",
    });
  });
});

describe("DT-09: health check do MQTT", () => {
  it("informa 'não configurado' sem broker", async () => {
    expect(await verificarConexaoMqtt("")).toMatchObject({
      configurado: false,
      conectado: false,
    });
  });

  it("detecta broker inacessível e broker no ar", async () => {
    const servidor = net.createServer((socket) => socket.end());
    await new Promise<void>((resolve) => servidor.listen(0, "127.0.0.1", resolve));
    const { port } = servidor.address() as net.AddressInfo;

    const noAr = await verificarConexaoMqtt(`mqtt://127.0.0.1:${port}`);
    expect(noAr.conectado).toBe(true);

    await new Promise<void>((resolve) => servidor.close(() => resolve()));
    const fora = await verificarConexaoMqtt(`mqtt://127.0.0.1:${port}`);
    expect(fora.conectado).toBe(false);
  });
});

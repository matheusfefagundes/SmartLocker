import { Prisma } from "@prisma/client";
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

import { POST as aberturaEmergencia } from "@/app/api/armarios/[id]/abertura-emergencia/route";
import { POST as forcarLiberacao } from "@/app/api/armarios/[id]/forcar-liberacao/route";
import { POST as higienizar } from "@/app/api/armarios/[id]/higienizar/route";
import { GET as auditoria } from "@/app/api/auditoria/route";
import { POST as registrar } from "@/app/api/auth/register/route";
import { GET as listarInspecoes, POST as criarInspecao } from "@/app/api/inspecoes/route";
import { DELETE as anonimizarConta } from "@/app/api/lgpd/conta/route";
import { GET as exportarDados } from "@/app/api/lgpd/exportar/route";
import {
  GET as listarOrdens,
  PATCH as atualizarOrdem,
  POST as criarOrdem,
} from "@/app/api/ordens-manutencao/route";
import { GET as listarRelatos, POST as criarRelato } from "@/app/api/relatos-problema/route";
import { GET as listarUnidades, POST as criarUnidade } from "@/app/api/unidades/route";

const sessaoMock = vi.mocked(getServerSession);

function logarComo(usuario: UsuarioSessao) {
  sessaoMock.mockResolvedValue(sessaoDe(usuario));
  prismaMock.user.findUnique.mockResolvedValueOnce(registroDoUsuario(usuario));
}

const ADMIN: UsuarioSessao = { id: "admin-1", role: "ADMIN" };
const ALUNO: UsuarioSessao = { id: "aluno-1", role: "ALUNO" };
const params = (id: string) => ({ params: { id } });
const META_REQUISICAO = { "x-forwarded-for": "10.0.0.1", "user-agent": "vitest" };

beforeEach(() => {
  resetarPrismaMock(prismaMock);
  sessaoMock.mockReset();
});

describe("Liberação forçada, emergência e higienização", () => {
  beforeEach(() => {
    prismaMock.armario.findUnique.mockResolvedValue({
      id: "arm-1",
      status: "OCUPADO",
      modalidadeManutencao: null,
    });
    prismaMock.usoArmario.findFirst.mockResolvedValue({ id: "uso-1" });
    prismaMock.usoArmario.update.mockResolvedValue({});
    prismaMock.armario.update.mockResolvedValue({ id: "arm-1" });
  });

  it("liberação forçada encerra o uso e audita IP e navegador", async () => {
    logarComo(ADMIN);
    const resposta = await forcarLiberacao(
      requisicao("/api/armarios/arm-1/forcar-liberacao", {
        body: { justificativa: "Aluno perdeu a chave" },
        headers: META_REQUISICAO,
      }),
      params("arm-1")
    );
    expect(await resposta.json()).toMatchObject({ usoEncerradoId: "uso-1" });
    expect(prismaMock.usoArmario.update.mock.calls[0][0].data.pinHash).toBeNull();
    expect(prismaMock.auditoriaLog.create.mock.calls[0][0].data).toMatchObject({
      acao: "FORCAR_LIBERACAO_ARMARIO",
      ip: "10.0.0.1",
      userAgent: "vitest",
    });
  });

  it("justificativa curta é recusada", async () => {
    logarComo(ADMIN);
    const resposta = await forcarLiberacao(
      requisicao("/api/armarios/arm-1/forcar-liberacao", { body: { justificativa: "ok" } }),
      params("arm-1")
    );
    expect(resposta.status).toBe(400);
  });

  it("abertura de emergência gera OS", async () => {
    logarComo(ADMIN);
    prismaMock.ordemManutencao.create.mockResolvedValue({ id: "os-1" });
    const resposta = await aberturaEmergencia(
      requisicao("/api/armarios/arm-1/abertura-emergencia", {
        body: { motivo: "Trava travada com mochila" },
      }),
      params("arm-1")
    );
    expect(await resposta.json()).toMatchObject({ ordemServico: { id: "os-1" } });
  });

  it("higienização conclui a OS e audita", async () => {
    logarComo(ADMIN);
    prismaMock.ordemManutencao.updateMany.mockResolvedValue({ count: 1 });
    const resposta = await higienizar(
      requisicao("/api/armarios/arm-1/higienizar", { body: {} }),
      params("arm-1")
    );
    expect(resposta.status).toBe(200);
    expect(prismaMock.auditoriaLog.create.mock.calls[0][0].data.acao).toBe(
      "CONCLUIR_HIGIENIZACAO"
    );
  });
});

describe("Ordens de serviço, relatos e inspeções", () => {
  it("lista, cria e atualiza ordens de serviço", async () => {
    logarComo(ADMIN);
    prismaMock.ordemManutencao.findMany.mockResolvedValue([]);
    expect((await listarOrdens()).status).toBe(200);

    logarComo(ADMIN);
    prismaMock.armario.findUnique.mockResolvedValue({ id: "arm-1", status: "LIVRE", numero: 1, bloco: "A" });
    prismaMock.armario.update.mockResolvedValue({});
    prismaMock.ordemManutencao.create.mockResolvedValue({ id: "os-1" });
    const criada = await criarOrdem(
      requisicao("/api/ordens-manutencao", {
        body: { armarioId: "arm-1", tipo: "CORRETIVA", descricao: "Trocar dobradiça" },
      })
    );
    expect(criada.status).toBe(201);

    logarComo(ADMIN);
    prismaMock.ordemManutencao.findUnique.mockResolvedValue({
      id: "os-1",
      armarioId: "arm-1",
      status: "ABERTA",
      testadoAntesReativar: false,
    });
    prismaMock.ordemManutencao.update.mockResolvedValue({ id: "os-1", status: "EM_ANDAMENTO" });
    const atualizada = await atualizarOrdem(
      requisicao("/api/ordens-manutencao", {
        method: "PATCH",
        body: { ordemId: "os-1", status: "EM_ANDAMENTO" },
      })
    );
    expect(atualizada.status).toBe(200);
  });

  it("aluno relata problema e admin lista pendentes", async () => {
    logarComo(ALUNO);
    prismaMock.armario.findUnique.mockResolvedValue({ id: "arm-1" });
    prismaMock.relatoProblemaArmario.create.mockResolvedValue({ id: "rel-1" });
    const relato = await criarRelato(
      requisicao("/api/relatos-problema", {
        body: { armarioId: "arm-1", categoria: "TRAVA_EMPERRADA", descricao: "Não abre" },
      })
    );
    expect(relato.status).toBe(201);
    expect(prismaMock.relatoProblemaArmario.create.mock.calls[0][0].data.prioridadeAlta).toBe(true);

    logarComo(ADMIN);
    prismaMock.relatoProblemaArmario.findMany.mockResolvedValue([]);
    await listarRelatos(requisicao("/api/relatos-problema?pendentes=true"));
    expect(prismaMock.relatoProblemaArmario.findMany.mock.calls[0][0].where).toEqual({
      resolvido: false,
    });
  });

  it("lista e cria inspeções", async () => {
    logarComo(ADMIN);
    prismaMock.inspecaoFisica.findMany.mockResolvedValue([]);
    expect((await listarInspecoes()).status).toBe(200);

    logarComo(ADMIN);
    prismaMock.inspecaoFisica.create.mockResolvedValue({ id: "insp-1" });
    const criada = await criarInspecao(
      requisicao("/api/inspecoes", { body: { bloco: "A", dataProgramada: "2026-12-01" } })
    );
    expect(criada.status).toBe(201);
  });
});

describe("Auditoria, unidades e LGPD", () => {
  it("auditoria pagina com limite", async () => {
    logarComo(ADMIN);
    prismaMock.auditoriaLog.findMany.mockResolvedValue([]);
    prismaMock.auditoriaLog.count.mockResolvedValue(0);
    const resposta = await auditoria(requisicao("/api/auditoria?entidade=Armario&tamanhoPagina=999"));
    expect(await resposta.json()).toMatchObject({ pagina: 1, totalPaginas: 1 });
    expect(prismaMock.auditoriaLog.findMany.mock.calls[0][0].take).toBe(100);
  });

  it("unidades: lista, cria e trata código duplicado", async () => {
    logarComo(ALUNO);
    prismaMock.unidade.findMany.mockResolvedValue([]);
    expect((await listarUnidades()).status).toBe(200);

    logarComo(ADMIN);
    prismaMock.unidade.create.mockResolvedValue({ id: "u-1" });
    const criada = await criarUnidade(
      requisicao("/api/unidades", { body: { nome: "Centro", codigo: "CTR" } })
    );
    expect(criada.status).toBe(201);

    logarComo(ADMIN);
    prismaMock.unidade.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicado", {
        code: "P2002",
        clientVersion: "6",
      })
    );
    const duplicada = await criarUnidade(
      requisicao("/api/unidades", { body: { nome: "Centro", codigo: "CTR" } })
    );
    expect(duplicada.status).toBe(409);
  });

  it("LGPD: exporta dados e recusa anonimizar com armário em uso", async () => {
    logarComo(ALUNO);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "aluno-1",
      nome: "Ana",
      email: "ana@teste.local",
      matricula: "1",
      role: "ALUNO",
      unidade: null,
      createdAt: new Date(),
      usos: [],
      relatos: [],
    });
    const exportacao = await exportarDados();
    expect(await exportacao.json()).toMatchObject({ titular: { nome: "Ana" } });

    logarComo(ALUNO);
    prismaMock.usoArmario.findFirst.mockResolvedValue({ id: "uso-1" });
    const anonimizacao = await anonimizarConta();
    expect(anonimizacao.status).toBe(409);
  });
});

describe("Cadastro de aluno", () => {
  const corpo = {
    nome: "Ana Souza",
    email: "ana@teste.local",
    matricula: "2026001",
    senha: "Senha123",
    unidadeId: "filial-a",
  };

  it("grava a filial escolhida no cadastro", async () => {
    prismaMock.user.create.mockResolvedValue({ id: "u-1", nome: "Ana", email: "ana@teste.local" });
    const resposta = await registrar(requisicao("/api/auth/register", { body: corpo }));
    expect(resposta.status).toBe(201);
    expect(prismaMock.user.create.mock.calls[0][0].data).toMatchObject({
      role: "ALUNO",
      unidadeId: "filial-a",
    });
  });

  it("limita tentativas de cadastro por IP", async () => {
    prismaMock.tentativaAcesso.count.mockResolvedValue(3);
    const resposta = await registrar(requisicao("/api/auth/register", { body: corpo }));
    expect(resposta.status).toBe(429);
  });
});

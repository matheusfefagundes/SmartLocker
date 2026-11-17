import bcrypt from "bcryptjs";
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

import { DELETE as excluirArmario, PATCH as editarArmario } from "@/app/api/armarios/[id]/route";
import { GET as listarArmarios, POST as criarArmario } from "@/app/api/armarios/route";
import { POST as checkin } from "@/app/api/checkin/route";
import { POST as checkout } from "@/app/api/checkout/route";
import { GET as health } from "@/app/api/health/route";
import { GET as getPerfil, PATCH as patchPerfil } from "@/app/api/perfil/route";
import { POST as renovarPin } from "@/app/api/usos/me/pin/route";
import { GET as listarUsos } from "@/app/api/usos/route";
import { GET as listarUsuarios, PATCH as patchUsuario } from "@/app/api/usuarios/route";

const sessaoMock = vi.mocked(getServerSession);

function logarComo(usuario: UsuarioSessao | null) {
  if (!usuario) {
    sessaoMock.mockResolvedValue(null);
    return;
  }
  sessaoMock.mockResolvedValue(sessaoDe(usuario));
  prismaMock.user.findUnique.mockResolvedValueOnce(registroDoUsuario(usuario));
}

const ADMIN: UsuarioSessao = { id: "admin-1", role: "ADMIN" };
const ADMIN_FILIAL: UsuarioSessao = { id: "admin-2", role: "ADMIN", unidadeId: "filial-a" };
const ALUNO: UsuarioSessao = { id: "aluno-1", role: "ALUNO" };
const params = (id: string) => ({ params: { id } });

beforeEach(() => {
  resetarPrismaMock(prismaMock);
  sessaoMock.mockReset();
});

describe("Etapa 1: acesso por papel", () => {
  it("anônimo recebe 401 e aluno recebe 403 em rota de admin", async () => {
    logarComo(null);
    expect((await listarUsos(requisicao("/api/usos"))).status).toBe(401);

    logarComo(ALUNO);
    expect((await listarUsos(requisicao("/api/usos"))).status).toBe(403);
  });

  it("admin não faz check-in (rota de aluno)", async () => {
    logarComo(ADMIN);
    const resposta = await checkin(requisicao("/api/checkin", { body: { armarioId: "arm-1" } }));
    expect(resposta.status).toBe(403);
  });
});

describe("Etapa 1: check-in e check-out", () => {
  it("check-in devolve o PIN uma única vez e grava só o hash", async () => {
    logarComo(ALUNO);
    prismaMock.usoArmario.findFirst.mockResolvedValue(null);
    prismaMock.armario.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.usoArmario.create.mockImplementation(async ({ data }) => ({
      id: "uso-1",
      armarioId: data.armarioId,
      pinExpiraEm: data.pinExpiraEm,
    }));

    const resposta = await checkin(requisicao("/api/checkin", { body: { armarioId: "arm-1" } }));
    expect(resposta.status).toBe(201);
    const corpo = await resposta.json();
    expect(corpo.pin).toMatch(/^\d{6}$/);
    expect(corpo).not.toHaveProperty("pinHash");
    expect(prismaMock.usoArmario.create.mock.calls[0][0].omit).toEqual({ pinHash: true });
  });

  it("valida o corpo do check-in", async () => {
    logarComo(ALUNO);
    const resposta = await checkin(requisicao("/api/checkin", { body: { armarioId: "" } }));
    expect(resposta.status).toBe(400);
  });

  it("aluno sem armário recebe 404 no check-out", async () => {
    logarComo(ALUNO);
    prismaMock.usoArmario.findFirst.mockResolvedValue(null);
    const resposta = await checkout();
    expect(resposta.status).toBe(404);
  });

  it("check-out dentro da franquia libera o armário sem cobrança", async () => {
    logarComo(ALUNO);
    prismaMock.usoArmario.findFirst.mockResolvedValue({
      id: "uso-1",
      armarioId: "arm-1",
      checkIn: new Date(Date.now() - 30 * 60 * 1000),
      armario: { tamanho: "M", usosDesdeHigienizacao: 1, ultimaHigienizacaoEm: new Date() },
    });
    prismaMock.armario.update.mockResolvedValue({});
    prismaMock.usoArmario.update.mockImplementation(async ({ data }) => ({ id: "uso-1", ...data }));

    const resposta = await checkout();
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toMatchObject({ statusPagamento: "ISENTO", valorCobrado: 0 });
    expect(prismaMock.armario.update.mock.calls[0][0].data).toEqual({
      status: "LIVRE",
      modalidadeManutencao: null,
    });
  });

  it("aluno gera um novo PIN e o anterior é substituído", async () => {
    logarComo(ALUNO);
    prismaMock.usoArmario.findFirst.mockResolvedValue({ id: "uso-1" });
    prismaMock.usoArmario.update.mockResolvedValue({ id: "uso-1" });

    const resposta = await renovarPin();
    expect(resposta.status).toBe(200);
    const corpo = await resposta.json();
    expect(corpo.pin).toMatch(/^\d{6}$/);
    expect(prismaMock.usoArmario.update.mock.calls[0][0].data.pinHash).toMatch(/\$/);
  });

  it("gerar PIN sem armário em uso responde 404", async () => {
    logarComo(ALUNO);
    prismaMock.usoArmario.findFirst.mockResolvedValue(null);
    const resposta = await renovarPin();
    expect(resposta.status).toBe(404);
  });
});

describe("Etapa 1: CRUD de armários com auditoria na transação", () => {
  it("lista armários para o aluno logado", async () => {
    logarComo(ALUNO);
    prismaMock.armario.findMany.mockResolvedValue([{ id: "arm-1" }]);
    const resposta = await listarArmarios(requisicao("/api/armarios?tamanho=M&status=LIVRE"));
    expect(await resposta.json()).toEqual([{ id: "arm-1" }]);
    expect(prismaMock.armario.findMany.mock.calls[0][0].where).toEqual({
      tamanho: "M",
      status: "LIVRE",
    });
  });

  it("cria armário e registra auditoria dentro da transação", async () => {
    logarComo(ADMIN_FILIAL);
    prismaMock.armario.create.mockImplementation(async ({ data }) => ({ id: "arm-9", ...data }));

    const resposta = await criarArmario(
      requisicao("/api/armarios", { body: { numero: 9, bloco: "A", tamanho: "P" } })
    );
    expect(resposta.status).toBe(201);
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(prismaMock.armario.create.mock.calls[0][0].data.unidadeId).toBe("filial-a");
    expect(prismaMock.auditoriaLog.create.mock.calls[0][0].data.acao).toBe("CRIAR_ARMARIO");
  });

  it("não edita nem exclui armário ocupado", async () => {
    logarComo(ADMIN);
    prismaMock.armario.findUnique.mockResolvedValue({ id: "arm-1", status: "OCUPADO" });
    const edicao = await editarArmario(
      requisicao("/api/armarios/arm-1", { method: "PATCH", body: { status: "LIVRE" } }),
      params("arm-1")
    );
    expect(edicao.status).toBe(409);

    logarComo(ADMIN);
    const exclusao = await excluirArmario(
      requisicao("/api/armarios/arm-1", { method: "DELETE" }),
      params("arm-1")
    );
    expect(exclusao.status).toBe(409);
    expect(prismaMock.armario.delete).not.toHaveBeenCalled();
  });

  it("admin de filial não enxerga armário de outra filial", async () => {
    logarComo(ADMIN_FILIAL);
    prismaMock.armario.findUnique.mockResolvedValue({
      id: "arm-1",
      status: "LIVRE",
      unidadeId: "filial-b",
    });
    const resposta = await excluirArmario(
      requisicao("/api/armarios/arm-1", { method: "DELETE" }),
      params("arm-1")
    );
    expect(resposta.status).toBe(404);
  });

  it("edita e exclui armário livre", async () => {
    logarComo(ADMIN);
    prismaMock.armario.findUnique.mockResolvedValue({ id: "arm-1", status: "LIVRE", numero: 1, bloco: "A" });
    prismaMock.armario.update.mockResolvedValue({ id: "arm-1", status: "LIVRE", bloco: "B" });
    const edicao = await editarArmario(
      requisicao("/api/armarios/arm-1", { method: "PATCH", body: { bloco: "B" } }),
      params("arm-1")
    );
    expect(edicao.status).toBe(200);

    logarComo(ADMIN);
    prismaMock.armario.delete.mockResolvedValue({});
    const exclusao = await excluirArmario(
      requisicao("/api/armarios/arm-1", { method: "DELETE" }),
      params("arm-1")
    );
    expect(exclusao.status).toBe(204);
  });
});

describe("Etapa 1: histórico paginado", () => {
  it("pagina e limita o tamanho da página a 100", async () => {
    logarComo(ADMIN_FILIAL);
    prismaMock.usoArmario.findMany.mockResolvedValue([]);
    prismaMock.usoArmario.count.mockResolvedValue(250);

    const resposta = await listarUsos(requisicao("/api/usos?pagina=2&tamanhoPagina=500&ativo=true"));
    expect(await resposta.json()).toMatchObject({ total: 250, pagina: 2, totalPaginas: 3 });
    const consulta = prismaMock.usoArmario.findMany.mock.calls[0][0];
    expect(consulta.take).toBe(100);
    expect(consulta.skip).toBe(100);
    expect(consulta.omit).toEqual({ pinHash: true });
    expect(consulta.where).toEqual({ armario: { unidadeId: "filial-a" }, checkOut: null });
  });
});

describe("Perfil e gestão de usuários (regras movidas para src/server)", () => {
  it("perfil devolve dados e histórico", async () => {
    logarComo(ALUNO);
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "aluno-1", nome: "Ana" });
    prismaMock.usoArmario.findMany.mockResolvedValue([{ id: "uso-1" }]);
    const resposta = await getPerfil();
    expect(await resposta.json()).toMatchObject({ nome: "Ana", usos: [{ id: "uso-1" }] });
  });

  it("troca de senha exige a senha atual correta", async () => {
    const passwordHash = await bcrypt.hash("SenhaAntiga1", 4);

    logarComo(ALUNO);
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "aluno-1", passwordHash });
    const semAtual = await patchPerfil(
      requisicao("/api/perfil", { method: "PATCH", body: { novaSenha: "NovaSenha1" } })
    );
    expect(semAtual.status).toBe(400);

    logarComo(ALUNO);
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "aluno-1", passwordHash });
    const errada = await patchPerfil(
      requisicao("/api/perfil", {
        method: "PATCH",
        body: { senhaAtual: "Errada123", novaSenha: "NovaSenha1" },
      })
    );
    expect(errada.status).toBe(401);

    logarComo(ALUNO);
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "aluno-1", passwordHash });
    prismaMock.user.update.mockResolvedValue({ id: "aluno-1" });
    const certa = await patchPerfil(
      requisicao("/api/perfil", {
        method: "PATCH",
        body: { senhaAtual: "SenhaAntiga1", novaSenha: "NovaSenha1" },
      })
    );
    expect(certa.status).toBe(200);
  });

  it("admin de filial lista só usuários da própria filial", async () => {
    logarComo(ADMIN_FILIAL);
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);
    await listarUsuarios(requisicao("/api/usuarios?unidadeId=filial-b&busca=ana"));
    const where = prismaMock.user.findMany.mock.calls[0][0].where;
    expect(where.unidadeId).toBe("filial-a");
    expect(where.OR).toHaveLength(3);
  });

  it("bloqueio pelo admin é auditado na mesma transação", async () => {
    logarComo(ADMIN);
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "aluno-1", unidadeId: null });
    prismaMock.user.update.mockResolvedValue({ id: "aluno-1", bloqueado: true });
    const resposta = await patchUsuario(
      requisicao("/api/usuarios", { method: "PATCH", body: { userId: "aluno-1", bloqueado: true } })
    );
    expect(resposta.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(prismaMock.auditoriaLog.create.mock.calls[0][0].data.acao).toBe("GERENCIAR_USUARIO");
  });
});

describe("Health check", () => {
  it("responde 503 quando o banco está fora", async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error("sem conexão"));
    const resposta = await health();
    expect(resposta.status).toBe(503);
  });

  it("responde ok com banco no ar e MQTT não configurado", async () => {
    prismaMock.$queryRaw.mockResolvedValue([1]);
    const resposta = await health();
    expect(await resposta.json()).toMatchObject({
      status: "ok",
      servicos: { mqtt: { configurado: false } },
    });
  });
});

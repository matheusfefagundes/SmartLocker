import type { Prisma, PrismaClient } from "@prisma/client";

import { ErroRegraDeNegocio } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
import type { CreateArmarioInput, UpdateArmarioInput } from "@/schemas/armario";
import {
  type MetadadosAuditoria,
  registrarAuditoria,
} from "@/server/auditoriaService";
import { resolverUnidadeConsultada } from "@/server/escopoUnidade";

type MetaComUnidade = MetadadosAuditoria & {
  unidadeIdDoOperador?: string | null;
};

export interface FiltrosArmarios {
  bloco?: string | null;
  unidadeId?: string | null;
  tamanho?: Prisma.ArmarioWhereInput["tamanho"];
  status?: Prisma.ArmarioWhereInput["status"];
}

async function buscarArmarioDaUnidade(
  tx: Prisma.TransactionClient,
  id: string,
  unidadeIdDoOperador?: string | null
) {
  const armario = await tx.armario.findUnique({ where: { id } });
  if (
    !armario ||
    (unidadeIdDoOperador && armario.unidadeId !== unidadeIdDoOperador)
  ) {
    throw new ErroRegraDeNegocio(
      "ARMARIO_NAO_ENCONTRADO",
      "Armário não encontrado",
      404
    );
  }
  return armario;
}

/** DT-08: aluno/admin de filial só lista armários da própria unidade. */
export function listarArmarios(
  filtros: FiltrosArmarios,
  unidadeIdDaSessao: string | null | undefined,
  cliente: PrismaClient = prisma
) {
  const where: Prisma.ArmarioWhereInput = {};
  const unidadeId = resolverUnidadeConsultada(
    unidadeIdDaSessao,
    filtros.unidadeId
  );
  if (unidadeId) where.unidadeId = unidadeId;
  if (filtros.bloco) where.bloco = filtros.bloco;
  if (filtros.tamanho) where.tamanho = filtros.tamanho;
  if (filtros.status) where.status = filtros.status;

  return cliente.armario.findMany({
    where,
    orderBy: [{ bloco: "asc" }, { numero: "asc" }],
  });
}

export function criarArmario(
  dados: CreateArmarioInput,
  meta: MetaComUnidade,
  cliente: PrismaClient = prisma
) {
  return cliente.$transaction(async (tx) => {
    const armario = await tx.armario.create({
      data: {
        ...dados,
        // Admin de filial sempre cria na própria unidade.
        unidadeId: meta.unidadeIdDoOperador ?? dados.unidadeId ?? null,
      },
    });

    await registrarAuditoria(
      {
        operadorId: meta.operadorId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        acao: "CRIAR_ARMARIO",
        entidade: "Armario",
        entidadeId: armario.id,
        detalhes: `Armário #${armario.numero} (${armario.bloco}) - Tam. ${armario.tamanho}`,
      },
      tx
    );

    return armario;
  });
}

export function atualizarArmario(
  id: string,
  dados: UpdateArmarioInput,
  meta: MetaComUnidade,
  cliente: PrismaClient = prisma
) {
  return cliente.$transaction(async (tx) => {
    const armarioAtual = await buscarArmarioDaUnidade(
      tx,
      id,
      meta.unidadeIdDoOperador
    );

    const alteraDadosOuStatus =
      dados.numero !== undefined ||
      dados.bloco !== undefined ||
      dados.tamanho !== undefined ||
      dados.status !== undefined;

    if (armarioAtual.status === "OCUPADO" && alteraDadosOuStatus) {
      throw new ErroRegraDeNegocio(
        "ARMARIO_EM_USO",
        "Este armário está em uso. Utilize Abertura de Emergência ou Liberação Forçada.",
        409
      );
    }

    const armario = await tx.armario.update({
      where: { id },
      data: meta.unidadeIdDoOperador
        ? { ...dados, unidadeId: meta.unidadeIdDoOperador }
        : dados,
    });

    await registrarAuditoria(
      {
        operadorId: meta.operadorId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        acao: "ATUALIZAR_ARMARIO",
        entidade: "Armario",
        entidadeId: armario.id,
        detalhes: `Status: ${armario.status} | Bloco: ${armario.bloco}`,
      },
      tx
    );

    return armario;
  });
}

export function excluirArmario(
  id: string,
  meta: MetaComUnidade,
  cliente: PrismaClient = prisma
) {
  return cliente.$transaction(async (tx) => {
    const armarioAtual = await buscarArmarioDaUnidade(
      tx,
      id,
      meta.unidadeIdDoOperador
    );
    if (armarioAtual.status === "OCUPADO") {
      throw new ErroRegraDeNegocio(
        "ARMARIO_EM_USO",
        "Este armário está em uso e não pode ser excluído agora",
        409
      );
    }

    await tx.armario.delete({ where: { id } });

    await registrarAuditoria(
      {
        operadorId: meta.operadorId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        acao: "EXCLUIR_ARMARIO",
        entidade: "Armario",
        entidadeId: id,
        detalhes: `Armário #${armarioAtual.numero} (${armarioAtual.bloco}) excluído`,
      },
      tx
    );
  });
}

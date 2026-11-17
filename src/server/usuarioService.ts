import bcrypt from "bcryptjs";
import type { Prisma, PrismaClient } from "@prisma/client";

import { ErroRegraDeNegocio } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
import type {
  AtualizarPerfilInput,
  AtualizarUsuarioAdminInput,
} from "@/schemas/auth";
import {
  type MetadadosAuditoria,
  registrarAuditoria,
} from "@/server/auditoriaService";
import { resolverUnidadeConsultada } from "@/server/escopoUnidade";
import { listarHistoricoDoAluno } from "@/server/usoService";

const CUSTO_BCRYPT = 10;

const CAMPOS_USUARIO_ADMIN = {
  id: true,
  nome: true,
  email: true,
  role: true,
  matricula: true,
  bloqueado: true,
  anonimizado: true,
  unidadeId: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

function usuarioNaoEncontrado() {
  return new ErroRegraDeNegocio(
    "USUARIO_NAO_ENCONTRADO",
    "Usuário não encontrado",
    404
  );
}

/** MNT-14: dados do perfil + histórico recente (mesma fonte do histórico do aluno). */
export async function obterPerfil(
  userId: string,
  cliente: PrismaClient = prisma
) {
  const usuario = await cliente.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      matricula: true,
      unidadeId: true,
      createdAt: true,
    },
  });
  if (!usuario) throw usuarioNaoEncontrado();

  const usos = await listarHistoricoDoAluno(cliente, userId);
  return { ...usuario, usos };
}

/** MNT-14: troca de nome e de senha (exige a senha atual). */
export async function atualizarPerfil(
  userId: string,
  dados: AtualizarPerfilInput,
  cliente: PrismaClient = prisma
) {
  const usuarioAtual = await cliente.user.findUnique({ where: { id: userId } });
  if (!usuarioAtual) throw usuarioNaoEncontrado();

  const atualizacao: Prisma.UserUpdateInput = {};
  if (dados.nome) atualizacao.nome = dados.nome;

  if (dados.novaSenha) {
    if (!dados.senhaAtual) {
      throw new ErroRegraDeNegocio(
        "SENHA_ATUAL_OBRIGATORIA",
        "Informe a senha atual para definir uma nova senha",
        400
      );
    }

    const senhaConfere = await bcrypt.compare(
      dados.senhaAtual,
      usuarioAtual.passwordHash
    );
    if (!senhaConfere) {
      throw new ErroRegraDeNegocio(
        "SENHA_ATUAL_INCORRETA",
        "A senha atual informada está incorreta",
        401
      );
    }

    atualizacao.passwordHash = await bcrypt.hash(dados.novaSenha, CUSTO_BCRYPT);
  }

  return cliente.user.update({
    where: { id: userId },
    data: atualizacao,
    select: { id: true, nome: true, email: true, role: true, matricula: true },
  });
}

export interface FiltrosUsuarios {
  busca?: string;
  unidadeId?: string | null;
  pagina: number;
  tamanhoPagina: number;
}

/** MNT-15: listagem paginada; DT-08: admin de filial só vê a própria unidade. */
export async function listarUsuarios(
  filtros: FiltrosUsuarios,
  unidadeIdDoOperador: string | null | undefined,
  cliente: PrismaClient = prisma
) {
  const where: Prisma.UserWhereInput = {};
  const unidadeId = resolverUnidadeConsultada(
    unidadeIdDoOperador,
    filtros.unidadeId
  );
  if (unidadeId) where.unidadeId = unidadeId;
  if (filtros.busca) {
    where.OR = [
      { nome: { contains: filtros.busca, mode: "insensitive" } },
      { email: { contains: filtros.busca, mode: "insensitive" } },
      { matricula: { contains: filtros.busca, mode: "insensitive" } },
    ];
  }

  const [dados, total] = await Promise.all([
    cliente.user.findMany({
      where,
      select: CAMPOS_USUARIO_ADMIN,
      orderBy: { createdAt: "desc" },
      skip: (filtros.pagina - 1) * filtros.tamanhoPagina,
      take: filtros.tamanhoPagina,
    }),
    cliente.user.count({ where }),
  ]);

  return {
    dados,
    total,
    pagina: filtros.pagina,
    totalPaginas: Math.max(1, Math.ceil(total / filtros.tamanhoPagina)),
  };
}

/**
 * MNT-15: bloqueio, troca de nome/filial e redefinição de senha pelo admin.
 * A auditoria entra na mesma transação da alteração. O bloqueio vale na
 * próxima requisição do aluno (DT-07, conferido em requireUser).
 */
export async function atualizarUsuarioPorAdmin(
  dados: AtualizarUsuarioAdminInput,
  meta: MetadadosAuditoria & { unidadeIdDoOperador?: string | null },
  cliente: PrismaClient = prisma
) {
  const novaSenhaHash = dados.novaSenha
    ? await bcrypt.hash(dados.novaSenha, CUSTO_BCRYPT)
    : undefined;

  return cliente.$transaction(async (tx) => {
    const alvo = await tx.user.findUnique({ where: { id: dados.userId } });
    if (!alvo) throw usuarioNaoEncontrado();

    if (meta.unidadeIdDoOperador && alvo.unidadeId !== meta.unidadeIdDoOperador) {
      throw usuarioNaoEncontrado();
    }

    const atualizacao: Prisma.UserUpdateInput = {};
    if (dados.nome !== undefined) atualizacao.nome = dados.nome;
    if (dados.bloqueado !== undefined) atualizacao.bloqueado = dados.bloqueado;
    if (dados.unidadeId !== undefined) {
      atualizacao.unidade = dados.unidadeId
        ? { connect: { id: dados.unidadeId } }
        : { disconnect: true };
    }
    if (novaSenhaHash) atualizacao.passwordHash = novaSenhaHash;

    const atualizado = await tx.user.update({
      where: { id: dados.userId },
      data: atualizacao,
      select: CAMPOS_USUARIO_ADMIN,
    });

    await registrarAuditoria(
      {
        operadorId: meta.operadorId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        acao: "GERENCIAR_USUARIO",
        entidade: "User",
        entidadeId: atualizado.id,
        detalhes: `Bloqueado: ${atualizado.bloqueado} | Senha redefinida: ${Boolean(dados.novaSenha)}`,
      },
      tx
    );

    return atualizado;
  });
}

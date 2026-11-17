import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { ApiAuthError, ErroRegraDeNegocio } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
import { possuiSegredoDeJob } from "@/lib/credenciaisServico";
import { extrairPrimeiroIp } from "@/utils/extrairPrimeiroIp";

export { ApiAuthError, ErroRegraDeNegocio } from "@/lib/erros";

export async function requireUser(role?: Role) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new ApiAuthError(401, "Não autenticado");
  }

  const atual = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, unidadeId: true, bloqueado: true, anonimizado: true },
  });

  if (!atual || atual.bloqueado || atual.anonimizado) {
    throw new ApiAuthError(401, "Sessão inválida ou usuário bloqueado");
  }

  if (role && atual.role !== role) {
    throw new ApiAuthError(403, "Sem permissão para esta ação");
  }

  return { ...session.user, role: atual.role, unidadeId: atual.unidadeId };
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiAuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  if (error instanceof ErroRegraDeNegocio) {
    return NextResponse.json(
      { error: error.message, codigo: error.codigo },
      { status: error.status },
    );
  }

  console.error(
    error instanceof Error
      ? { name: error.name, message: error.message }
      : error,
  );

  return NextResponse.json(
    { error: "Erro interno do servidor" },
    { status: 500 },
  );
}

export type UsuarioAutenticado = Awaited<ReturnType<typeof requireUser>>;

export interface ContextoRequisicaoAutenticada {
  user: UsuarioAutenticado;
  ip: string;
  userAgent: string;
}

function extrairMetadadosRequisicao(primeiroArgumento: unknown): {
  ip: string;
  userAgent: string;
} {
  if (
    primeiroArgumento &&
    typeof primeiroArgumento === "object" &&
    "headers" in primeiroArgumento &&
    primeiroArgumento.headers instanceof Headers
  ) {
    const headers = primeiroArgumento.headers;
    return {
      ip: extrairPrimeiroIp(headers.get("x-forwarded-for")),
      userAgent: headers.get("user-agent") || "desconhecido",
    };
  }

  return { ip: "desconhecido", userAgent: "desconhecido" };
}

export function comRotaDeJob(
  handler: (operadorId: string | null) => Promise<NextResponse>,
) {
  return async (request: Request) => {
    try {
      if (possuiSegredoDeJob(request)) {
        return await handler(null);
      }
      const user = await requireUser("ADMIN");
      return await handler(user.id);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function comRotaAutenticada<Args extends unknown[]>(
  papel: Role | undefined,
  handler: (
    contexto: ContextoRequisicaoAutenticada,
    ...args: Args
  ) => Promise<NextResponse>,
) {
  return async (...args: Args) => {
    try {
      const user = await requireUser(papel);
      const { ip, userAgent } = extrairMetadadosRequisicao(args[0]);
      return await handler({ user, ip, userAgent }, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

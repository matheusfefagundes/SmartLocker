import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

export class ApiAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser(role?: Role) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new ApiAuthError(401, "Não autenticado");
  }

  if (role && session.user.role !== role) {
    throw new ApiAuthError(403, "Sem permissão para esta ação");
  }

  return session.user;
}

export class ErroRegraDeNegocio extends Error {
  constructor(public codigo: string, message: string, public status: number) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ErroRegraDeNegocio) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json(
    { error: "Erro interno do servidor" },
    { status: 500 }
  );
}

type UsuarioAutenticado = Awaited<ReturnType<typeof requireUser>>;

export function comRotaAutenticada<Args extends unknown[]>(
  papel: Role | undefined,
  handler: (
    contexto: { user: UsuarioAutenticado },
    ...args: Args
  ) => Promise<NextResponse>
) {
  return async (...args: Args) => {
    try {
      const user = await requireUser(papel);
      return await handler({ user }, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

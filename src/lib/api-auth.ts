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

export function handleApiError(error: unknown) {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json(
    { error: "Erro interno do servidor" },
    { status: 500 }
  );
}

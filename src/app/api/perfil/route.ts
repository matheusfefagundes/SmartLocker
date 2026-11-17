import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { atualizarPerfilSchema } from "@/schemas/auth";
import { atualizarPerfil, obterPerfil } from "@/server/usuarioService";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada(undefined, async ({ user }) => {
  const perfil = await obterPerfil(user.id);
  return NextResponse.json(perfil);
});

export const PATCH = comRotaAutenticada(
  undefined,
  async ({ user }, request: Request) => {
    const body = await request.json();
    const parsed = atualizarPerfilSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const atualizado = await atualizarPerfil(user.id, parsed.data);
    return NextResponse.json(atualizado);
  }
);

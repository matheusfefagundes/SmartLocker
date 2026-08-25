import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { checkInSchema } from "@/schemas/checkin";
import { realizarCheckIn } from "@/server/usoService";

export const POST = comRotaAutenticada("ALUNO", async ({ user }, request: Request) => {
  const body = await request.json();
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) return validarOuResponder400(parsed.error);

  const uso = await realizarCheckIn(prisma, user.id, parsed.data.armarioId);
  return NextResponse.json(uso, { status: 201 });
});

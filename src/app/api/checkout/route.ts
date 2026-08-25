import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { realizarCheckOut } from "@/server/usoService";

export const POST = comRotaAutenticada("ALUNO", async ({ user }) => {
  const uso = await realizarCheckOut(prisma, user.id);
  return NextResponse.json(uso);
});

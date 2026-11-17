import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/apiAuth";
import { exigirTokenDispositivo } from "@/lib/credenciaisServico";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { validarAcessoPinSchema } from "@/schemas/armario";
import { validarAcessoHardwarePin } from "@/server/usoService";

/**
 * Chamada pela fechadura do armário (não por pessoas). DT-02: exige o token
 * do próprio dispositivo e o serviço limita as tentativas de PIN.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validarAcessoPinSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    exigirTokenDispositivo(request, parsed.data.armarioId);

    const resultado = await validarAcessoHardwarePin(
      prisma,
      parsed.data.armarioId,
      parsed.data.pin
    );

    return NextResponse.json(resultado);
  } catch (error) {
    return handleApiError(error);
  }
}

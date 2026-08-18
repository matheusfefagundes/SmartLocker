import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { handleApiError, requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { updateArmarioSchema } from "@/schemas/armario";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireUser("ADMIN");

    const body = await request.json();
    const parsed = updateArmarioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const armario = await prisma.armario.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json(armario);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Armário não encontrado" },
        { status: 404 }
      );
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireUser("ADMIN");

    await prisma.armario.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Armário não encontrado" },
          { status: 404 }
        );
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Armário possui histórico de uso e não pode ser excluído" },
          { status: 409 }
        );
      }
    }
    return handleApiError(error);
  }
}

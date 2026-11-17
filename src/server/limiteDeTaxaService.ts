import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function verificarLimiteDeTaxa(
  identificador: string,
  limite: number,
  janelaEmSegundos: number,
  cliente: PrismaClient = prisma
): Promise<boolean> {
  const desde = new Date(Date.now() - janelaEmSegundos * 1000);

  const [contagem] = await Promise.all([
    cliente.tentativaAcesso.count({
      where: { identificador, criadoEm: { gte: desde } },
    }),
    cliente.tentativaAcesso.deleteMany({
      where: { identificador, criadoEm: { lt: desde } },
    }),
  ]);

  if (contagem >= limite) return false;

  await cliente.tentativaAcesso.create({ data: { identificador } });
  return true;
}

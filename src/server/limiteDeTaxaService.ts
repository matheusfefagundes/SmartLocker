import { prisma } from "@/lib/prisma";

export async function verificarLimiteDeTaxa(
  identificador: string,
  limite: number,
  janelaEmSegundos: number,
): Promise<boolean> {
  const desde = new Date(Date.now() - janelaEmSegundos * 1000);

  const [contagem] = await Promise.all([
    prisma.tentativaAcesso.count({
      where: { identificador: identificador,criadoEm: { gte: desde } },
    }),
    prisma.tentativaAcesso.deleteMany({
      where: { identificador, criadoEm: { lt: desde } },
    }),
  ]);

  if (contagem >= limite) return false;

  await prisma.tentativaAcesso.create({ data: { identificador } });
  return true;
}

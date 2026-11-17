export const LIMIAR_INSPECAO_PREVENTIVA_CICLOS = 1000;
export const LIMIAR_SUBSTITUICAO_SOLENOIDE_CICLOS = 5000;

/**
 * MNT-07: Avalia o nível de desgaste mecânico da trava/solenoide por ciclos de abertura.
 *
 * Função pura (sem Prisma) para poder ser usada também pelas telas.
 */
export function avaliarDesgasteSolenoide(totalCiclosAbertura: number): {
  nivelAlerta: "NORMAL" | "PREVENTIVA" | "CRITICO";
  mensagem: string | null;
} {
  if (totalCiclosAbertura >= LIMIAR_SUBSTITUICAO_SOLENOIDE_CICLOS) {
    return {
      nivelAlerta: "CRITICO",
      mensagem: `Fadiga crítica de solenoide (${totalCiclosAbertura} ciclos >= 5.000). Substituição imediata recomendada.`,
    };
  }

  if (totalCiclosAbertura >= LIMIAR_INSPECAO_PREVENTIVA_CICLOS) {
    return {
      nivelAlerta: "PREVENTIVA",
      mensagem: `Inspeção Mecânica Preventiva necessária (${totalCiclosAbertura} ciclos >= 1.000).`,
    };
  }

  return { nivelAlerta: "NORMAL", mensagem: null };
}

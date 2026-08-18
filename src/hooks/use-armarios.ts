import { useQuery } from "@tanstack/react-query";

import { listArmarios } from "@/services/armario-service";
import type { ArmarioFiltros } from "@/types/armario";

export function useArmarios(filtros: ArmarioFiltros = {}) {
  return useQuery({
    queryKey: ["armarios", filtros],
    queryFn: () => listArmarios(filtros),
  });
}

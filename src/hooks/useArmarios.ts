import { useQuery } from "@tanstack/react-query";

import { armariosQueryKey } from "@/hooks/queryKeys";
import { listArmarios } from "@/services/armario.service";
import type { ArmarioFiltros } from "@/types/armario";

export function useArmarios(filtros: ArmarioFiltros = {}) {
  return useQuery({
    queryKey: [...armariosQueryKey, filtros],
    queryFn: () => listArmarios(filtros),
  });
}

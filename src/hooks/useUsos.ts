import { useQuery } from "@tanstack/react-query";

import { usosQueryKey } from "@/hooks/queryKeys";
import { listUsos } from "@/services/uso.service";
import type { UsoFiltros } from "@/types/armario";

export function useUsos(filtros: UsoFiltros = {}) {
  return useQuery({
    queryKey: [...usosQueryKey, filtros],
    queryFn: () => listUsos(filtros),
  });
}

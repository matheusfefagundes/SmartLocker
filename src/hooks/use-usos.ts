import { useQuery } from "@tanstack/react-query";

import { listUsos, type UsoFiltros } from "@/services/uso-service";

export function useUsos(filtros: UsoFiltros = {}) {
  return useQuery({
    queryKey: ["usos", filtros],
    queryFn: () => listUsos(filtros),
  });
}

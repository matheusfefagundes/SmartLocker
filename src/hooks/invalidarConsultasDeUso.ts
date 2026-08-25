import type { QueryClient } from "@tanstack/react-query";

import { armariosQueryKey, meuUsoQueryKey } from "@/hooks/queryKeys";

export function invalidarConsultasDeUso(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: meuUsoQueryKey }),
    queryClient.invalidateQueries({ queryKey: armariosQueryKey }),
  ]);
}

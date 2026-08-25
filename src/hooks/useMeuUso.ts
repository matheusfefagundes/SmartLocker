import { useQuery } from "@tanstack/react-query";

import { meuUsoQueryKey } from "@/hooks/queryKeys";
import { getMeuUsoAtivo } from "@/services/uso.service";

export function useMeuUso() {
  return useQuery({
    queryKey: meuUsoQueryKey,
    queryFn: getMeuUsoAtivo,
  });
}

import { useQuery } from "@tanstack/react-query";

import { getMeuUsoAtivo } from "@/services/uso-service";

export const meuUsoQueryKey = ["meu-uso"] as const;

export function useMeuUso() {
  return useQuery({
    queryKey: meuUsoQueryKey,
    queryFn: getMeuUsoAtivo,
  });
}

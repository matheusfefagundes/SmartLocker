import { useMutation, useQueryClient } from "@tanstack/react-query";

import { meuUsoQueryKey } from "@/hooks/use-meu-uso";
import { checkOut } from "@/services/uso-service";

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkOut,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meuUsoQueryKey }),
        queryClient.invalidateQueries({ queryKey: ["armarios"] }),
      ]);
    },
  });
}

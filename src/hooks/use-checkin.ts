import { useMutation, useQueryClient } from "@tanstack/react-query";

import { meuUsoQueryKey } from "@/hooks/use-meu-uso";
import { checkIn } from "@/services/uso-service";

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (armarioId: string) => checkIn(armarioId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meuUsoQueryKey }),
        queryClient.invalidateQueries({ queryKey: ["armarios"] }),
      ]);
    },
  });
}

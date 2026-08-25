import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidarConsultasDeUso } from "@/hooks/invalidarConsultasDeUso";
import { checkIn } from "@/services/uso.service";

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkIn,
    onSuccess: () => invalidarConsultasDeUso(queryClient),
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidarConsultasDeUso } from "@/hooks/invalidarConsultasDeUso";
import { checkOut } from "@/services/uso.service";

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkOut,
    onSuccess: () => invalidarConsultasDeUso(queryClient),
  });
}

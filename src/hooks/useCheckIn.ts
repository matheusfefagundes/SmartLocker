import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidarConsultasDeUso } from "@/hooks/invalidarConsultasDeUso";
import { checkIn } from "@/services/uso.service";
import { salvarPinLocal } from "@/utils/pinLocal";

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkIn,
    onSuccess: (uso) => {
      if (uso.pin) {
        salvarPinLocal(uso.id, {
          pin: uso.pin,
          pinExpiraEm: uso.pinExpiraEm ?? null,
        });
      }
      return invalidarConsultasDeUso(queryClient);
    },
  });
}

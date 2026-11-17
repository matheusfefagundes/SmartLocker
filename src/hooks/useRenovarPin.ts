import { useMutation } from "@tanstack/react-query";

import { renovarMeuPin } from "@/services/uso.service";
import { salvarPinLocal } from "@/utils/pinLocal";

export function useRenovarPin() {
  return useMutation({
    mutationFn: renovarMeuPin,
    onSuccess: ({ usoId, pin, pinExpiraEm }) =>
      salvarPinLocal(usoId, { pin, pinExpiraEm }),
  });
}

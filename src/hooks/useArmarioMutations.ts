import { useMutation, useQueryClient } from "@tanstack/react-query";

import { armariosQueryKey } from "@/hooks/queryKeys";
import {
  createArmario,
  deleteArmario,
  updateArmarioStatus,
} from "@/services/armario.service";
import type { CreateArmarioInput, UpdateArmarioInput } from "@/schemas/armario";

export function useCreateArmario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateArmarioInput) => createArmario(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: armariosQueryKey }),
  });
}

export function useUpdateArmarioStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      armarioId,
      dadosAtualizacao,
    }: {
      armarioId: string;
      dadosAtualizacao: UpdateArmarioInput;
    }) => updateArmarioStatus(armarioId, dadosAtualizacao),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: armariosQueryKey }),
  });
}

export function useDeleteArmario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteArmario(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: armariosQueryKey }),
  });
}

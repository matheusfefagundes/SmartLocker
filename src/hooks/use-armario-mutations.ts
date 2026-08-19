import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createArmario,
  deleteArmario,
  updateArmarioStatus,
} from "@/services/armario-service";
import type { CreateArmarioInput, UpdateArmarioInput } from "@/schemas/armario";

export function useCreateArmario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateArmarioInput) => createArmario(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["armarios"] }),
  });
}

export function useUpdateArmarioStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateArmarioInput }) =>
      updateArmarioStatus(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["armarios"] }),
  });
}

export function useDeleteArmario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteArmario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["armarios"] }),
  });
}

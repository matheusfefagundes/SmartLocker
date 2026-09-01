import { apiFetch } from "@/lib/apiClient";
import type { Armario, ArmarioFiltros } from "@/types/armario";
import type { CreateArmarioInput, UpdateArmarioInput } from "@/schemas/armario";
import { construirQueryString } from "@/utils/construirQueryString";

export function listArmarios(filtros: ArmarioFiltros = {}) {
  const query = construirQueryString({
    bloco: filtros.bloco,
    tamanho: filtros.tamanho,
    status: filtros.status,
  });
  return apiFetch<Armario[]>(`/api/armarios${query}`);
}

export function createArmario(input: CreateArmarioInput) {
  return apiFetch<Armario>("/api/armarios", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateArmario(id: string, input: UpdateArmarioInput) {
  return apiFetch<Armario>(`/api/armarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteArmario(id: string) {
  return apiFetch<void>(`/api/armarios/${id}`, { method: "DELETE" });
}

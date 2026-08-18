import { apiFetch } from "@/lib/api-client";
import type { Armario, ArmarioFiltros } from "@/types/armario";
import type { CreateArmarioInput, UpdateArmarioInput } from "@/schemas/armario";

export function listArmarios(filtros: ArmarioFiltros = {}) {
  const params = new URLSearchParams();
  if (filtros.bloco) params.set("bloco", filtros.bloco);
  if (filtros.tamanho) params.set("tamanho", filtros.tamanho);
  if (filtros.status) params.set("status", filtros.status);

  const query = params.toString();
  return apiFetch<Armario[]>(`/api/armarios${query ? `?${query}` : ""}`);
}

export function createArmario(input: CreateArmarioInput) {
  return apiFetch<Armario>("/api/armarios", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateArmarioStatus(id: string, input: UpdateArmarioInput) {
  return apiFetch<Armario>(`/api/armarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteArmario(id: string) {
  return apiFetch<void>(`/api/armarios/${id}`, { method: "DELETE" });
}

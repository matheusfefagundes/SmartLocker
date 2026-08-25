import { apiFetch } from "@/lib/apiClient";
import type { UsoArmarioComUsuario, UsoArmarioResumo, UsoFiltros } from "@/types/armario";
import { construirQueryString } from "@/utils/construirQueryString";

export function getMeuUsoAtivo() {
  return apiFetch<UsoArmarioResumo | null>("/api/usos/me");
}

export function checkIn(armarioId: string) {
  return apiFetch<UsoArmarioResumo>("/api/checkin", {
    method: "POST",
    body: JSON.stringify({ armarioId }),
  });
}

export function checkOut() {
  return apiFetch<UsoArmarioResumo>("/api/checkout", { method: "POST" });
}

export function listUsos(filtros: UsoFiltros = {}) {
  const query = construirQueryString({
    userId: filtros.userId,
    armarioId: filtros.armarioId,
    ativo: filtros.ativo !== undefined ? String(filtros.ativo) : undefined,
  });
  return apiFetch<UsoArmarioComUsuario[]>(`/api/usos${query}`);
}

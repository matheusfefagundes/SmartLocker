import { apiFetch } from "@/lib/api-client";
import type { UsoArmarioComUsuario, UsoArmarioResumo } from "@/types/armario";

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

export interface UsoFiltros {
  userId?: string;
  armarioId?: string;
  ativo?: boolean;
}

export function listUsos(filtros: UsoFiltros = {}) {
  const params = new URLSearchParams();
  if (filtros.userId) params.set("userId", filtros.userId);
  if (filtros.armarioId) params.set("armarioId", filtros.armarioId);
  if (filtros.ativo !== undefined) params.set("ativo", String(filtros.ativo));

  const query = params.toString();
  return apiFetch<UsoArmarioComUsuario[]>(`/api/usos${query ? `?${query}` : ""}`);
}

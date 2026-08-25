"use client";

import { CheckCircle2, LayoutGrid, User, Wrench } from "lucide-react";

import { StatBadge } from "./StatBadge";
import { StatCard } from "@/components/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useArmarios } from "@/hooks/useArmarios";
import type { StatusArmario } from "@/types/armario";

export function DashboardOverview() {
  const { data: armarios, isLoading } = useArmarios();

  const total = armarios?.length ?? 0;
  const contagemPorStatus = (status: StatusArmario) =>
    armarios?.filter((armario) => armario.status === status).length ?? 0;

  const blocos = Array.from(
    new Set((armarios ?? []).map((armario) => armario.bloco))
  ).sort();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ocupação</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral dos armários em tempo real.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total" value={total} icon={LayoutGrid} />
            <StatCard
              label="Livres"
              value={contagemPorStatus("LIVRE")}
              icon={CheckCircle2}
              className="text-status-livre"
            />
            <StatCard
              label="Ocupados"
              value={contagemPorStatus("OCUPADO")}
              icon={User}
              className="text-status-ocupado"
            />
            <StatCard
              label="Manutenção"
              value={contagemPorStatus("MANUTENCAO")}
              icon={Wrench}
              className="text-status-manutencao"
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bloco</TableHead>
                  <TableHead>Livres</TableHead>
                  <TableHead>Ocupados</TableHead>
                  <TableHead>Manutenção</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocos.map((bloco) => {
                  const doBloco = (armarios ?? []).filter(
                    (armario) => armario.bloco === bloco
                  );
                  return (
                    <TableRow key={bloco}>
                      <TableCell className="font-medium">{bloco}</TableCell>
                      <TableCell>
                        <StatBadge
                          value={
                            doBloco.filter((a) => a.status === "LIVRE").length
                          }
                          tone="livre"
                        />
                      </TableCell>
                      <TableCell>
                        <StatBadge
                          value={
                            doBloco.filter((a) => a.status === "OCUPADO")
                              .length
                          }
                          tone="ocupado"
                        />
                      </TableCell>
                      <TableCell>
                        <StatBadge
                          value={
                            doBloco.filter((a) => a.status === "MANUTENCAO")
                              .length
                          }
                          tone="manutencao"
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doBloco.length}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

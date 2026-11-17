import { vi } from "vitest";

type FnMock = ReturnType<typeof vi.fn>;
type ModeloMock = Record<string, FnMock>;

const METODOS = [
  "findUnique",
  "findFirst",
  "findMany",
  "create",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
] as const;

const MODELOS = [
  "user",
  "armario",
  "usoArmario",
  "ordemManutencao",
  "relatoProblemaArmario",
  "auditoriaLog",
  "tentativaAcesso",
  "armarioTelemetria",
  "inspecaoFisica",
  "unidade",
] as const;

export type PrismaMock = Record<(typeof MODELOS)[number], ModeloMock> & {
  $transaction: FnMock;
  $queryRaw: FnMock;
};

export function criarPrismaMock(): PrismaMock {
  const mock = {} as PrismaMock;
  for (const modelo of MODELOS) {
    mock[modelo] = Object.fromEntries(METODOS.map((m) => [m, vi.fn()]));
  }
  mock.tentativaAcesso.count.mockResolvedValue(0);
  mock.tentativaAcesso.deleteMany.mockResolvedValue({ count: 0 });
  mock.tentativaAcesso.create.mockResolvedValue({});
  mock.auditoriaLog.create.mockResolvedValue({});
  mock.$transaction = vi.fn(async (callback: (tx: PrismaMock) => unknown) =>
    callback(mock)
  );
  mock.$queryRaw = vi.fn();
  return mock;
}

export function resetarPrismaMock(mock: PrismaMock) {
  const novo = criarPrismaMock();
  Object.assign(mock, novo);
}

export interface UsuarioSessao {
  id: string;
  role: "ALUNO" | "ADMIN";
  unidadeId?: string | null;
  bloqueado?: boolean;
}

export function sessaoDe(usuario: UsuarioSessao) {
  return {
    user: {
      id: usuario.id,
      name: "Usuário de teste",
      email: `${usuario.id}@teste.local`,
      role: usuario.role,
      matricula: null,
      unidadeId: usuario.unidadeId ?? null,
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
  };
}

export function registroDoUsuario(usuario: UsuarioSessao) {
  return {
    role: usuario.role,
    unidadeId: usuario.unidadeId ?? null,
    bloqueado: usuario.bloqueado ?? false,
    anonimizado: false,
  };
}

export function requisicao(
  url: string,
  opcoes: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
) {
  const corpo =
    opcoes.body === undefined
      ? undefined
      : typeof opcoes.body === "string"
        ? opcoes.body
        : JSON.stringify(opcoes.body);
  return new Request(`http://localhost${url}`, {
    method: opcoes.method ?? (corpo ? "POST" : "GET"),
    body: corpo,
    headers: { "content-type": "application/json", ...opcoes.headers },
  });
}

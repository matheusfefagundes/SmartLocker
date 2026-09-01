export type Tamanho = "P" | "M" | "G";
export type StatusArmario = "LIVRE" | "OCUPADO" | "MANUTENCAO";

export interface Armario {
  id: string;
  numero: number;
  bloco: string;
  tamanho: Tamanho;
  status: StatusArmario;
  createdAt: string;
}

export interface UsoArmarioResumo {
  id: string;
  userId: string;
  armarioId: string;
  checkIn: string;
  checkOut: string | null;
  armario: Armario;
}

export interface UsoArmarioComUsuario extends UsoArmarioResumo {
  user: {
    id: string;
    nome: string;
    matricula: string | null;
  };
}

export interface ArmarioFiltros {
  bloco?: string;
  tamanho?: Tamanho;
  status?: StatusArmario;
}

export interface UsoFiltros {
  userId?: string;
  armarioId?: string;
  ativo?: boolean;
  pagina?: number;
  tamanhoPagina?: number;
}

export interface UsosPaginados {
  dados: UsoArmarioComUsuario[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

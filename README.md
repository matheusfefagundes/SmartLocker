# SmartLocker

Sistema de gestão inteligente de armários rotativos e diários para academias, desenvolvido para eliminar o uso indevido de armários como "fixos" e garantir a rotatividade justa do recurso entre os alunos.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)

---

## Contexto e Problema

Academias costumam disponibilizar armários **rotativos** e **diários** para que alunos guardem seus pertences durante o treino. Na prática, porém, é comum que alunos utilizem os armários como se fossem **fixos**, deixando objetos de um dia para o outro. Isso reduz a disponibilidade de armários para os demais usuários, gera insatisfação e dificulta a gestão do espaço pela equipe da academia.

O **SmartLocker** nasce para resolver esse problema, trazendo controle de ocupação em tempo real, regras claras de uso e ferramentas de gestão para a equipe operacional.

## Objetivo

Fornecer uma plataforma web que permita:

- Cadastrar e organizar os armários disponíveis na unidade;
- Controlar o ciclo de uso de cada armário (check-in / check-out) pelo próprio aluno;
- Garantir o cumprimento das regras de uso definidas pela academia;
- Dar visibilidade à administração sobre ocupação, uso indevido e necessidade de manutenção.

## Regras de Negócio

### Regra crítica (N1)
> Cada aluno só pode ocupar **1 armário por vez** e deve **liberar o uso ao sair da academia**.

### Regras complementares
- Um armário só pode ser ocupado por um aluno por vez (exclusividade mútua).
- O check-in vincula o aluno ao armário e registra o horário de início de uso.
- O check-out libera o armário automaticamente para o próximo aluno.
- Armários podem ser classificados por **tamanho** (P, M, G) e agrupados por **bloco** (ex.: Bloco A, Bloco B, Vestiário Feminino/Masculino).

## Arquitetura

O sistema foi planejado em camadas evolutivas (N1 → N2 → N3), começando por um MVP funcional e evoluindo para automações e regras de cobrança.

```
┌─────────────────────────────────────────────┐
│                 Cliente (Web)                 │
│      Next.js (App Router) + React + UI Kit    │
└───────────────────┬───────────────────────────┘
                     │ HTTPS / REST (API Routes)
┌───────────────────▼───────────────────────────┐
│              Camada de Aplicação               │
│   Next.js API Routes (Route Handlers) + Auth   │
│      Validação de regras de negócio (RN)       │
└───────────────────┬───────────────────────────┘
                     │ Prisma Client
┌───────────────────▼───────────────────────────┐
│                Camada de Dados                 │
│         Prisma ORM + PostgreSQL (16+)          │
└─────────────────────────────────────────────────┘
```

**Padrão adotado:** Fullstack Next.js — o front-end (React/App Router) e o back-end (API Routes / Route Handlers) convivem no mesmo projeto, com o Prisma atuando como camada de acesso a dados sobre o PostgreSQL.

## Stack Tecnológica

| Camada         | Tecnologia                          |
|----------------|--------------------------------------|
| Frontend       | Next.js 14 (App Router) + React 18   |
| Estilização    | Tailwind CSS                         |
| Backend/API    | Next.js API Routes (Route Handlers)  |
| ORM            | Prisma                               |
| Banco de dados | PostgreSQL                           |
| Autenticação   | NextAuth.js / JWT (a definir)        |
| Validação      | Zod                                  |
| Deploy         | Vercel (app) + Railway/Supabase (DB) |

## Modelo de Dados

Modelo inicial (N1), sujeito a evolução conforme o roadmap:

```prisma
model Aluno {
  id        String   @id @default(cuid())
  nome      String
  email     String   @unique
  matricula String   @unique
  createdAt DateTime @default(now())

  usos      UsoArmario[]
}

model Armario {
  id        String   @id @default(cuid())
  numero    Int
  bloco     String
  tamanho   Tamanho
  status    StatusArmario @default(LIVRE)
  createdAt DateTime @default(now())

  usos      UsoArmario[]
}

model UsoArmario {
  id           String    @id @default(cuid())
  alunoId      String
  armarioId    String
  checkIn      DateTime  @default(now())
  checkOut     DateTime?

  aluno        Aluno     @relation(fields: [alunoId], references: [id])
  armario      Armario   @relation(fields: [armarioId], references: [id])

  @@index([alunoId])
  @@index([armarioId])
}

enum Tamanho {
  P
  M
  G
}

enum StatusArmario {
  LIVRE
  OCUPADO
  MANUTENCAO
}
```

**Invariante de negócio garantida na aplicação:** um `Aluno` não pode ter mais de um `UsoArmario` com `checkOut = null` simultaneamente; um `Armario` não pode ter mais de um `UsoArmario` ativo ao mesmo tempo.

## Roadmap de Evolução

### N1 — MVP (atual)
- Cadastro de armários (número, bloco, tamanho)
- Check-in do armário pelo aluno ao iniciar o treino
- Check-out do armário ao final do uso
- Validação da regra "1 armário por aluno por vez"

### N2 — Gestão Operacional
- Liberação remota de armário para manutenção (painel administrativo)
- Alertas de armários ocupados fora do horário de funcionamento
- Painel de ocupação em tempo real para a equipe da academia
- Histórico de uso por aluno e por armário

### N3 — Automação e Cobrança
- Aplicação automática de taxa por pernoite (armário não liberado)
- Notificações push/e-mail para alunos com uso irregular
- Integração com catracas/controle de acesso da academia
- Relatórios gerenciais (taxa de ocupação, reincidência, etc.)

## Instalação e Uso

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm, yarn ou pnpm

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/smartlocker.git
cd smartlocker

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env com suas credenciais de banco

# 4. Rode as migrations do Prisma
npx prisma migrate dev

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/smartlocker"
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="http://localhost:3000"
```

## Estrutura do Projeto

```
smartlocker/
├── prisma/
│   ├── schema.prisma       # Modelo de dados
│   └── seed.ts             # Dados de exemplo
├── src/
│   ├── app/
│   │   ├── api/            # API Routes (armarios, checkin, checkout, alunos)
│   │   ├── (dashboard)/    # Painel administrativo
│   │   └── (app)/          # Área do aluno
│   ├── components/         # Componentes React reutilizáveis
│   ├── hooks/              # Hooks customizados (useArmarios, useCheckIn, useAuth)
|   ├── lib/                # Infraestrutura (Prisma client, auth, configs)
|   ├── providers/          # Context providers (Session, QueryClient, Theme)
|   ├── schemas/            # Schemas de validação Zod (armario, checkIn, aluno)
|   ├── services/           # Camada de serviços (chamadas às API Routes)
│   ├── types/              # Tipagens TypeScript
│   └── utils/              # Funções utilitárias (formatação, datas, helpers)
├── public/
├── .env.example
├── package.json
└── README.md
```

Desenvolvido como projeto acadêmico de Engenharia de Software.

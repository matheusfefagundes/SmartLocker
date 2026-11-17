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
- O check-in vincula o aluno ao armário, gera credencial física temporária (PIN de 6 dígitos e QR Code) e registra o horário de início de uso.
- O check-out libera o armário automaticamente para o próximo aluno e calcula eventual tarifa excedente após a franquia gratuita de 3 horas.
- Armários são classificados por **tamanho** (`P`, `M`, `G`), agrupados por **bloco** e isolados por **unidade/filial** (Multi-tenancy).
- O sistema monitora telemetria IoT (nível de bateria, temperatura e tempo de porta aberta), ciclos mecânicos de solenoide e periodicidade de higienização (a cada 30 usos ou 7 dias).
- Veja o detalhamento completo das 22 manutenções evolutivas, corretivas, preventivas e preditivas em [`docs/mapeamento-manutencoes.md`](./docs/mapeamento-manutencoes.md).

---

## Especificação de Requisitos

Este documento consolida a especificação técnica dos requisitos funcionais e não funcionais para o ecossistema SmartLocker. O escopo abrange desde a interface de administração baseada em componentes web até a arquitetura futura de IoT, integração de pagamentos e diretrizes de qualidade de software baseadas em normas reconhecidas da indústria (como a ISO/IEC 25010).

### 1. Requisitos Funcionais - Interface Base
Requisitos mapeados a partir da estrutura de interface web inicial para controle e gestão dos armários.

| ID | Funcionalidade | Descrição Detalhada |
| :--- | :--- | :--- |
| **RF01** | Gestão de Perfil | O sistema deve possuir um menu de navegação que permita ao usuário acessar configurações de conta, com exibição de avatar. |
| **RF02** | Monitoramento de Armários | O sistema deve listar os armários em formato de tabela, apresentando ID, status e histórico de uso. |
| **RF03** | Identificação de Status | Utilização de indicadores visuais (*badges*) para destacar a disponibilidade (ex.: Disponível, Ocupado, Manutenção). |
| **RF04** | Operações de Acesso | Ações rápidas para abrir, bloquear ou liberar um armário específico diretamente pela interface. |
| **RF05** | Interação via Modais | Caixas de diálogo para confirmar ações críticas antes da execução (ex.: confirmação de abertura). |
| **RF06** | Cadastro e Edição | Entrada e atualização de dados de usuários e lockers através de formulários padronizados. |
| **RF07** | Sistema de Notificações | Exibição de alertas temporários (*toasts*) sobre o resultado de operações sistêmicas. |

### 2. Requisitos Funcionais - Evolução IoT e Negócio
Requisitos focados no escalonamento do produto, integrando serviços externos e comunicação em tempo real com hardware.

| ID | Funcionalidade | Descrição Detalhada |
| :--- | :--- | :--- |
| **RF08** | Telemetria em Tempo Real | Processamento de dados de sensores (temperatura, bateria, status de porta) refletidos no painel. |
| **RF10** | Motor de Reservas | Agendamento de armários calculando tarifas baseadas no tempo e dimensões. |
| **RF11** | Integração de Pagamentos | Conexão com gateways externos para processamento de cartões e PIX, alterando o status da reserva. |
| **RF12** | Multi-tenancy | Suporte a múltiplos clientes ou filiais no mesmo painel, com isolamento lógico de dados. |
| **RF13** | Trilha de Auditoria | Registro contínuo e imutável de ações críticas, incluindo data, hora, usuário e endereço IP de origem. |

### 3. Requisitos Não Funcionais - Arquitetura e Qualidade
Diretrizes técnicas para assegurar manutenibilidade, segurança e alinhamento com padrões de qualidade de software, como os descritos pela norma ISO/IEC 25010.

| ID | Categoria | Descrição Detalhada |
| :--- | :--- | :--- |
| **RNF01** | Stack Frontend | Uso do framework Next.js (App Router) e React. |
| **RNF02** | Tipagem Estática | Implementação 100% em TypeScript para garantia e confiabilidade de tipos. |
| **RNF03** | Estilização UI | Uso de Tailwind CSS acoplado a um design system de componentes modulares acessíveis (ARIA). |
| **RNF04** | Comunicação IoT | Implementação de protocolo leve (MQTT ou WebSockets) para comunicação bidirecional com os armários físicos. |
| **RNF05** | Tolerância a Falhas | Operação offline de contingência, com sincronização assíncrona de dados após o restabelecimento da rede. |
| **RNF06** | Segurança e Privacidade | Dados criptografados, comunicação com protocolo TLS 1.2+ e conformidade com a LGPD. |
| **RNF07** | Escalabilidade de Dados | Arquitetura de banco de dados capaz de suportar alta carga de concorrência gerada pela telemetria contínua. |

---

## Arquitetura

O sistema foi planejado em camadas evolutivas (N1 → N2 → N3), começando por um MVP funcional e evoluindo para automações e regras de cobrança.

```
┌────────────────────────────────────────────────┐
│                Cliente (Web)                   │
│      Next.js (App Router) + React + UI Kit     │
└────────────────────┬───────────────────────────┘
                     │ HTTPS / REST (API Routes)
┌───────────────────▼────────────────────────────┐
│              Camada de Aplicação               │
│   Next.js API Routes (Route Handlers) + Auth   │
│      Validação de regras de negócio (RN)       │
└────────────────────┬───────────────────────────┘
                     │ Prisma Client
┌───────────────────▼────────────────────────────┐
│                Camada de Dados                 │
│         Prisma ORM + PostgreSQL (16+)          │
└────────────────────────────────────────────────┘
```

**Padrão adotado:** Fullstack Next.js — o front-end (React/App Router) e o back-end (API Routes / Route Handlers) convivem no mesmo projeto, com o Prisma atuando como camada de acesso a dados sobre o PostgreSQL.

## Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| Frontend | Next.js 14 (App Router) + React 18 |
| Estilização | Tailwind CSS + shadcn/ui, com suporte a dark mode |
| Backend/API | Next.js API Routes (Route Handlers) |
| ORM | Prisma |
| Banco de dados | PostgreSQL |
| Autenticação | NextAuth.js (Credentials Provider, sessão JWT) |
| Validação | Zod |
| Deploy | Vercel |

## Modelo de Dados

```prisma
enum Role {
  ALUNO
  ADMIN
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

model User {
  id           String   @id @default(cuid())
  nome         String
  email        String   @unique
  passwordHash String
  role         Role     @default(ALUNO)
  matricula    String?  @unique // obrigatória para ALUNO; nula para ADMIN
  createdAt    DateTime @default(now())

  usos UsoArmario[]
}

model Armario {
  id        String        @id @default(cuid())
  numero    Int
  bloco     String
  tamanho   Tamanho
  status    StatusArmario @default(LIVRE)
  createdAt DateTime      @default(now())

  usos UsoArmario[]

  @@unique([numero, bloco])
}

model UsoArmario {
  id        String    @id @default(cuid())
  userId    String
  armarioId String
  checkIn   DateTime  @default(now())
  checkOut  DateTime?

  user    User    @relation(fields: [userId], references: [id])
  armario Armario @relation(fields: [armarioId], references: [id])

  @@index([userId])
  @@index([armarioId])
}
```

**Invariante de negócio garantida na aplicação:** um `User` não pode ter mais de um `UsoArmario` com `checkOut = null` simultaneamente; um `Armario` não pode ter mais de um `UsoArmario` ativo ao mesmo tempo. O check-in usa um update condicional atômico (`status: "LIVRE"` na cláusula `where`) dentro de uma transação, protegendo contra check-in concorrente no mesmo armário.

O trecho acima é o núcleo da Etapa 1. O modelo completo está em `prisma/schema.prisma` e inclui `Unidade`, `OrdemManutencao`, `RelatoProblemaArmario`, `ArmarioTelemetria`, `AuditoriaLog` e `InspecaoFisica`. Desde a Etapa 3: status, tipos e categorias são `enum`; valores em dinheiro são `Decimal(10,2)`; o PIN é guardado só como hash (`pinHash`); a chave única do armário inclui a filial (`unidadeId, numero, bloco`); e `AuditoriaLog` tem um trigger que bloqueia `UPDATE` e `DELETE`.

## Instalação e Uso

### Pré-requisitos
- Node.js 22
- PostgreSQL 15+ (a migração usa `NULLS NOT DISTINCT`)
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

# 5. (Opcional) Popule o banco com dados de exemplo
npx prisma db seed

# 6. Inicie o servidor de desenvolvimento
npm run dev

# Testes e cobertura (mínimo de 80% em src/server e src/app/api)
npm test
npm run test:coverage
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

| Variável | Obrigatória | Uso |
| :--- | :--- | :--- |
| `DATABASE_URL` | Sim | Conexão do Prisma (no Neon, o host `-pooler`). |
| `DIRECT_URL` | Sim | Conexão direta usada por `prisma migrate` (no Neon, o host **sem** `-pooler`). |
| `NEXTAUTH_SECRET` | Sim | Assinatura da sessão; mínimo de 32 caracteres. |
| `NEXTAUTH_URL` | Sim | URL pública da aplicação. |
| `CRON_SECRET` | Produção | Autentica os jobs agendados (`Authorization: Bearer <CRON_SECRET>`). |
| `IOT_DEVICE_SECRET` | Com hardware | Gera o token de cada fechadura: `HMAC-SHA256(IOT_DEVICE_SECRET, armarioId)`. |
| `PIX_WEBHOOK_SECRET` | Com PIX | Valida o header `x-webhook-assinatura` = `HMAC-SHA256(PIX_WEBHOOK_SECRET, corpo)`. |
| `PIN_SECRET` | Não | Chave do hash do PIN; se vazia, usa `NEXTAUTH_SECRET`. |
| `MQTT_BROKER_URL` | Não | Broker MQTT verificado pelo `/api/health`; sem ele aparece "não configurado". |

Sem `CRON_SECRET`, `IOT_DEVICE_SECRET` ou `PIX_WEBHOOK_SECRET` as rotas correspondentes ficam fechadas (respondem 401/503), nunca abertas.

## Rotas da API

| Rota | Método | Quem chama | Autenticação |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | Visitante | Limite de 3 tentativas/10 min por IP |
| `/api/armarios` | GET / POST | Logado / Admin | Sessão (filtra pela filial da sessão) |
| `/api/armarios/[id]` | PATCH / DELETE | Admin | Sessão |
| `/api/armarios/[id]/forcar-liberacao` | POST | Admin | Sessão |
| `/api/armarios/[id]/abertura-emergencia` | POST | Admin | Sessão |
| `/api/armarios/[id]/higienizar` | POST | Admin | Sessão |
| `/api/armarios/validar-acesso` | POST | Fechadura | `x-dispositivo-token` + 5 tentativas/15 min por armário |
| `/api/checkin` | POST | Aluno | Sessão (devolve o PIN uma única vez) |
| `/api/checkout` | POST | Aluno | Sessão |
| `/api/usos` | GET | Admin | Sessão (paginado) |
| `/api/usos/me` | GET | Aluno | Sessão |
| `/api/usos/me/pin` | POST | Aluno | Sessão (gera novo PIN; o anterior deixa de valer) |
| `/api/perfil` | GET / PATCH | Logado | Sessão |
| `/api/usuarios` | GET / PATCH | Admin | Sessão |
| `/api/unidades` | GET / POST | Logado / Admin | Sessão |
| `/api/ordens-manutencao` | GET / POST / PATCH | Admin | Sessão |
| `/api/relatos-problema` | GET / POST | Admin / Logado | Sessão |
| `/api/inspecoes` | GET / POST | Admin | Sessão |
| `/api/auditoria` | GET | Admin | Sessão |
| `/api/lgpd/exportar` | GET | Logado | Sessão |
| `/api/lgpd/conta` | DELETE | Logado | Sessão |
| `/api/iot/telemetria` | GET / POST | Admin / Fechadura | Sessão / `x-dispositivo-token` |
| `/api/webhooks/pagamentos` | POST | Provedor PIX | `x-webhook-assinatura` (HMAC do corpo) |
| `/api/cron/verificar-armarios-abandonados` | GET / POST | Vercel Cron / Admin | `Bearer CRON_SECRET` ou sessão de admin |
| `/api/cron/expurgar-registros` | GET / POST | Vercel Cron / Admin | `Bearer CRON_SECRET` ou sessão de admin |
| `/api/health` | GET | Monitor externo | Pública |

Toda rota com sessão confere no banco, a cada requisição, se o usuário foi bloqueado ou anonimizado e qual é o seu papel e filial atuais.

## Jobs agendados

| Job | Onde roda | Quando |
| :--- | :--- | :--- |
| Verificação de abandono (MNT-03) | Vercel Cron (`vercel.json`) | Diário, 06:00 UTC |
| Expurgo e retenção (MNT-11) | Vercel Cron (`vercel.json`) | Diário, 05:00 UTC |
| Backup do PostgreSQL (MNT-13) | GitHub Actions (`manutencao-agendada.yml`) | Diário, 04:00 UTC; o arquivo fica 30 dias como artefato |
| Verificação de integridade (MNT-13) | GitHub Actions (`manutencao-agendada.yml`) | Segundas, 06:00 UTC |

Os jobs do GitHub Actions precisam do secret `DIRECT_URL` no repositório. Migrações só rodam no deploy de produção (`scripts/vercel-build.mjs`); previews de PR não alteram o banco.

## Integrações simuladas

Até haver hardware e contratos reais, três integrações são **simuladas** e aparecem assim na interface:

- **PIX**: o código "copia e cola" é fictício. O webhook já exige assinatura e confere o valor pago.
- **QR Code**: o desenho em "Meu armário" é ilustrativo e não é lido por leitores reais; a abertura é feita pelo PIN.
- **MQTT**: não há broker. O `/api/health` testa a conexão TCP apenas quando `MQTT_BROKER_URL` está definido.

## Estrutura do Projeto

```
smartlocker/
├── prisma/
│   ├── schema.prisma  # Modelo de dados
│   └── seed.ts         # Dados de exemplo (admin + alunos + armários)
├── src/
│   ├── app/
│   │   ├── api/            # API Routes (lista completa em "Rotas da API")
│   │   ├── (dashboard)/    # Painel administrativo (ocupação, armários, histórico)
│   │   ├── (app)/          # Área do aluno (armários, meu armário)
│   │   ├── login/          # Tela de login
│   │   └── registro/       # Tela de cadastro
│   ├── components/    # Componentes React compartilhados
│   │   └── ui/         # Primitivos shadcn/ui (button, card, dialog, table...)
│   ├── hooks/          # Hooks customizados (useArmarios, useCheckIn, useAuth...)
│   ├── lib/            # Infraestrutura: Prisma client, NextAuth, auth de API, helpers de rota
│   ├── providers/      # Context providers (Session, QueryClient, Theme)
│   ├── schemas/        # Schemas de validação Zod (armario, auth, checkin)
│   ├── server/         # Regras de negócio com Prisma (uso, armários, usuários, manutenção, tarifação, LGPD...)
│   ├── services/       # Camada de serviços client-side (fetch às API Routes)
│   ├── types/          # Tipagens TypeScript
│   ├── utils/          # Funções puras (formatação, datas, query strings, classes)
│   └── middleware.ts   # Autenticação e controle de acesso por papel (rota)
├── public/
├── .env.example
├── package.json
└── README.md
```

**Convenção de nomes:** componentes React em PascalCase (`ArmarioCard.tsx`), hooks/serviços/utilitários em camelCase (`useArmarios.ts`, `armario.service.ts`), sem hífen — exceto os primitivos de `components/ui/`, que seguem o padrão kebab-case gerado pela CLI do shadcn/ui e são deixados como estão para não conflitar com atualizações futuras do gerador. `src/server/` contém lógica com acesso direto ao Prisma e nunca deve ser importado por código client-side; `src/services/` é a camada equivalente do lado do cliente, feita só de chamadas `fetch` às API Routes.

Desenvolvido como projeto acadêmico de Engenharia de Software.

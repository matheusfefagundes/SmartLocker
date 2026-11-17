-- Etapa 3: correções do modelo de dados herdado do PR #2.
-- Converte colunas sem perder dados (ALTER ... USING) em vez de DROP/ADD.

-- 1. Enums no lugar de texto livre ------------------------------------------
CREATE TYPE "ModalidadeManutencao" AS ENUM ('PADRAO', 'MANUTENCAO_EMERGENCIAL', 'HIGIENIZACAO', 'PREDITIVA_BATERIA');
CREATE TYPE "StatusPagamento" AS ENUM ('ISENTO', 'PENDENTE', 'PAGO');
CREATE TYPE "CategoriaProblema" AS ENUM ('TRAVA_EMPERRADA', 'PORTA_DANIFICADA', 'SUJEIRA', 'OUTRO');
CREATE TYPE "TipoOrdemManutencao" AS ENUM ('CORRETIVA', 'PREVENTIVA', 'PREDITIVA', 'MANUTENCAO_EMERGENCIAL', 'HIGIENIZACAO');
CREATE TYPE "StatusOrdemManutencao" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA', 'CONCLUIDA');

ALTER TABLE "Armario"
  ALTER COLUMN "modalidadeManutencao" TYPE "ModalidadeManutencao"
  USING "modalidadeManutencao"::"ModalidadeManutencao";

ALTER TABLE "UsoArmario" ALTER COLUMN "statusPagamento" DROP DEFAULT;
ALTER TABLE "UsoArmario"
  ALTER COLUMN "statusPagamento" TYPE "StatusPagamento"
  USING "statusPagamento"::"StatusPagamento";
ALTER TABLE "UsoArmario" ALTER COLUMN "statusPagamento" SET DEFAULT 'ISENTO';

ALTER TABLE "RelatoProblemaArmario"
  ALTER COLUMN "categoria" TYPE "CategoriaProblema"
  USING "categoria"::"CategoriaProblema";

ALTER TABLE "OrdemManutencao"
  ALTER COLUMN "tipo" TYPE "TipoOrdemManutencao"
  USING "tipo"::"TipoOrdemManutencao";

ALTER TABLE "OrdemManutencao" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "OrdemManutencao"
  ALTER COLUMN "status" TYPE "StatusOrdemManutencao"
  USING "status"::"StatusOrdemManutencao";
ALTER TABLE "OrdemManutencao" ALTER COLUMN "status" SET DEFAULT 'ABERTA';

-- 2. Dinheiro em Decimal (sem perder centavos) ------------------------------
ALTER TABLE "UsoArmario" ALTER COLUMN "valorCobrado" SET DATA TYPE DECIMAL(10,2);
ALTER TABLE "OrdemManutencao" ALTER COLUMN "custo" SET DATA TYPE DECIMAL(10,2);

-- 3. Pagamento: valor pago e data, separados do valor cobrado (DT-05) --------
ALTER TABLE "UsoArmario"
  ADD COLUMN "valorPago" DECIMAL(10,2),
  ADD COLUMN "pagoEm" TIMESTAMP(3);

-- 4. PIN salvo como hash (DT-02) -------------------------------------------
-- PINs antigos em texto puro são descartados; o aluno gera um novo no app.
ALTER TABLE "UsoArmario" DROP COLUMN "pinAcesso";
ALTER TABLE "UsoArmario" ADD COLUMN "pinHash" TEXT;

-- 5. Filial na chave única do armário (DT-08) -------------------------------
-- NULLS NOT DISTINCT (PostgreSQL 15+) mantém a unicidade entre armários sem filial.
DROP INDEX "Armario_numero_bloco_key";
CREATE UNIQUE INDEX "Armario_unidadeId_numero_bloco_key"
  ON "Armario"("unidadeId", "numero", "bloco") NULLS NOT DISTINCT;

-- 6. Auditoria realmente imutável (MNT-18) ----------------------------------
CREATE OR REPLACE FUNCTION auditoria_log_somente_insercao()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditoriaLog é append-only: % não é permitido', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuditoriaLog_somente_insercao"
  BEFORE UPDATE OR DELETE ON "AuditoriaLog"
  FOR EACH ROW EXECUTE FUNCTION auditoria_log_somente_insercao();

-- 7. Espalha a data inicial de higienização ---------------------------------
-- A migração anterior deu a mesma data a todos os armários; sem isto, todos
-- entrariam em higienização no mesmo dia, 7 dias após o deploy.
UPDATE "Armario"
SET "ultimaHigienizacaoEm" = NOW() - (abs(hashtext("id")) % 7) * INTERVAL '1 day'
WHERE "usosDesdeHigienizacao" = 0;

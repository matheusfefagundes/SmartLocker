-- CreateTable
CREATE TABLE "TentativaAcesso" (
    "id" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativaAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TentativaAcesso_identificador_criadoEm_idx" ON "TentativaAcesso"("identificador", "criadoEm");

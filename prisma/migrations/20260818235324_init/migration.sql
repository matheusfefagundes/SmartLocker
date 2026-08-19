-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ALUNO', 'ADMIN');

-- CreateEnum
CREATE TYPE "Tamanho" AS ENUM ('P', 'M', 'G');

-- CreateEnum
CREATE TYPE "StatusArmario" AS ENUM ('LIVRE', 'OCUPADO', 'MANUTENCAO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ALUNO',
    "matricula" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Armario" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "bloco" TEXT NOT NULL,
    "tamanho" "Tamanho" NOT NULL,
    "status" "StatusArmario" NOT NULL DEFAULT 'LIVRE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Armario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsoArmario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "armarioId" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOut" TIMESTAMP(3),

    CONSTRAINT "UsoArmario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_matricula_key" ON "User"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Armario_numero_bloco_key" ON "Armario"("numero", "bloco");

-- CreateIndex
CREATE INDEX "UsoArmario_userId_idx" ON "UsoArmario"("userId");

-- CreateIndex
CREATE INDEX "UsoArmario_armarioId_idx" ON "UsoArmario"("armarioId");

-- AddForeignKey
ALTER TABLE "UsoArmario" ADD CONSTRAINT "UsoArmario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsoArmario" ADD CONSTRAINT "UsoArmario_armarioId_fkey" FOREIGN KEY ("armarioId") REFERENCES "Armario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - The values [ABERTO] on the enum `ReferralStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "AtendidoStatus" AS ENUM ('ATIVO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "AtendidoOrigin" AS ENUM ('DEMANDA_ESPONTANEA', 'ESCOLA', 'CONSELHO_TUTELAR', 'CRAS', 'EQUIPE_KADIZ', 'OUTRO');

-- CreateEnum
CREATE TYPE "AtendidoExitType" AS ENUM ('OBJETIVOS_ALCANCADOS', 'TRANSFERENCIA_REDE', 'EVASAO', 'DESLIGAMENTO');

-- CreateEnum
CREATE TYPE "PiaAreaType" AS ENUM ('DOCUMENTACAO', 'SAUDE', 'SAUDE_MENTAL', 'EDUCACAO', 'CONVIVENCIA_FAMILIAR', 'ASSISTENCIA_SOCIAL', 'MORADIA', 'TRABALHO_RENDA_FAMILIA', 'PROTECAO_DIREITOS', 'OUTRAS');

-- CreateEnum
CREATE TYPE "PiaAreaStatus" AS ENUM ('SEM_DEMANDA', 'IDENTIFICADA', 'EM_ACOMPANHAMENTO', 'RESOLVIDA');

-- CreateEnum
CREATE TYPE "PiaGoalEvaluation" AS ENUM ('NAO_INICIADA', 'EM_ANDAMENTO', 'ALCANCADA', 'NAO_ALCANCADA');

-- CreateEnum
CREATE TYPE "SignatureSignerType" AS ENUM ('USUARIO', 'PROFISSIONAL');

-- Replace the phase-one placeholder enum; no table used it before this migration.
DROP TYPE "ReferralStatus";
CREATE TYPE "ReferralStatus" AS ENUM ('AGUARDANDO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Atendido" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "status" "AtendidoStatus" NOT NULL DEFAULT 'ATIVO',
    "ingressoDate" DATE NOT NULL,
    "origem" "AtendidoOrigin",
    "responsavelTecnicoId" TEXT,
    "nextReviewDate" DATE,
    "closeDate" DATE,
    "closeType" "AtendidoExitType",
    "closeReason" TEXT,
    "familyIncome" DECIMAL(10,2),
    "incomeSources" TEXT,
    "nis" TEXT,
    "bolsaFamilia" BOOLEAN NOT NULL DEFAULT false,
    "otherBenefits" TEXT,
    "crasReference" TEXT,
    "conselhoTutelar" BOOLEAN NOT NULL DEFAULT false,
    "conselhoTutelarNotes" TEXT,
    "housingType" "HousingType",
    "housingNotes" TEXT,
    "vulnerabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentSituation" TEXT,
    "familyHistory" TEXT,
    "potentialities" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Atendido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiaArea" (
    "id" TEXT NOT NULL,
    "atendidoId" TEXT NOT NULL,
    "area" "PiaAreaType" NOT NULL,
    "necessidade" TEXT,
    "acoes" TEXT,
    "prazoResponsavel" TEXT,
    "status" "PiaAreaStatus" NOT NULL DEFAULT 'SEM_DEMANDA',

    CONSTRAINT "PiaArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiaGoal" (
    "id" TEXT NOT NULL,
    "atendidoId" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "meta" TEXT,
    "acoes" TEXT,
    "prazo" DATE,
    "avaliacao" "PiaGoalEvaluation" NOT NULL DEFAULT 'NAO_INICIADA',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PiaGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Encaminhamento" (
    "id" TEXT NOT NULL,
    "atendidoId" TEXT NOT NULL,
    "area" "Area" NOT NULL,
    "destination" "ReferralDestination" NOT NULL,
    "destinationDetail" TEXT,
    "reason" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "returnNotes" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Encaminhamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atendimento" (
    "id" TEXT NOT NULL,
    "area" "Area" NOT NULL,
    "type" "AtendimentoType" NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT,
    "durationMin" INTEGER,
    "status" "AtendimentoStatus" NOT NULL DEFAULT 'AGENDADO',
    "summary" TEXT,
    "professionalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evolucao" (
    "id" TEXT NOT NULL,
    "atendidoId" TEXT NOT NULL,
    "area" "Area" NOT NULL,
    "authorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "content" TEXT NOT NULL,
    "newGoals" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evolucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiaReview" (
    "id" TEXT NOT NULL,
    "atendidoId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "changes" TEXT NOT NULL,
    "newGoals" TEXT,
    "responsavel" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PiaReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiaSignature" (
    "id" TEXT NOT NULL,
    "atendidoId" TEXT NOT NULL,
    "signerType" "SignatureSignerType" NOT NULL,
    "signerName" TEXT NOT NULL,
    "userId" TEXT,
    "imageDataUrl" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PiaSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtendidoChange" (
    "id" TEXT NOT NULL,
    "atendidoId" TEXT NOT NULL,
    "userId" TEXT,
    "section" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtendidoChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiaPdf" (
    "id" TEXT NOT NULL,
    "atendidoId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PiaPdf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AtendidoToAtendimento" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AtendidoToAtendimento_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Atendido_alunoId_key" ON "Atendido"("alunoId");

-- CreateIndex
CREATE INDEX "Atendido_status_nextReviewDate_idx" ON "Atendido"("status", "nextReviewDate");

-- CreateIndex
CREATE INDEX "Atendido_responsavelTecnicoId_idx" ON "Atendido"("responsavelTecnicoId");

-- CreateIndex
CREATE UNIQUE INDEX "PiaArea_atendidoId_area_key" ON "PiaArea"("atendidoId", "area");

-- CreateIndex
CREATE INDEX "PiaGoal_atendidoId_order_idx" ON "PiaGoal"("atendidoId", "order");

-- CreateIndex
CREATE INDEX "Encaminhamento_atendidoId_date_idx" ON "Encaminhamento"("atendidoId", "date");

-- CreateIndex
CREATE INDEX "Encaminhamento_area_status_date_idx" ON "Encaminhamento"("area", "status", "date");

-- CreateIndex
CREATE INDEX "Atendimento_area_date_status_idx" ON "Atendimento"("area", "date", "status");

-- CreateIndex
CREATE INDEX "Atendimento_professionalId_date_idx" ON "Atendimento"("professionalId", "date");

-- CreateIndex
CREATE INDEX "Evolucao_atendidoId_date_idx" ON "Evolucao"("atendidoId", "date");

-- CreateIndex
CREATE INDEX "Evolucao_area_date_idx" ON "Evolucao"("area", "date");

-- CreateIndex
CREATE INDEX "PiaReview_atendidoId_date_idx" ON "PiaReview"("atendidoId", "date");

-- CreateIndex
CREATE INDEX "PiaSignature_atendidoId_signedAt_idx" ON "PiaSignature"("atendidoId", "signedAt");

-- CreateIndex
CREATE INDEX "AtendidoChange_atendidoId_createdAt_idx" ON "AtendidoChange"("atendidoId", "createdAt");

-- CreateIndex
CREATE INDEX "PiaPdf_atendidoId_createdAt_idx" ON "PiaPdf"("atendidoId", "createdAt");

-- CreateIndex
CREATE INDEX "_AtendidoToAtendimento_B_index" ON "_AtendidoToAtendimento"("B");

-- AddForeignKey
ALTER TABLE "Atendido" ADD CONSTRAINT "Atendido_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendido" ADD CONSTRAINT "Atendido_responsavelTecnicoId_fkey" FOREIGN KEY ("responsavelTecnicoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendido" ADD CONSTRAINT "Atendido_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiaArea" ADD CONSTRAINT "PiaArea_atendidoId_fkey" FOREIGN KEY ("atendidoId") REFERENCES "Atendido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiaGoal" ADD CONSTRAINT "PiaGoal_atendidoId_fkey" FOREIGN KEY ("atendidoId") REFERENCES "Atendido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encaminhamento" ADD CONSTRAINT "Encaminhamento_atendidoId_fkey" FOREIGN KEY ("atendidoId") REFERENCES "Atendido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atendimento" ADD CONSTRAINT "Atendimento_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evolucao" ADD CONSTRAINT "Evolucao_atendidoId_fkey" FOREIGN KEY ("atendidoId") REFERENCES "Atendido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evolucao" ADD CONSTRAINT "Evolucao_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiaReview" ADD CONSTRAINT "PiaReview_atendidoId_fkey" FOREIGN KEY ("atendidoId") REFERENCES "Atendido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiaReview" ADD CONSTRAINT "PiaReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiaSignature" ADD CONSTRAINT "PiaSignature_atendidoId_fkey" FOREIGN KEY ("atendidoId") REFERENCES "Atendido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiaSignature" ADD CONSTRAINT "PiaSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtendidoChange" ADD CONSTRAINT "AtendidoChange_atendidoId_fkey" FOREIGN KEY ("atendidoId") REFERENCES "Atendido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtendidoChange" ADD CONSTRAINT "AtendidoChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiaPdf" ADD CONSTRAINT "PiaPdf_atendidoId_fkey" FOREIGN KEY ("atendidoId") REFERENCES "Atendido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AtendidoToAtendimento" ADD CONSTRAINT "_AtendidoToAtendimento_A_fkey" FOREIGN KEY ("A") REFERENCES "Atendido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AtendidoToAtendimento" ADD CONSTRAINT "_AtendidoToAtendimento_B_fkey" FOREIGN KEY ("B") REFERENCES "Atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

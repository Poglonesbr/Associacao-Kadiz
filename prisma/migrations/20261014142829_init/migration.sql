-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COORDENADOR', 'SECRETARIA', 'PROFESSOR', 'PSICOLOGO', 'ASSISTENTE_SOCIAL', 'FINANCEIRO');

-- CreateEnum
CREATE TYPE "PoloType" AS ENUM ('SEDE', 'ESCOLA_POLO');

-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('MANHA', 'TARDE', 'NOITE');

-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('FUTEBOL', 'FUTSAL', 'XADREZ', 'REFORCO_ESCOLAR', 'HORTA', 'OUTRO');

-- CreateEnum
CREATE TYPE "Vinculo" AS ENUM ('PARTICULAR', 'PROJETO_SOCIAL');

-- CreateEnum
CREATE TYPE "AlunoStatus" AS ENUM ('ATIVO', 'INATIVO', 'LISTA_ESPERA', 'DESLIGADO');

-- CreateEnum
CREATE TYPE "SchoolShift" AS ENUM ('MATUTINO', 'VESPERTINO');

-- CreateEnum
CREATE TYPE "DominantFoot" AS ENUM ('DESTRO', 'CANHOTO', 'AMBIDESTRO');

-- CreateEnum
CREATE TYPE "GuardianRelation" AS ENUM ('MAE', 'PAI', 'AVO', 'TIO', 'IRMAO', 'TUTOR', 'OUTRO');

-- CreateEnum
CREATE TYPE "HousingType" AS ENUM ('PROPRIA', 'ALUGADA', 'CEDIDA', 'OCUPACAO', 'OUTRA');

-- CreateEnum
CREATE TYPE "StudentDocumentType" AS ENUM ('FICHA_CADASTRAL', 'RG', 'COMPROVANTE_RESIDENCIA', 'ATESTADO_MEDICO', 'CARTEIRA_VACINACAO', 'CARTAO_SUS', 'BOLETIM_ESCOLAR', 'ELETROCARDIOGRAMA', 'FOTO', 'TERMO_RESPONSABILIDADE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDENTE', 'ENTREGUE', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENTE', 'FALTA', 'FALTA_JUSTIFICADA');

-- CreateEnum
CREATE TYPE "Area" AS ENUM ('PSICOLOGIA', 'SERVICO_SOCIAL');

-- CreateEnum
CREATE TYPE "AtendimentoStatus" AS ENUM ('AGENDADO', 'REALIZADO', 'FALTOU', 'CANCELADO');

-- CreateEnum
CREATE TYPE "AtendimentoType" AS ENUM ('INDIVIDUAL', 'GRUPOTERAPIA', 'FAMILIAR', 'RODA_CONVERSA', 'APOIO_COMPETICAO', 'OFICINA_FAMILIAS', 'ESCUTA_QUALIFICADA', 'ACOLHIMENTO', 'VISITA_DOMICILIAR', 'ORIENTACAO_FAMILIAR', 'ARTICULACAO_REDE');

-- CreateEnum
CREATE TYPE "ReferralDestination" AS ENUM ('CRAS', 'CREAS', 'CAPSI', 'UBS', 'CONSELHO_TUTELAR', 'ESCOLA', 'PSICOLOGIA_INTERNA', 'SERVICO_SOCIAL_INTERNO', 'OUTRO');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "AccessAction" AS ENUM ('VIEW', 'CREATE', 'UPDATE', 'GRANT', 'REVOKE');

-- CreateEnum
CREATE TYPE "StockCategory" AS ENUM ('UNIFORME', 'DOACAO', 'MATERIAL_ESPORTIVO', 'ALIMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'DINHEIRO', 'CARTAO', 'BOLETO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "FinanceType" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('TREINO', 'JOGO', 'EVENTO', 'REUNIAO', 'OFICINA_FAMILIAS', 'SABADO_EM_FAMILIA', 'OUTRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "professionalRegistry" TEXT,
    "jobTitle" TEXT,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "accessPsicologia" BOOLEAN NOT NULL DEFAULT false,
    "accessServicoSocial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Polo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PoloType" NOT NULL,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Polo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turma" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "poloId" TEXT NOT NULL,
    "professorId" TEXT,
    "shift" "Shift" NOT NULL,
    "weekdays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "modality" "Modality" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aluno" (
    "id" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "vinculo" "Vinculo" NOT NULL,
    "status" "AlunoStatus" NOT NULL DEFAULT 'ATIVO',
    "poloId" TEXT NOT NULL,
    "turmaId" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3),
    "fullName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "sex" TEXT,
    "ethnicity" TEXT,
    "naturalidade" TEXT,
    "address" TEXT,
    "addressNumber" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "school" TEXT,
    "schoolGrade" TEXT,
    "schoolShift" "SchoolShift",
    "position" TEXT,
    "shirtNumber" TEXT,
    "dominantFoot" "DominantFoot",
    "weekdays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "guardianName" TEXT NOT NULL,
    "guardianRelation" "GuardianRelation" NOT NULL,
    "householdSize" INTEGER,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "guardianCpf" TEXT,
    "motherName" TEXT,
    "motherJob" TEXT,
    "motherPhone" TEXT,
    "fatherName" TEXT,
    "fatherJob" TEXT,
    "fatherPhone" TEXT,
    "otherGuardian" TEXT,
    "hasHealthPlan" BOOLEAN,
    "bloodType" TEXT,
    "chronicDisease" TEXT,
    "continuousMedication" TEXT,
    "allergies" TEXT,
    "foodRestrictions" TEXT,
    "surgeries" TEXT,
    "psychFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "difficulties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficultiesOther" TEXT,
    "susCard" TEXT,
    "medicalNotes" TEXT,
    "emergencyName" TEXT,
    "emergencyRelation" TEXT,
    "emergencyPhone" TEXT,
    "authTrips" BOOLEAN NOT NULL DEFAULT false,
    "authImage" BOOLEAN NOT NULL DEFAULT false,
    "authTermsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "monthlyFee" DECIMAL(10,2),
    "billingDay" INTEGER,
    "invoiceName" TEXT,
    "invoiceCpf" TEXT,
    "invoiceEmail" TEXT,
    "hasUniform" BOOLEAN NOT NULL DEFAULT false,
    "exitDate" TIMESTAMP(3),
    "exitReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDocument" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "type" "StudentDocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDENTE',
    "filePath" TEXT,
    "fileName" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "reviewedById" TEXT,

    CONSTRAINT "StudentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "takenById" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "justification" TEXT,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AccessAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "alunoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "StockCategory" NOT NULL,
    "size" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "alunoId" TEXT,
    "donor" TEXT,
    "reason" TEXT,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "referenceMonth" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDENTE',
    "paidAt" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod",
    "notes" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceEntry" (
    "id" TEXT NOT NULL,
    "type" "FinanceType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIA',
    "status" "TaskStatus" NOT NULL DEFAULT 'ABERTA',
    "dueDate" TIMESTAMP(3),
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "category" "EventCategory" NOT NULL DEFAULT 'OUTRO',
    "poloId" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snack" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "menu" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Turma_poloId_idx" ON "Turma"("poloId");

-- CreateIndex
CREATE INDEX "Turma_professorId_idx" ON "Turma"("professorId");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_matricula_key" ON "Aluno"("matricula");

-- CreateIndex
CREATE INDEX "Aluno_fullName_idx" ON "Aluno"("fullName");

-- CreateIndex
CREATE INDEX "Aluno_poloId_turmaId_vinculo_status_idx" ON "Aluno"("poloId", "turmaId", "vinculo", "status");

-- CreateIndex
CREATE INDEX "StudentDocument_status_type_idx" ON "StudentDocument"("status", "type");

-- CreateIndex
CREATE UNIQUE INDEX "StudentDocument_alunoId_type_key" ON "StudentDocument"("alunoId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_turmaId_date_key" ON "AttendanceSession"("turmaId", "date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_alunoId_status_idx" ON "AttendanceRecord"("alunoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_alunoId_key" ON "AttendanceRecord"("sessionId", "alunoId");

-- CreateIndex
CREATE INDEX "AccessLog_userId_createdAt_idx" ON "AccessLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_resource_createdAt_idx" ON "AccessLog"("resource", "createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_alunoId_createdAt_idx" ON "AccessLog"("alunoId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_itemId_date_idx" ON "StockMovement"("itemId", "date");

-- CreateIndex
CREATE INDEX "Invoice_status_dueDate_idx" ON "Invoice"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_alunoId_referenceMonth_key" ON "Invoice"("alunoId", "referenceMonth");

-- CreateIndex
CREATE INDEX "FinanceEntry_date_type_idx" ON "FinanceEntry"("date", "type");

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_takenById_fkey" FOREIGN KEY ("takenById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_poloId_fkey" FOREIGN KEY ("poloId") REFERENCES "Polo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

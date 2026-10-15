import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import { AccessAction, Area } from "@prisma/client";
import { NextRequest } from "next/server";
import { formatBrazilianDate } from "@/lib/dates";
import { labelFor } from "@/lib/labels";
import { formatBrazilianCurrency } from "@/lib/money";
import { getTechnicalAreas, isTecnico } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireTecnico } from "@/lib/guards";
import { isAtendidoEligible } from "@/lib/technical-access";
import { logAccess } from "@/lib/audit";

export const runtime = "nodejs";

type PdfRecord = NonNullable<Awaited<ReturnType<typeof loadRecord>>>;

async function loadRecord(id: string, areas: Area[]) {
  return prisma.atendido.findUnique({
    where: { id },
    include: {
      aluno: { include: { polo: true, turma: true } },
      areas: { orderBy: { area: "asc" } },
      goals: { orderBy: { order: "asc" } },
      encaminhamentos: { orderBy: { date: "asc" } },
      evolucoes: {
        where: { area: { in: areas } },
        include: { author: { select: { name: true } } },
        orderBy: { date: "asc" },
      },
      responsavelTecnico: { select: { name: true, jobTitle: true, professionalRegistry: true } },
      reviews: { include: { author: { select: { name: true } } }, orderBy: { date: "asc" } },
      signatures: {
        include: { user: { select: { professionalRegistry: true } } },
        orderBy: { signedAt: "asc" },
      },
    },
  });
}

async function renderPdf(record: PdfRecord) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 42,
    bufferPages: true,
    info: { Title: `PIA — ${record.aluno.fullName}`, Author: "Associação Kadiz" },
  });
  const chunks: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const heading = (number: number, title: string) => {
    doc.moveDown(0.7);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#157347").text(`${number}. ${title}`);
    doc.moveDown(0.25);
    doc.font("Helvetica").fontSize(9).fillColor("#262626");
  };
  const line = (label: string, value?: string | null) => {
    if (!value) return;
    doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
    doc.font("Helvetica").text(value);
  };

  doc.font("Helvetica-Bold").fontSize(17).fillColor("#10241d").text("PLANO INDIVIDUAL DE ATENDIMENTO (PIA)");
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(9).fillColor("#555").text("ASSOCIAÇÃO KADIZ · DOCUMENTO CONFIDENCIAL");
  doc.moveDown(0.8);

  let sectionNumber = 0;
  const nextHeading = (title: string) => heading(++sectionNumber, title);
  nextHeading("Identificação e dados socioeconômicos");
  line("Nome", record.aluno.fullName);
  line("Nome social", record.aluno.socialName);
  line("Matrícula", record.aluno.matricula);
  line("Nascimento", formatBrazilianDate(record.aluno.birthDate));
  line("CPF / RG", [record.aluno.cpf, record.aluno.rg].filter(Boolean).join(" / ") || null);
  line("Polo / turma", `${record.aluno.polo.name}${record.aluno.turma ? ` / ${record.aluno.turma.name}` : ""}`);
  line("Responsável", record.aluno.guardianName);
  line("Telefone / contato", record.aluno.guardianPhone);
  line("E-mail", record.aluno.guardianEmail);
  line("Mãe", record.aluno.motherName);
  line("Pai", record.aluno.fatherName);
  line(
    "Endereço",
    [
      record.aluno.address,
      record.aluno.addressNumber,
      record.aluno.neighborhood,
      record.aluno.city,
      record.aluno.state,
      record.aluno.postalCode ? `CEP ${record.aluno.postalCode}` : null,
    ]
      .filter(Boolean)
      .join(", "),
  );
  line("Escola", record.aluno.school);
  line(
    "Série / turno",
    [record.aluno.schoolGrade, record.aluno.schoolShift ? labelFor(record.aluno.schoolShift) : null]
      .filter(Boolean)
      .join(" / "),
  );
  line("Pessoas na residência", record.aluno.householdSize?.toString());
  line("Ingresso no acompanhamento", formatBrazilianDate(record.ingressoDate));
  line(
    "Profissional responsável",
    record.responsavelTecnico
      ? [
          record.responsavelTecnico.name,
          record.responsavelTecnico.jobTitle,
          record.responsavelTecnico.professionalRegistry,
        ]
          .filter(Boolean)
          .join(" · ")
      : null,
  );
  line("Origem", record.origem ? labelFor(record.origem) : null);
  line("Renda familiar", record.familyIncome === null ? null : formatBrazilianCurrency(record.familyIncome));
  line("Fontes de renda", record.incomeSources);
  line("NIS", record.nis);
  line("Bolsa Família", record.bolsaFamilia ? "Sim" : "Não");
  line("Outros benefícios", record.otherBenefits);
  line("Referência CRAS", record.crasReference);
  line("Conselho Tutelar", record.conselhoTutelar ? record.conselhoTutelarNotes || "Sim" : "Não");
  line("Moradia", record.housingType ? labelFor(record.housingType) : null);
  line("Observações sobre moradia", record.housingNotes);
  line("Vulnerabilidades", record.vulnerabilities.map(labelFor).join(", "));

  if ([record.currentSituation, record.familyHistory, record.potentialities].some((value) => value?.trim())) {
    nextHeading("Situação atual e histórico");
    line("Situação atual", record.currentSituation);
    line("Histórico familiar", record.familyHistory);
    line("Potencialidades", record.potentialities);
  }

  const populatedAreas = record.areas.filter((area) =>
    [area.necessidade, area.acoes, area.prazoResponsavel].some((value) => value?.trim()),
  );
  if (populatedAreas.length) {
    nextHeading("Áreas de atendimento e avaliação");
    for (const area of populatedAreas) {
      doc.font("Helvetica-Bold").text(labelFor(area.area));
      line("Situação / necessidade", area.necessidade);
      line("Ações / encaminhamentos", area.acoes);
      line("Prazo / responsável", area.prazoResponsavel);
      doc.moveDown(0.25);
    }
  }

  if (record.goals.length) {
    nextHeading("Objetivos e metas");
    for (const goal of record.goals) {
      doc.font("Helvetica-Bold").text(goal.objetivo);
      line("Meta", goal.meta);
      line("Ações", goal.acoes);
      line("Prazo", formatBrazilianDate(goal.prazo));
      line("Avaliação", labelFor(goal.avaliacao));
      doc.moveDown(0.25);
    }
  }

  if (record.encaminhamentos.length) {
    nextHeading("Encaminhamentos");
    for (const referral of record.encaminhamentos) {
      line("Data / área", `${formatBrazilianDate(referral.date)} · ${labelFor(referral.area)}`);
      line(
        "Destino",
        `${labelFor(referral.destination)}${referral.destinationDetail ? ` · ${referral.destinationDetail}` : ""}`,
      );
      line("Motivo", referral.reason);
      line("Retorno", referral.returnNotes);
      line("Situação", labelFor(referral.status));
      doc.moveDown(0.25);
    }
  }

  if (record.evolucoes.length) {
    nextHeading("Evoluções e acompanhamento");
    for (const evolution of record.evolucoes) {
      line(
        "Data / área / profissional",
        `${formatBrazilianDate(evolution.date)} · ${labelFor(evolution.area)} · ${evolution.author.name ?? "Equipe técnica"}`,
      );
      line("Registro", evolution.content);
      line("Novas metas", evolution.newGoals);
      doc.moveDown(0.25);
    }
  }

  if (record.signatures.length) {
    nextHeading("Assinaturas");
    for (const signature of record.signatures) {
      const registry = signature.user?.professionalRegistry;
      line(
        `${labelFor(signature.signerType)} · ${signature.signerName}${registry ? ` · ${registry}` : ""}`,
        formatBrazilianDate(signature.signedAt),
      );
      const encoded = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(signature.imageDataUrl)?.[1];
      if (encoded) {
        try {
          doc.image(Buffer.from(encoded, "base64"), { fit: [220, 55] }).moveDown(0.4);
        } catch {
          doc.text("Assinatura registrada.");
        }
      }
    }
  }

  if (record.reviews.length) {
    nextHeading("Reavaliações do PIA");
    for (const review of record.reviews) {
      line(
        "Data / responsável",
        `${formatBrazilianDate(review.date)} · ${review.responsavel ?? review.author.name ?? "Equipe técnica"}`,
      );
      line("Mudanças observadas", review.changes);
      line("Novas metas", review.newGoals);
      doc.moveDown(0.25);
    }
  }

  doc.moveDown(1);
  doc
    .fontSize(8)
    .fillColor("#666")
    .text(`Documento gerado em ${formatBrazilianDate(new Date())}. Uso restrito à equipe técnica autorizada.`, {
      align: "center",
    });
  doc.end();
  return finished;
}

function resolveUploadPath(root: string, relativePath: string) {
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Caminho de arquivo inválido.");
  return target;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireTecnico();
  if (!isTecnico(user)) return new Response("Acesso restrito", { status: 403 });
  const allowedAreas = getTechnicalAreas(user) as Area[];
  const record = await loadRecord(id, allowedAreas);
  if (!record || !isAtendidoEligible(record.aluno.vinculo)) return new Response("Acesso restrito", { status: 403 });
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  let buffer: Buffer;
  let filename: string;
  const copyId = request.nextUrl.searchParams.get("copy");
  if (copyId) {
    const copy = await prisma.piaPdf.findFirst({ where: { id: copyId, atendidoId: record.id } });
    if (!copy) return new Response("Arquivo não encontrado", { status: 404 });
    const storedPath = resolveUploadPath(uploadRoot, copy.filePath);
    buffer = await readFile(storedPath);
    filename = path.basename(copy.filePath);
  } else {
    buffer = await renderPdf(record);
    const relativePath = path.join("pia", record.id, `${Date.now()}-${randomUUID()}.pdf`);
    const storedPath = resolveUploadPath(uploadRoot, relativePath);
    await mkdir(path.dirname(storedPath), { recursive: true });
    await writeFile(storedPath, buffer);
    const copy = await prisma.piaPdf.create({ data: { atendidoId: record.id, filePath: relativePath } });
    filename = path.basename(copy.filePath);
  }
  await logAccess({
    userId: user.id,
    action: AccessAction.VIEW,
    resource: "PIA PDF",
    resourceId: record.id,
    alunoId: record.alunoId,
  });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import { Area } from "@prisma/client";
import { NextResponse } from "next/server";
import { getTechnicalAreas, isTecnico } from "@/lib/permissions";
import { requireTecnico } from "@/lib/guards";
import { isAtendidoEligible } from "@/lib/technical-access";
import { prisma } from "@/lib/prisma";
import { formatBrazilianDate } from "@/lib/dates";
import { labelFor } from "@/lib/labels";

export const runtime = "nodejs";

const escape = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireTecnico();
  const allowedAreas = getTechnicalAreas(user);
  if (!isTecnico(user)) return new NextResponse("Acesso negado.", { status: 403 });
  const { id } = await params;
  const record = await prisma.atendido.findUnique({
    where: { id },
    include: {
      aluno: { include: { polo: true, turma: true } },
      areas: { orderBy: { area: "asc" } },
      goals: { orderBy: { order: "asc" } },
      encaminhamentos: { orderBy: { date: "asc" } },
      evolucoes: {
        where: { area: { in: allowedAreas as Area[] } },
        include: { author: { select: { name: true } } },
        orderBy: { date: "asc" },
      },
    },
  });
  if (!record || !isAtendidoEligible(record.aluno.vinculo))
    return new NextResponse("Registro não encontrado.", { status: 404 });

  const row = (label: string, value: unknown) =>
    value ? `<tr><th>${escape(label)}</th><td>${escape(value)}</td></tr>` : "";
  const section = (title: string, body: string) => `<h2>${escape(title)}</h2><table>${body}</table>`;
  const areas = record.areas
    .filter((area) => [area.necessidade, area.acoes, area.prazoResponsavel].some(Boolean))
    .map((area) =>
      row(labelFor(area.area), `${area.necessidade ?? ""} | ${area.acoes ?? ""} | ${area.prazoResponsavel ?? ""}`),
    )
    .join("");
  const goals = record.goals
    .map((goal) =>
      row(
        goal.objetivo,
        `${goal.meta ?? ""} | ${goal.acoes ?? ""} | ${formatBrazilianDate(goal.prazo)} | ${labelFor(goal.avaliacao)}`,
      ),
    )
    .join("");
  const referrals = record.encaminhamentos
    .map((item) =>
      row(
        formatBrazilianDate(item.date),
        `${labelFor(item.destination)} | ${item.reason} | ${item.returnNotes ?? "Aguardando retorno"}`,
      ),
    )
    .join("");
  const evolutions = record.evolucoes
    .map((item) =>
      row(
        `${formatBrazilianDate(item.date)} · ${labelFor(item.area)}`,
        `${item.content} | ${item.newGoals ?? ""} | ${item.author.name ?? ""}`,
      ),
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;color:#222;font-size:11pt}h1{font-size:18pt;color:#164e3b}
    h2{font-size:13pt;color:#164e3b;border-bottom:1px solid #aaa;padding-bottom:4px;margin-top:22px}
    table{width:100%;border-collapse:collapse;margin-bottom:10px}th,td{border:1px solid #ccc;padding:6px;text-align:left;vertical-align:top}th{width:28%;background:#f2f2f2}
  </style></head><body><h1>Plano Individual de Atendimento (PIA)</h1>
  <p><strong>Documento confidencial · Associação Kadiz</strong></p>
  ${section(
    "Identificação",
    [
      row("Nome", record.aluno.fullName),
      row("Nome social", record.aluno.socialName),
      row("CPF / RG", [record.aluno.cpf, record.aluno.rg].filter(Boolean).join(" / ")),
      row("Nascimento", formatBrazilianDate(record.aluno.birthDate)),
      row("Polo / turma", `${record.aluno.polo.name} / ${record.aluno.turma?.name ?? "Sem turma"}`),
      row("Responsável", record.aluno.guardianName),
      row("Telefone / contato", record.aluno.guardianPhone),
    ].join(""),
  )}
  ${section("Situação atual e histórico", row("Situação atual", record.currentSituation) + row("Histórico familiar", record.familyHistory) + row("Potencialidades", record.potentialities))}
  ${areas ? section("Áreas de atendimento e avaliação", areas) : ""}
  ${goals ? section("Objetivos e metas", goals) : ""}
  ${referrals ? section("Encaminhamentos", referrals) : ""}
  ${evolutions ? section("Evoluções e acompanhamento", evolutions) : ""}
  </body></html>`;
  return new NextResponse(html, {
    headers: {
      "Content-Type": "application/msword; charset=utf-8",
      "Content-Disposition": `attachment; filename="pia-${record.aluno.matricula}.doc"`,
      "Cache-Control": "no-store",
    },
  });
}

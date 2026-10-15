import {
  AccessAction,
  Area,
  AtendidoExitType,
  AtendidoStatus,
  AtendimentoStatus,
  AtendimentoType,
  PiaAreaStatus,
  ReferralDestination,
  ReferralStatus,
} from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAtendimento, updateAtendimento } from "@/app/actions/atendimentos";
import { createEncaminhamento, updateEncaminhamentoStatus } from "@/app/actions/encaminhamentos";
import { NewAtendidoDialog } from "@/components/new-atendido-dialog";
import { DateInput, TimeInput } from "@/components/date-input";
import {
  Button,
  DataTable,
  EmptyState,
  Field,
  LinkButton,
  MultiSelectField,
  PageHeader,
  Panel,
  SelectField,
  StatusBadge,
} from "@/components/ui";
import { getAge, getCategory } from "@/lib/category";
import { formatBrazilianDate, parseBrazilianDate } from "@/lib/dates";
import { labelFor } from "@/lib/labels";
import { canViewTechnicalArea, getTechnicalAreas, isTecnico, type TechnicalArea } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireTecnico, requireTechnicalDashboard } from "@/lib/guards";
import { averageFollowUpMonths, getPiaReviewHealth } from "@/lib/technical-metrics";
import { getPagination } from "@/lib/query-pagination";

const tabs = [
  ["", "Painel"],
  ["atendidos", "Atendidos"],
  ["atendimentos", "Atendimentos"],
  ["evolucoes", "Evoluções"],
  ["encaminhamentos", "Encaminhamentos"],
  ["equipe-tecnica", "Equipe técnica"],
] as const;

function areaPath(area: TechnicalArea) {
  return area === "SERVICO_SOCIAL" ? "/servico-social" : "/psicologia";
}

export function TechnicalTabs({ area, active }: { area: TechnicalArea; active: string }) {
  const base = areaPath(area);
  return (
    <>
      <nav className="mb-4 flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
        {tabs.map(([section, label]) => (
          <Link
            key={section}
            href={section ? `${base}/${section}` : base}
            className={`rounded-lg px-3 py-2 text-sm ${section === active ? "bg-emerald-500 font-semibold text-black" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
        <span aria-hidden>🔒</span>
        <span>Conteúdo sigiloso — acesso registrado.</span>
      </div>
    </>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <Panel className="p-4">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{detail}</p>
    </Panel>
  );
}

function BarList({ title, subtitle, values }: { title: string; subtitle: string; values: [string, number][] }) {
  const maximum = Math.max(1, ...values.map(([, count]) => count));
  return (
    <Panel className="p-4">
      <h2 className="font-semibold text-white">{title}</h2>
      <p className="mb-4 mt-1 text-xs text-neutral-500">{subtitle}</p>
      <div className="space-y-3">
        {values.map(([label, count]) => (
          <div className="grid grid-cols-[minmax(90px,1fr)_3fr_2rem] items-center gap-3 text-xs" key={label}>
            <span className="truncate text-neutral-400" title={label}>
              {label}
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-neutral-800">
              <span
                className="block h-full rounded-full bg-emerald-500"
                style={{ width: `${(count / maximum) * 100}%` }}
              />
            </span>
            <span className="text-right text-neutral-300">{count}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export async function TechnicalDashboard({ area }: { area: TechnicalArea }) {
  const user = await requireTechnicalDashboard(area);
  const technical = isTecnico(user);
  const base = areaPath(area);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const nextYear = new Date(now.getFullYear() + 1, 0, 1);
  const lastYear = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [attendedRows, monthlyCount, yearlyCount, demands, professionals, referralGroups, exitGroups] =
    await Promise.all([
      prisma.atendido.findMany({
        select: { status: true, ingressoDate: true, closeDate: true, nextReviewDate: true, closeType: true },
      }),
      prisma.atendimento.count({ where: { area, date: { gte: monthStart, lt: nextMonth } } }),
      prisma.atendimento.count({ where: { area, date: { gte: yearStart, lt: nextYear } } }),
      prisma.piaArea.groupBy({
        by: ["area"],
        where: { status: { in: [PiaAreaStatus.IDENTIFICADA, PiaAreaStatus.EM_ACOMPANHAMENTO] } },
        _count: { _all: true },
      }),
      prisma.atendimento.groupBy({
        by: ["professionalId"],
        where: { area, date: { gte: yearStart, lt: nextYear } },
        _count: { _all: true },
      }),
      prisma.encaminhamento.groupBy({
        by: ["destination"],
        where: { area, date: { gte: lastYear } },
        _count: { _all: true },
      }),
      prisma.atendido.groupBy({
        by: ["closeType"],
        where: { closeDate: { gte: lastYear }, closeType: { not: null } },
        _count: { _all: true },
      }),
    ]);
  const reviewHealth = getPiaReviewHealth(attendedRows, today);
  const averageMonths = averageFollowUpMonths(attendedRows, now);
  const professionalUsers = await prisma.user.findMany({
    where: { id: { in: technical ? professionals.map((row) => row.professionalId) : [] } },
    select: { id: true, name: true },
  });
  const professionalNames = new Map(professionalUsers.map((record) => [record.id, record.name ?? "Profissional"]));
  const demandLabels = [
    "DOCUMENTACAO",
    "SAUDE",
    "SAUDE_MENTAL",
    "EDUCACAO",
    "TRABALHO_RENDA_FAMILIA",
    "MORADIA",
    "CONVIVENCIA_FAMILIAR",
    "ASSISTENCIA_SOCIAL",
    "PROTECAO_DIREITOS",
    "OUTRAS",
  ];
  const demandMap = new Map(demands.map((row) => [row.area, row._count._all]));
  const referralMap = new Map(referralGroups.map((row) => [row.destination, row._count._all]));
  const exitMap = new Map(exitGroups.map((row) => [row.closeType ?? "", row._count._all]));
  const professionalValues = technical
    ? professionals.map(
        (row) => [professionalNames.get(row.professionalId) ?? "Profissional", row._count._all] as [string, number],
      )
    : [["Equipe técnica", professionals.reduce((total, row) => total + row._count._all, 0)] as [string, number]];
  const fiaGoal = area === "PSICOLOGIA" ? 960 : 390;
  const fiaLabel = area === "PSICOLOGIA" ? "atendimentos psicológicos" : "atendimentos sociais";

  return (
    <>
      <PageHeader eyebrow="Atendimento técnico" title={area === "PSICOLOGIA" ? "Psicologia" : "Serviço Social"} />
      {technical && <TechnicalTabs area={area} active="" />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Atendidos ativos"
          value={reviewHealth.active}
          detail={`de ${attendedRows.length} no histórico`}
        />
        <MetricCard
          label="Tempo médio de acompanhamento"
          value={`${averageMonths.toFixed(1).replace(".", ",")} meses`}
          detail="tempo médio da equipe"
        />
        <MetricCard label="Atendimentos no mês" value={monthlyCount} detail={labelFor(area)} />
        <MetricCard
          label="PIAs atualizados"
          value={`${reviewHealth.percent}%`}
          detail={`${reviewHealth.overdue} com reavaliação atrasada · ${reviewHealth.withoutDate} sem data`}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BarList
          title="Demandas por área"
          subtitle="Situações identificadas ou em acompanhamento"
          values={demandLabels.map((label) => [labelFor(label), demandMap.get(label as never) ?? 0])}
        />
        <BarList
          title="Atendimentos por profissional"
          subtitle={`Atendimentos registrados no ano · ${now.getFullYear()}`}
          values={professionalValues.length ? professionalValues : [["Sem atendimentos", 0]]}
        />
        <BarList
          title="Encaminhamentos por órgão"
          subtitle="Últimos 12 meses"
          values={Object.values(ReferralDestination).map((destination) => [
            labelFor(destination),
            referralMap.get(destination) ?? 0,
          ])}
        />
        <BarList
          title="Saídas por tipo"
          subtitle="Últimos 12 meses"
          values={Object.values(AtendidoExitType).map((type) => [labelFor(type), exitMap.get(type) ?? 0])}
        />
      </div>
      <Panel className="mt-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-white">Meta FIA 2026</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {yearlyCount} de {fiaGoal} {fiaLabel}
            </p>
          </div>
          <div className="w-full max-w-xl">
            <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.min(100, Math.round((yearlyCount / fiaGoal) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </Panel>
      {!technical && (
        <p className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-400">
          Este painel apresenta somente indicadores agregados. O conteúdo dos atendidos é restrito à equipe técnica
          autorizada.
        </p>
      )}
      <div className="mt-6 flex justify-end">
        {technical && <LinkButton href={`${base}/atendidos`}>Ver atendidos</LinkButton>}
      </div>
    </>
  );
}

export async function TechnicalSection({
  area,
  section,
  searchParams,
}: {
  area: TechnicalArea;
  section: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireTecnico();
  if (!canViewTechnicalArea(user, area)) redirect("/403");
  const base = areaPath(area);
  const title = tabs.find(([key]) => key === section)?.[1];
  if (!title || !section) redirect(base);
  return (
    <>
      <PageHeader eyebrow={area === "PSICOLOGIA" ? "Psicologia" : "Serviço Social"} title={title} />
      <TechnicalTabs area={area} active={section} />
      {section === "atendidos" && <AtendidosList area={area} searchParams={searchParams} />}
      {section === "atendimentos" && <AtendimentosList area={area} searchParams={searchParams} />}
      {section === "evolucoes" && <EvolutionsList area={area} searchParams={searchParams} />}
      {section === "encaminhamentos" && <EncaminhamentosList area={area} searchParams={searchParams} />}
      {section === "equipe-tecnica" && <TechnicalTeam />}
    </>
  );
}

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

async function AtendidosList({
  area,
  searchParams,
}: {
  area: TechnicalArea;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireTecnico();
  const allowedAreas = getTechnicalAreas(user);
  const search = queryValue(searchParams.q).trim();
  const statusInput = queryValue(searchParams.status);
  const status = Object.values(AtendidoStatus).find((item) => item === statusInput);
  const { page, pageSize, skip } = getPagination(queryValue(searchParams.page), queryValue(searchParams.pageSize));
  const where = {
    ...(status ? { status } : {}),
    aluno: {
      vinculo: "PROJETO_SOCIAL" as const,
      ...(search ? { fullName: { contains: search, mode: "insensitive" as const } } : {}),
    },
  };
  const [attended, counts, students] = await Promise.all([
    prisma.atendido.findMany({
      where,
      include: {
        aluno: { include: { polo: true, turma: true } },
        evolucoes: { where: { area: { in: allowedAreas as Area[] } }, select: { id: true } },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      skip,
      take: pageSize,
    }),
    Promise.all([
      prisma.atendido.count({ where: { status: "ATIVO" } }),
      prisma.atendido.count({ where: { status: "ENCERRADO" } }),
      prisma.atendido.count({ where }),
    ]),
    prisma.aluno.findMany({
      where: { vinculo: "PROJETO_SOCIAL", atendido: null, status: "ATIVO" },
      select: { id: true, fullName: true, polo: { select: { name: true } } },
      orderBy: { fullName: "asc" },
    }),
  ]);
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          ["ATIVO", `Ativos ${counts[0]}`],
          ["ENCERRADO", `Encerrados ${counts[1]}`],
          ["", `Todos ${counts[2]}`],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={`${areaPath(area)}/atendidos${value ? `?status=${value}` : ""}`}
            className={`rounded-full border px-4 py-2 text-sm ${statusInput === value ? "border-emerald-500 bg-emerald-500 text-black" : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"}`}
          >
            {label}
          </Link>
        ))}
        <div className="ml-auto">
          <NewAtendidoDialog students={students} />
        </div>
      </div>
      <form className="mb-4 flex gap-2" action={`${areaPath(area)}/atendidos`} method="get">
        <input
          name="q"
          defaultValue={search}
          placeholder="Buscar atendido pelo nome"
          className="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
        />
        {status && <input type="hidden" name="status" value={status} />}
        <Button variant="secondary">Buscar</Button>
      </form>
      <DataTable
        headers={["Atendido", "Idade", "Ingresso", "Próx. reavaliação", "Evol.", "Status"]}
        count={counts[2]}
        page={page}
        pageSize={pageSize}
      >
        {attended.map((record) => {
          const overdue = record.nextReviewDate && record.nextReviewDate < new Date(new Date().setHours(0, 0, 0, 0));
          return (
            <tr className="text-neutral-300" key={record.id}>
              <td className="px-4 py-3">
                <Link className="font-semibold text-white hover:text-emerald-300" href={`/atendidos/${record.id}`}>
                  {record.aluno.fullName}
                </Link>
                <p className="mt-1 text-xs text-neutral-500">
                  {record.aluno.polo.name} · {getCategory(record.aluno.birthDate)}
                  {record.aluno.turma ? ` · ${record.aluno.turma.name}` : ""}
                </p>
              </td>
              <td className="px-4 py-3">{getAge(record.aluno.birthDate)}</td>
              <td className="px-4 py-3">{formatBrazilianDate(record.ingressoDate)}</td>
              <td className={`px-4 py-3 ${overdue ? "font-semibold text-red-300" : ""}`}>
                {overdue ? "Reavaliação atrasada" : formatBrazilianDate(record.nextReviewDate) || "Sem data"}
              </td>
              <td className="px-4 py-3">{record.evolucoes.length}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={record.status === "ATIVO" ? "green" : "neutral"}>{record.status}</StatusBadge>
              </td>
            </tr>
          );
        })}
        {!attended.length && (
          <tr>
            <td colSpan={6}>
              <EmptyState text="Nenhum atendido encontrado." />
            </td>
          </tr>
        )}
      </DataTable>
    </>
  );
}

async function AtendimentosList({
  area,
  searchParams,
}: {
  area: TechnicalArea;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const typeFilter = queryValue(searchParams.type);
  const statusFilter = queryValue(searchParams.status);
  const professionalFilter = queryValue(searchParams.professional);
  const fromInput = queryValue(searchParams.from);
  const toInput = queryValue(searchParams.to);
  const fromDate = fromInput ? parseBrazilianDate(fromInput) : null;
  const toDate = toInput ? parseBrazilianDate(toInput) : null;
  const types =
    area === "PSICOLOGIA"
      ? ["INDIVIDUAL", "GRUPOTERAPIA", "FAMILIAR", "RODA_CONVERSA", "APOIO_COMPETICAO", "OFICINA_FAMILIAS"]
      : [
          "ESCUTA_QUALIFICADA",
          "ACOLHIMENTO",
          "VISITA_DOMICILIAR",
          "ORIENTACAO_FAMILIAR",
          "ARTICULACAO_REDE",
          "OFICINA_FAMILIAS",
        ];
  const selectedType = types.find((type) => type === typeFilter);
  const selectedStatus = Object.values(AtendimentoStatus).find((status) => status === statusFilter);
  const [rows, attended, professionals] = await Promise.all([
    prisma.atendimento.findMany({
      where: {
        area,
        ...(selectedType ? { type: selectedType as AtendimentoType } : {}),
        ...(selectedStatus ? { status: selectedStatus } : {}),
        ...(professionalFilter ? { professionalId: professionalFilter } : {}),
        ...(fromDate || toDate
          ? {
              date: {
                ...(fromDate ? { gte: new Date(`${fromDate}T00:00:00`) } : {}),
                ...(toDate ? { lte: new Date(`${toDate}T23:59:59`) } : {}),
              },
            }
          : {}),
      },
      include: {
        professional: { select: { name: true } },
        atendidos: { include: { aluno: { select: { fullName: true } } } },
      },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.atendido.findMany({
      where: { status: "ATIVO" },
      include: { aluno: { select: { id: true, fullName: true } } },
      orderBy: { aluno: { fullName: "asc" } },
    }),
    prisma.user.findMany({
      where: { role: { in: ["PSICOLOGO", "ASSISTENTE_SOCIAL"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return (
    <>
      <Panel className="mb-5 p-4">
        <h2 className="mb-4 font-semibold text-white">Novo atendimento</h2>
        <form action={createAtendimento} className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="area" value={area} />
          <SelectField label="Tipo" name="type" options={types.map((type) => [type, labelFor(type)])} />
          <DateInput label="Data" name="date" required />
          <TimeInput label="Horário" name="startTime" />
          <Field label="Duração (minutos)" name="durationMin" type="number" />
          <SelectField
            label="Status"
            name="status"
            options={Object.values(AtendimentoStatus).map((status) => [status, labelFor(status)])}
          />
          <MultiSelectField
            label="Atendidos (selecione um ou mais)"
            name="atendidoIds"
            options={attended.map((item) => [item.id, item.aluno.fullName] as [string, string])}
          />
          <Field label="Observações / resumo" name="summary" className="md:col-span-2" />
          <div className="md:col-span-3">
            <Button>Salvar atendimento</Button>
          </div>
        </form>
      </Panel>
      <Panel className="mb-4 p-4">
        <form method="get" className="grid gap-3 md:grid-cols-6">
          <SelectField
            label="Tipo"
            name="type"
            defaultValue={typeFilter}
            options={[["", "Todos os tipos"], ...types.map((type) => [type, labelFor(type)] as [string, string])]}
          />
          <SelectField
            label="Status"
            name="status"
            defaultValue={statusFilter}
            options={[
              ["", "Todos os status"],
              ...Object.values(AtendimentoStatus).map((status) => [status, labelFor(status)] as [string, string]),
            ]}
          />
          <SelectField
            label="Profissional"
            name="professional"
            defaultValue={professionalFilter}
            options={[
              ["", "Todos"],
              ...professionals.map((person) => [person.id, person.name ?? "Profissional"] as [string, string]),
            ]}
          />
          <DateInput label="De" name="from" defaultValue={fromInput} />
          <DateInput label="Até" name="to" defaultValue={toInput} />
          <div className="flex items-end">
            <Button variant="secondary">Filtrar</Button>
          </div>
        </form>
      </Panel>
      <DataTable
        headers={["Data", "Atendido(s)", "Tipo", "Profissional", "Status", "Editar"]}
        count={rows.length}
        footer={false}
      >
        {rows.map((row) => (
          <tr key={row.id} className="text-neutral-300">
            <td className="px-4 py-3">
              {formatBrazilianDate(row.date)}
              {row.startTime ? ` · ${row.startTime}` : ""}
            </td>
            <td className="px-4 py-3">{row.atendidos.map(({ aluno }) => aluno.fullName).join(", ")}</td>
            <td className="px-4 py-3">{labelFor(row.type)}</td>
            <td className="px-4 py-3">{row.professional.name ?? "Profissional"}</td>
            <td className="px-4 py-3">
              <StatusBadge>{row.status}</StatusBadge>
            </td>
            <td className="px-4 py-3">
              <details>
                <summary className="cursor-pointer text-emerald-300">Editar</summary>
                <form
                  action={updateAtendimento}
                  className="mt-3 grid min-w-64 gap-2 rounded-lg border border-neutral-800 p-3"
                >
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="area" value={area} />
                  <SelectField
                    label="Tipo"
                    name="type"
                    defaultValue={row.type}
                    options={types.map((type) => [type, labelFor(type)])}
                  />
                  <DateInput label="Data" name="date" required defaultValue={row.date} />
                  <TimeInput label="Horário" name="startTime" defaultValue={row.startTime ?? ""} />
                  <Field
                    label="Duração (minutos)"
                    name="durationMin"
                    type="number"
                    defaultValue={row.durationMin ?? ""}
                  />
                  <SelectField
                    label="Status"
                    name="status"
                    defaultValue={row.status}
                    options={Object.values(AtendimentoStatus).map((status) => [status, labelFor(status)])}
                  />
                  <MultiSelectField
                    label="Atendidos"
                    name="atendidoIds"
                    defaultValue={row.atendidos.map((item) => item.id)}
                    options={attended.map((item) => [item.id, item.aluno.fullName] as [string, string])}
                  />
                  <Field label="Resumo" name="summary" defaultValue={row.summary ?? ""} />
                  <Button>Salvar alterações</Button>
                </form>
              </details>
            </td>
          </tr>
        ))}
        {!rows.length && (
          <tr>
            <td colSpan={6}>
              <EmptyState text="Nenhum atendimento encontrado." />
            </td>
          </tr>
        )}
      </DataTable>
    </>
  );
}

async function EvolutionsList({
  area,
  searchParams,
}: {
  area: TechnicalArea;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireTecnico();
  if (!canViewTechnicalArea(user, area)) redirect("/403");
  const search = queryValue(searchParams.q).toLocaleLowerCase("pt-BR");
  const rows = await prisma.evolucao.findMany({
    where: { area },
    include: {
      atendido: { select: { id: true, alunoId: true, aluno: { select: { fullName: true } } } },
      author: { select: { name: true } },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  const visibleRows = search
    ? rows.filter((row) => row.atendido.aluno.fullName.toLocaleLowerCase("pt-BR").includes(search))
    : rows;
  if (visibleRows.length) {
    await prisma.accessLog.createMany({
      data: visibleRows.map((row) => ({
        userId: user.id,
        action: AccessAction.VIEW,
        resource: "Evolucao",
        resourceId: row.id,
        alunoId: row.atendido.alunoId,
      })),
    });
  }
  return (
    <>
      <form method="get" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={queryValue(searchParams.q)}
          placeholder="Buscar por atendido"
          className="w-full max-w-sm rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
        />
        <Button variant="secondary">Buscar</Button>
      </form>
      <div className="space-y-3">
        {visibleRows.map((row) => (
          <Panel className="p-4" key={row.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link
                  className="font-semibold text-white hover:text-emerald-300"
                  href={`/atendidos/${row.atendido.id}`}
                >
                  {row.atendido.aluno.fullName}
                </Link>
                <p className="mt-1 text-xs text-neutral-500">
                  {formatBrazilianDate(row.date)} · {row.author.name ?? "Equipe técnica"} · {labelFor(row.area)}
                </p>
              </div>
              <StatusBadge>{row.area}</StatusBadge>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-300">{row.content}</p>
          </Panel>
        ))}
        {!visibleRows.length && (
          <Panel>
            <EmptyState text="Nenhuma evolução encontrada." />
          </Panel>
        )}
      </div>
    </>
  );
}

async function EncaminhamentosList({
  area,
  searchParams,
}: {
  area: TechnicalArea;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireTecnico();
  const allowedAreas = getTechnicalAreas(user);
  const statusInput = queryValue(searchParams.status);
  const status = Object.values(ReferralStatus).find((item) => item === statusInput);
  const [rows, attended] = await Promise.all([
    prisma.encaminhamento.findMany({
      where: status ? { status } : {},
      include: { atendido: { select: { id: true, aluno: { select: { fullName: true } } } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.atendido.findMany({
      where: { status: "ATIVO" },
      include: { aluno: { select: { id: true, fullName: true } } },
      orderBy: { aluno: { fullName: "asc" } },
    }),
  ]);
  const visible = rows;
  return (
    <>
      <Panel className="mb-5 p-4">
        <h2 className="mb-4 font-semibold text-white">Novo encaminhamento</h2>
        <form action={createEncaminhamento} className="grid gap-3 md:grid-cols-3">
          <SelectField
            label="Atendido"
            name="atendidoId"
            required
            options={attended.map((item) => [item.id, item.aluno.fullName])}
          />
          <SelectField
            label="Área"
            name="area"
            defaultValue={area}
            options={allowedAreas.map((userArea) => [userArea, labelFor(userArea)] as [string, string])}
          />
          <SelectField
            label="Destino"
            name="destination"
            options={Object.values(ReferralDestination).map((destination) => [destination, labelFor(destination)])}
          />
          <Field label="Órgão / serviço" name="destinationDetail" />
          <Field label="Motivo" name="reason" required />
          <Field label="Data" name="date" type="date" required />
          <div className="md:col-span-3">
            <Button>Salvar encaminhamento</Button>
          </div>
        </form>
      </Panel>
      <Panel className="mb-4 p-4">
        <form method="get" className="flex max-w-sm items-end gap-3">
          <SelectField
            label="Status"
            name="status"
            defaultValue={statusInput}
            options={[
              ["", "Todos"],
              ...Object.values(ReferralStatus).map((item) => [item, labelFor(item)] as [string, string]),
            ]}
          />
          <Button variant="secondary">Filtrar</Button>
        </form>
      </Panel>
      <DataTable
        headers={["Atendido", "Destino", "Motivo", "Data", "Retorno e status"]}
        count={visible.length}
        footer={false}
      >
        {visible.map((row) => (
          <tr key={row.id} className="text-neutral-300">
            <td className="px-4 py-3">
              <Link href={`/atendidos/${row.atendido.id}`} className="text-white hover:text-emerald-300">
                {row.atendido.aluno.fullName}
              </Link>
            </td>
            <td className="px-4 py-3">
              {labelFor(row.destination)}
              {row.destinationDetail ? ` · ${row.destinationDetail}` : ""}
            </td>
            <td className="px-4 py-3">{row.reason}</td>
            <td className="px-4 py-3">{formatBrazilianDate(row.date)}</td>
            <td className="px-4 py-3">
              <form action={updateEncaminhamentoStatus} className="grid min-w-64 gap-2">
                <input type="hidden" name="id" value={row.id} />
                <SelectField
                  label="Status"
                  name="status"
                  defaultValue={row.status}
                  options={Object.values(ReferralStatus).map((item) => [item, labelFor(item)])}
                />
                <Field label="Retorno / resultado" name="returnNotes" defaultValue={row.returnNotes ?? ""} />
                <Button variant="secondary">Salvar retorno</Button>
              </form>
            </td>
          </tr>
        ))}
        {!visible.length && (
          <tr>
            <td colSpan={5}>
              <EmptyState text="Nenhum encaminhamento encontrado." />
            </td>
          </tr>
        )}
      </DataTable>
    </>
  );
}

async function TechnicalTeam() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: ["PSICOLOGO", "ASSISTENTE_SOCIAL"] } },
        { accessPsicologia: true },
        { accessServicoSocial: true },
      ],
    },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <Panel className="mb-4 p-4 text-sm text-neutral-300">
        Cada técnico acessa com o próprio login. O administrador cadastra, edita e desativa usuários; somente técnicos
        autorizados acessam atendidos.
      </Panel>
      <Panel className="divide-y divide-neutral-800 overflow-hidden">
        {users.map((user) => (
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4" key={user.id}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-950 text-sm font-semibold text-emerald-300">
                {(user.name ?? user.email)
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </span>
              <div>
                <p className="font-semibold text-white">{user.name ?? user.email}</p>
                <p className="text-sm text-neutral-400">
                  {user.jobTitle ?? "Técnico"} · {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge>{labelFor(user.role)}</StatusBadge>
              <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                {user.professionalRegistry || "Sem registro"}
              </span>
            </div>
          </div>
        ))}
      </Panel>
      <p className="mt-4 text-sm text-neutral-500">
        Somente administradores podem cadastrar ou editar usuários.{" "}
        <Link className="text-emerald-300 hover:underline" href="/usuarios">
          Abrir usuários
        </Link>
      </p>
    </>
  );
}

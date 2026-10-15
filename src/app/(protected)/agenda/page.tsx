import { EventCategory } from "@prisma/client";
import { addDays, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { createEvent } from "@/app/actions/agenda";
import { Button, Field, PageHeader, Panel, SelectField } from "@/components/ui";
import { requirePermission } from "@/lib/guards";
import { labelFor } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const weekdayMap: Record<string, number> = { DOM: 0, SEG: 1, TER: 2, QUA: 3, QUI: 4, SEX: 5, SAB: 6 };

export default async function AgendaPage() {
  await requirePermission("calendar");
  const week = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(week, 7);
  const [turmas, events, appointments, polos] = await Promise.all([
    prisma.turma.findMany({ where: { active: true }, include: { polo: true }, orderBy: [{ startTime: "asc" }, { name: "asc" }] }),
    prisma.event.findMany({ where: { start: { gte: week, lt: weekEnd } }, include: { polo: true }, orderBy: { start: "asc" } }),
    prisma.atendimento.findMany({ where: { date: { gte: week, lt: weekEnd } }, include: { atendidos: { include: { aluno: { select: { fullName: true } } } } }, orderBy: [{ date: "asc" }, { startTime: "asc" }] }),
    prisma.polo.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  const days = Array.from({ length: 7 }, (_, index) => addDays(week, index));
  return (
    <>
      <PageHeader eyebrow="Planejamento semanal" title="Agenda" />
      <div className="mb-5 flex items-center justify-between"><p className="text-sm text-neutral-400">{format(week, "dd/MM", { locale: ptBR })} a {format(addDays(week, 6), "dd/MM/yyyy", { locale: ptBR })}</p><Link className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800" href="/chamada">Abrir chamada</Link></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {days.map((day) => {
          const dayNumber = day.getDay();
          const dayEvents = events.filter((event) => format(event.start, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
          const dayAppointments = appointments.filter((appointment) => format(appointment.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
          const dayClasses = turmas.filter((turma) => turma.weekdays.some((weekday) => weekdayMap[weekday] === dayNumber));
          return <Panel key={day.toISOString()} className="min-h-48 overflow-hidden"><div className="border-b border-neutral-800 bg-neutral-950/50 px-3 py-3"><p className="text-xs uppercase text-neutral-500">{format(day, "EEE", { locale: ptBR })}</p><p className="text-lg font-semibold">{format(day, "dd")}</p></div><div className="space-y-2 p-2">{dayClasses.map((turma) => <Link key={turma.id} href={`/chamada?turma=${turma.id}&date=${format(day, "yyyy-MM-dd")}`} className="block rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-2 text-xs hover:border-emerald-400"><p className="font-semibold text-emerald-200">{turma.startTime} · {turma.name}</p><p className="text-neutral-400">{turma.polo.name} · {labelFor(turma.modality)}</p></Link>)}{dayEvents.map((event) => <div key={event.id} className="rounded-lg border border-blue-900/60 bg-blue-950/30 p-2 text-xs"><p className="font-semibold text-blue-200">{event.allDay ? "Dia inteiro" : format(event.start, "HH:mm")} · {event.title}</p><p className="text-neutral-400">{labelFor(event.category)}</p></div>)}{dayAppointments.map((appointment) => <div key={appointment.id} className="rounded-lg border border-violet-900/60 bg-violet-950/30 p-2 text-xs"><p className="font-semibold text-violet-200">{appointment.startTime ?? "Sem horário"} · {labelFor(appointment.area)}</p><p className="truncate text-neutral-400">{appointment.atendidos.map((item) => item.aluno.fullName).join(", ")}</p></div>)}{!dayClasses.length && !dayEvents.length && !dayAppointments.length && <p className="py-5 text-center text-xs text-neutral-600">Livre</p>}</div></Panel>;
        })}
      </div>
      <Panel className="mt-6 p-5"><h2 className="mb-4 text-lg font-semibold">Cadastrar compromisso</h2><form action={createEvent} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Field label="Título" name="title" required /><Field label="Data" name="date" type="date" required /><Field label="Início" name="startTime" type="time" required /><Field label="Fim" name="endTime" type="time" /><SelectField label="Categoria" name="category" options={Object.values(EventCategory).map((category) => [category, labelFor(category)] as [string, string])} /><SelectField label="Polo" name="poloId" options={[["", "Todos / não informado"], ...polos.map((polo) => [polo.id, polo.name] as [string, string])]} /><Field label="Descrição" name="description" /><label className="flex items-center gap-2 self-end pb-2 text-sm text-neutral-300"><input type="checkbox" name="allDay" /> Dia inteiro</label><div className="xl:col-span-4"><Button>Adicionar à agenda</Button></div></form></Panel>
    </>
  );
}

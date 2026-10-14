"use client";

import { useState } from "react";
import { saveAttendance } from "@/app/actions/chamada";
import { Button, StatusBadge } from "@/components/ui";

type Row = { id: string; fullName: string; matricula: string; risk: boolean; blocked: boolean; initialStatus: string };
export function AttendanceSheet({ turmaId, date, students }: { turmaId: string; date: string; students: Row[] }) {
  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries(students.map((student) => [student.id, student.initialStatus || "PRESENTE"])),
  );
  const records = students.map((student) => ({ alunoId: student.id, status: statuses[student.id] }));
  return (
    <form action={saveAttendance}>
      <input type="hidden" name="turmaId" value={turmaId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="records" value={JSON.stringify(records)} />
      <div className="mb-3 flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setStatuses(Object.fromEntries(students.map((student) => [student.id, "PRESENTE"])))}
        >
          Marcar todos presentes
        </Button>
      </div>
      <div className="divide-y divide-neutral-800">
        {students.map((student) => (
          <div key={student.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">{student.fullName}</p>
              <p className="text-xs text-neutral-500">{student.matricula}</p>
              <div className="mt-1 flex gap-2">
                {student.risk && <StatusBadge tone="red">Risco de desligamento</StatusBadge>}
                {student.blocked && <StatusBadge tone="amber">Impedido de treinar</StatusBadge>}
              </div>
            </div>
            <select
              aria-label={`Presença de ${student.fullName}`}
              value={statuses[student.id]}
              onChange={(event) => setStatuses({ ...statuses, [student.id]: event.target.value })}
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
            >
              <option value="PRESENTE">Presente</option>
              <option value="FALTA">Falta</option>
              <option value="FALTA_JUSTIFICADA">Falta justificada</option>
            </select>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button>Salvar chamada</Button>
      </div>
    </form>
  );
}

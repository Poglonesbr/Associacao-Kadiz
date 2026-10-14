import { PrismaClient, type PiaAreaStatus, type PiaAreaType, type Role, type Turma } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const roles: { name: string; email: string; role: Role; jobTitle?: string; professionalRegistry?: string }[] = [
  { name: "Admin Kadiz", email: "admin@kadiz.com", role: "ADMIN" },
  { name: "Coordenação Kadiz", email: "coordenacao@kadiz.com", role: "COORDENADOR" },
  { name: "Secretaria Kadiz", email: "secretaria@kadiz.com", role: "SECRETARIA" },
  { name: "Professor Kadiz", email: "professor@kadiz.com", role: "PROFESSOR", jobTitle: "Professor" },
  {
    name: "Equipe Psicologia",
    email: "psicologia@kadiz.com",
    role: "PSICOLOGO",
    jobTitle: "Psicóloga",
    professionalRegistry: "CRP 12/18185",
  },
  {
    name: "Equipe Serviço Social",
    email: "social@kadiz.com",
    role: "ASSISTENTE_SOCIAL",
    jobTitle: "Assistente Social",
    professionalRegistry: "CRESS/SC 008736",
  },
  { name: "Financeiro Kadiz", email: "financeiro@kadiz.com", role: "FINANCEIRO" },
];
const poloNames = [
  ["Sede Kadiz", "SEDE", "Alameda Kadiz, 111 — Taboleiro"],
  ["Polo CAIC", "ESCOLA_POLO", "Camboriú — SC"],
  ["Polo Cedro", "ESCOLA_POLO", "Camboriú — SC"],
  ["Polo Monte Alegre", "ESCOLA_POLO", "Camboriú — SC"],
  ["Polo Santa Regina", "ESCOLA_POLO", "Camboriú — SC"],
  ["Polo Jardim Europa", "ESCOLA_POLO", "Camboriú — SC"],
  ["Polo EBM Eliete Pereira Melo", "ESCOLA_POLO", "Camboriú — SC"],
] as const;
const names = [
  "Atleta Demonstração 01",
  "Atleta Demonstração 02",
  "Atleta Demonstração 03",
  "Atleta Demonstração 04",
  "Atleta Demonstração 05",
  "Atleta Demonstração 06",
  "Atleta Demonstração 07",
  "Atleta Demonstração 08",
  "Atleta Demonstração 09",
  "Atleta Demonstração 10",
  "Atleta Demonstração 11",
  "Atleta Demonstração 12",
  "Atleta Demonstração 13",
  "Atleta Demonstração 14",
  "Atleta Demonstração 15",
  "Atleta Demonstração 16",
  "Atleta Demonstração 17",
  "Atleta Demonstração 18",
  "Atleta Demonstração 19",
  "Atleta Demonstração 20",
  "Atleta Demonstração 21",
  "Atleta Demonstração 22",
  "Atleta Demonstração 23",
  "Atleta Demonstração 24",
  "Atleta Demonstração 25",
  "Atleta Demonstração 26",
  "Atleta Demonstração 27",
  "Atleta Demonstração 28",
  "Atleta Demonstração 29",
  "Atleta Demonstração 30",
  "Atleta Demonstração 31",
  "Atleta Demonstração 32",
  "Atleta Demonstração 33",
  "Atleta Demonstração 34",
  "Atleta Demonstração 35",
  "Atleta Demonstração 36",
  "Atleta Demonstração 37",
  "Atleta Demonstração 38",
  "Atleta Demonstração 39",
  "Atleta Demonstração 40",
];
const demoAddress = (index: number) => ({
  address: ["Rua das Palmeiras", "Rua Monte Alegre", "Rua São Paulo", "Rua Rio de Janeiro"][index % 4],
  addressNumber: String(100 + index),
  neighborhood: ["Centro", "Monte Alegre", "Tabuleiro", "Santa Regina"][index % 4],
  city: "Camboriú",
  state: "SC",
  postalCode: `88340-${String(index + 1).padStart(3, "0")}`,
});
const documentTypes = [
  "FICHA_CADASTRAL",
  "RG",
  "COMPROVANTE_RESIDENCIA",
  "ATESTADO_MEDICO",
  "CARTEIRA_VACINACAO",
  "CARTAO_SUS",
  "BOLETIM_ESCOLAR",
  "ELETROCARDIOGRAMA",
  "FOTO",
  "TERMO_RESPONSABILIDADE",
] as const;

async function seedTechnicalDemo(users: Map<string, { id: string }>) {
  const demoStudents = await prisma.aluno.findMany({
    where: { vinculo: "PROJETO_SOCIAL" },
    orderBy: { matricula: "asc" },
    take: 8,
  });
  const socialProfessionalId = users.get("ASSISTENTE_SOCIAL")?.id;
  const psychologyProfessionalId = users.get("PSICOLOGO")?.id;
  if (!socialProfessionalId || !psychologyProfessionalId) return;
  const today = new Date();
  const attendedIds: string[] = [];
  const areaTemplates: [PiaAreaType, string, string][] = [
    ["DOCUMENTACAO", "Documentos em organização", "Conferir documentação familiar"],
    ["SAUDE", "Acompanhamento preventivo", "Articular com unidade de saúde"],
    ["SAUDE_MENTAL", "Fortalecer vínculos e autoestima", "Acompanhamento psicológico"],
    ["EDUCACAO", "Apoio à permanência escolar", "Contato periódico com a escola"],
    ["CONVIVENCIA_FAMILIAR", "Ampliar espaços de diálogo", "Encontro com responsável"],
    ["ASSISTENCIA_SOCIAL", "Avaliar acesso a benefícios", "Orientação socioassistencial"],
    ["MORADIA", "Acompanhar condições habitacionais", "Atualizar registro familiar"],
    ["TRABALHO_RENDA_FAMILIA", "Orientar acesso a políticas públicas", "Mapear oportunidades"],
    ["PROTECAO_DIREITOS", "Fortalecer rede de proteção", "Reunião intersetorial"],
    ["OUTRAS", "", ""],
  ];

  for (let index = 0; index < demoStudents.length; index += 1) {
    const student = demoStudents[index];
    let attended = await prisma.atendido.findUnique({ where: { alunoId: student.id } });
    if (!attended) {
      const isClosed = index === 7;
      const nextReviewDate = isClosed
        ? null
        : index === 0
          ? new Date(today.getFullYear(), today.getMonth() - 2, today.getDate(), 12)
          : new Date(today.getFullYear(), today.getMonth() + 2, today.getDate(), 12);
      attended = await prisma.atendido.create({
        data: {
          alunoId: student.id,
          status: isClosed ? "ENCERRADO" : "ATIVO",
          ingressoDate: new Date(
            today.getFullYear(),
            today.getMonth() - (index + 2),
            Math.min(today.getDate(), 25),
            12,
          ),
          origem: index % 2 ? "EQUIPE_KADIZ" : "ESCOLA",
          responsavelTecnicoId: index % 2 ? socialProfessionalId : psychologyProfessionalId,
          nextReviewDate,
          closeDate: isClosed ? new Date(today.getFullYear(), today.getMonth() - 1, today.getDate(), 12) : null,
          closeType: isClosed ? "OBJETIVOS_ALCANCADOS" : null,
          closeReason: isClosed ? "Objetivos do plano alcançados e rede de apoio articulada." : null,
          familyIncome: 1800 + index * 150,
          incomeSources: index % 2 ? "Trabalho informal e benefício social" : "Renda familiar variável",
          bolsaFamilia: index % 3 === 0,
          housingType: index % 2 ? "ALUGADA" : "PROPRIA",
          vulnerabilities: index % 2 ? ["EDUCACAO", "TRABALHO_RENDA_FAMILIA"] : ["SAUDE", "CONVIVENCIA_FAMILIAR"],
          currentSituation: "Acompanhamento demonstrativo para validação do fluxo do PIA.",
          familyHistory: "Família fictícia com rede de apoio em articulação.",
          potentialities: "Vínculos comunitários, frequência escolar e interesse esportivo.",
          createdById: psychologyProfessionalId,
          changes: {
            create: {
              userId: psychologyProfessionalId,
              section: "Cadastro",
              field: "Ficha técnica",
              newValue: "Registro demonstrativo criado para validação do módulo.",
            },
          },
          areas: {
            create: [
              ...areaTemplates.map(([area, necessidade, acoes], areaIndex) => ({
                area,
                necessidade,
                acoes,
                prazoResponsavel: areaIndex < 2 ? "30 dias · equipe técnica" : "",
                status: (areaIndex < 2
                  ? "EM_ACOMPANHAMENTO"
                  : areaIndex === 9
                    ? "SEM_DEMANDA"
                    : "IDENTIFICADA") as PiaAreaStatus,
              })),
            ],
          },
          goals: {
            create: [
              {
                objetivo: "Fortalecer a frequência e o vínculo escolar",
                meta: "Manter frequência regular durante o próximo bimestre",
                acoes: "Acompanhar frequência com a família e a escola",
                prazo: new Date(today.getFullYear(), today.getMonth() + 2, today.getDate(), 12),
                avaliacao: "EM_ANDAMENTO",
                order: 0,
              },
              {
                objetivo: "Ampliar a participação em atividades comunitárias",
                meta: "Participar das atividades esportivas e coletivas",
                acoes: "Acompanhar presença nas atividades",
                prazo: new Date(today.getFullYear(), today.getMonth() + 3, today.getDate(), 12),
                avaliacao: "NAO_INICIADA",
                order: 1,
              },
            ],
          },
          encaminhamentos: {
            create: {
              area: index % 2 ? "SERVICO_SOCIAL" : "PSICOLOGIA",
              destination: index % 2 ? "CRAS" : "UBS",
              destinationDetail: index % 2 ? "CRAS de referência" : "Unidade de saúde de referência",
              reason: "Articulação demonstrativa para acompanhamento da família.",
              date: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate(), 12),
              returnNotes: index % 2 ? "Contato inicial realizado; retorno em acompanhamento." : null,
              status: index % 2 ? "EM_ANDAMENTO" : "AGUARDANDO",
            },
          },
          evolucoes: {
            create: [
              {
                area: "PSICOLOGIA",
                authorId: psychologyProfessionalId,
                date: new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 5), 12),
                content: "Evolução psicológica fictícia: participante acolhido e engajado no encontro.",
                newGoals: "Retomar estratégias de autorregulação no próximo encontro.",
              },
              {
                area: "SERVICO_SOCIAL",
                authorId: socialProfessionalId,
                date: new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 3), 12),
                content: "Evolução social fictícia: família orientada sobre serviços disponíveis no território.",
                newGoals: "Confirmar retorno da rede de serviços.",
              },
            ],
          },
          reviews: {
            create: {
              date: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate(), 12),
              changes: "Reavaliação demonstrativa do PIA; metas revisadas com a família.",
              newGoals: "Manter articulação entre escola e equipe técnica.",
              responsavel: "Equipe técnica demonstrativa",
              authorId: psychologyProfessionalId,
            },
          },
        },
      });
    }
    attendedIds.push(attended.id);

    for (const [area, type, professionalId] of [
      ["PSICOLOGIA", "INDIVIDUAL", psychologyProfessionalId],
      ["SERVICO_SOCIAL", "ACOLHIMENTO", socialProfessionalId],
    ] as const) {
      const summary = `Atendimento demonstrativo ${attended.id}`;
      const existingAppointment = await prisma.atendimento.findFirst({ where: { area, summary } });
      if (!existingAppointment) {
        await prisma.atendimento.create({
          data: {
            area,
            type,
            date: new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - index), 12),
            startTime: area === "PSICOLOGIA" ? "14:00" : "15:00",
            durationMin: 50,
            status: "REALIZADO",
            summary,
            professionalId,
            atendidos: { connect: { id: attended.id } },
          },
        });
      }
    }
  }

  if (attendedIds.length > 1) {
    for (const [area, type, professionalId, summary] of [
      ["PSICOLOGIA", "GRUPOTERAPIA", psychologyProfessionalId, "Grupo demonstrativo de psicologia"],
      ["SERVICO_SOCIAL", "OFICINA_FAMILIAS", socialProfessionalId, "Oficina demonstrativa com famílias"],
    ] as const) {
      if (!(await prisma.atendimento.findFirst({ where: { area, summary } }))) {
        await prisma.atendimento.create({
          data: {
            area,
            type,
            date: today,
            startTime: "16:00",
            durationMin: 60,
            status: "REALIZADO",
            summary,
            professionalId,
            atendidos: { connect: attendedIds.slice(0, 4).map((id) => ({ id })) },
          },
        });
      }
    }
  }
}

async function main() {
  const passwordHash = await hash("kadiz123", 10);
  const users = new Map<string, { id: string }>();
  for (const user of roles) {
    const saved =
      (await prisma.user.findUnique({ where: { email: user.email } })) ??
      (await prisma.user.create({ data: { ...user, passwordHash } }));
    users.set(user.role, saved);
  }
  const polos = [];
  for (const [name, type, address] of poloNames) {
    const polo = await prisma.polo.findFirst({ where: { name } });
    polos.push(polo ?? (await prisma.polo.create({ data: { name, type, address } })));
  }
  if (process.env.SEED_DEMO !== "true") return;
  if ((await prisma.aluno.count()) > 0) {
    const existingDemoStudents = await prisma.aluno.findMany({
      where: { fullName: { in: names } },
      select: { id: true, fullName: true },
    });
    for (const student of existingDemoStudents) {
      await prisma.aluno.update({
        where: { id: student.id },
        data: demoAddress(names.indexOf(student.fullName)),
      });
    }
    await seedTechnicalDemo(users);
    return;
  }

  const classData = [
    ["Turma 1", 0, "MANHA", "FUTEBOL", "08:00", "09:00", ["SEG", "QUA"]],
    ["Turma 2", 1, "MANHA", "FUTEBOL", "09:00", "10:00", ["TER", "QUI"]],
    ["Turma 3", 2, "TARDE", "FUTSAL", "14:00", "15:00", ["SEG", "QUA"]],
    ["Turma 4", 3, "TARDE", "FUTEBOL", "15:00", "16:00", ["TER", "QUI"]],
    ["Turma 5", 4, "MANHA", "FUTEBOL", "10:00", "11:00", ["SEG", "SEX"]],
    ["Turma 6", 5, "TARDE", "XADREZ", "16:00", "17:00", ["QUA", "SEX"]],
    ["Turma 7", 6, "MANHA", "FUTEBOL", "08:00", "09:00", ["TER", "QUI"]],
    ["Turma 8", 0, "TARDE", "REFORCO_ESCOLAR", "13:00", "14:00", ["SAB"]],
  ] as const;
  const turmas: Turma[] = [];
  for (const [name, poloIndex, shift, modality, startTime, endTime, weekdays] of classData) {
    const current = await prisma.turma.findFirst({ where: { name, poloId: polos[poloIndex].id } });
    turmas.push(
      current ??
        (await prisma.turma.create({
          data: {
            name,
            poloId: polos[poloIndex].id,
            professorId: users.get("PROFESSOR")!.id,
            shift,
            modality,
            startTime,
            endTime,
            weekdays: [...weekdays],
          },
        })),
    );
  }

  const students = [];
  const year = new Date().getFullYear();
  for (let index = 0; index < names.length; index++) {
    const fullName = names[index];
    const vinculo = index % 3 === 0 ? "PARTICULAR" : "PROJETO_SOCIAL";
    const turma = turmas[index % turmas.length];
    const birthDate = new Date(year - 7 - (index % 10), index % 12, 3 + (index % 20), 12);
    const enrolledAt = new Date(Date.now() - ((index % 25) + 5) * 86400000);
    const monthlyFee = vinculo === "PARTICULAR" ? 180 + (index % 5) * 20 : null;
    const student = await prisma.aluno.create({
      data: {
        matricula: `K${year}-${String(index + 1).padStart(4, "0")}`,
        fullName,
        vinculo,
        status: index === 39 ? "LISTA_ESPERA" : "ATIVO",
        poloId: turma.poloId,
        turmaId: turma.id,
        enrolledAt,
        startDate: enrolledAt,
        birthDate,
        sex: index % 2 ? "Feminino" : "Masculino",
        householdSize: vinculo === "PROJETO_SOCIAL" ? 4 + (index % 3) : undefined,
        ...demoAddress(index),
        school: `Escola Municipal ${(index % 4) + 1}`,
        schoolGrade: `${(index % 9) + 1}º ano`,
        guardianName: `Responsável Demo ${String(index + 1).padStart(2, "0")}`,
        guardianRelation: index % 2 ? "MAE" : "PAI",
        guardianPhone: "(47) 99999-0000",
        bloodType: ["A+", "O+", "B+", "O-"][index % 4],
        weekdays: [...classData[index % classData.length][6]],
        monthlyFee: monthlyFee ?? undefined,
        billingDay: 10,
        invoiceName: vinculo === "PARTICULAR" ? `Responsável Demo ${index + 1}` : undefined,
        authTrips: true,
        authImage: index % 2 === 0,
        authTermsAccepted: true,
        documents: {
          create: documentTypes
            .filter((type) => type !== "TERMO_RESPONSABILIDADE" || vinculo === "PROJETO_SOCIAL")
            .map((type, documentIndex) => ({
              type,
              status: index % 4 === 0 && documentIndex < 2 ? "APROVADO" : index % 5 === 0 ? "ENTREGUE" : "PENDENTE",
              deliveredAt: index % 5 === 0 ? enrolledAt : undefined,
              validUntil:
                type === "ATESTADO_MEDICO" || type === "ELETROCARDIOGRAMA" ? new Date(year + 1, 11, 31) : undefined,
            })),
        },
      },
    });
    if (student.vinculo === "PARTICULAR") {
      const dueDate = index === 0 ? new Date(Date.now() - 14 * 86400000) : new Date(year, new Date().getMonth(), 10);
      await prisma.invoice.create({
        data: {
          alunoId: student.id,
          referenceMonth: `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
          amount: student.monthlyFee!,
          dueDate,
          status: "PENDENTE",
        },
      });
    }
    students.push(student);
  }

  for (const turma of turmas) {
    const enrolled = students.filter((student) => student.turmaId === turma.id && student.status === "ATIVO");
    if (enrolled.length) {
      const date = new Date(year, new Date().getMonth(), Math.min(8 + turmas.indexOf(turma), 27), 12);
      await prisma.attendanceSession.create({
        data: {
          turmaId: turma.id,
          date,
          takenById: users.get("SECRETARIA")!.id,
          records: {
            create: enrolled.map((student, index) => ({
              alunoId: student.id,
              status: turmas.indexOf(turma) === 0 && index < 3 ? "FALTA" : "PRESENTE",
            })),
          },
        },
      });
    }
  }
  for (const category of ["PP", "P", "M", "G", "GG"]) {
    await prisma.stockItem.create({
      data: { name: `Uniforme Kadiz ${category}`, category: "UNIFORME", size: category, quantity: 8, minQuantity: 3 },
    });
  }
  await prisma.stockItem.create({
    data: { name: "Bolas de futebol", category: "MATERIAL_ESPORTIVO", quantity: 12, minQuantity: 4 },
  });
  await prisma.stockItem.create({ data: { name: "Doações diversas", category: "DOACAO", quantity: 10 } });
  await prisma.event.create({
    data: {
      title: "Encontro de integração",
      description: "Atividade fictícia de demonstração",
      start: new Date(year, new Date().getMonth() + 1, 5, 9),
      allDay: false,
      category: "EVENTO",
      poloId: polos[0].id,
    },
  });
  await prisma.task.create({
    data: {
      title: "Conferir documentos pendentes",
      priority: "MEDIA",
      status: "ABERTA",
      createdById: users.get("SECRETARIA")!.id,
    },
  });
  await prisma.snack.create({
    data: {
      date: new Date(),
      time: "17:00",
      menu: "Fruta e sanduíche",
      location: "Refeitório da Sede",
      notes: "Cardápio de demonstração",
    },
  });
  await prisma.financeEntry.create({
    data: {
      type: "RECEITA",
      category: "FIA/FMDCA",
      description: "Repasse demonstrativo",
      amount: 50000,
      source: "FIA/FMDCA 2026",
      userId: users.get("FINANCEIRO")!.id,
    },
  });
  await seedTechnicalDemo(users);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

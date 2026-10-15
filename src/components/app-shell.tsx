"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Home,
  Menu,
  Moon,
  Package,
  School,
  Shield,
  Sun,
  Users,
  Utensils,
  Wallet,
  UserCog,
  ChevronDown,
  ClipboardCheck,
  Brain,
  HeartHandshake,
} from "lucide-react";
import type { Permission, PermissionUser } from "@/lib/permissions";
import { canViewNavigation } from "@/lib/permissions";

const groups: { title: string; links: { label: string; href: string; icon: typeof Home; permission: Permission }[] }[] =
  [
    {
      title: "Painel",
      links: [
        { label: "Início", href: "/", icon: Home, permission: "dashboard" },
        { label: "Alunos", href: "/alunos", icon: Users, permission: "students:view" },
        { label: "Novo Cadastro", href: "/alunos/novo", icon: ClipboardCheck, permission: "students:write" },
        { label: "Documentos", href: "/documentos", icon: FileText, permission: "documents" },
      ],
    },
    {
      title: "Operação",
      links: [
        { label: "Polos e Turmas", href: "/polos", icon: School, permission: "poles" },
        { label: "Objetivos e Metas", href: "/objetivos", icon: ClipboardCheck, permission: "objectives" },
        { label: "Chamada", href: "/chamada", icon: ClipboardList, permission: "attendance" },
        { label: "Agenda", href: "/agenda", icon: CalendarDays, permission: "calendar" },
        { label: "Tarefas", href: "/tarefas", icon: ClipboardCheck, permission: "tasks" },
        { label: "Lanche", href: "/lanche", icon: Utensils, permission: "snacks" },
        { label: "Estoque", href: "/estoque", icon: Package, permission: "stock" },
      ],
    },
    {
      title: "Atendimento técnico",
      links: [
        { label: "Serviço Social", href: "/servico-social", icon: HeartHandshake, permission: "social-work" },
        { label: "Psicologia", href: "/psicologia", icon: Brain, permission: "psychology" },
      ],
    },
    { title: "Financeiro", links: [{ label: "Financeiro", href: "/financeiro", icon: Wallet, permission: "finance" }] },
    {
      title: "Administração",
      links: [
        { label: "Usuários", href: "/usuarios", icon: UserCog, permission: "users" },
        { label: "Auditoria", href: "/auditoria", icon: Shield, permission: "audit" },
      ],
    },
  ];

export function AppShell({
  user,
  children,
}: {
  user: PermissionUser & { name?: string | null; email?: string | null };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (user.name ?? user.email ?? "K")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div className={`min-h-screen md:flex ${light ? "bg-neutral-100 text-neutral-900" : "bg-[#0a0a0a] text-white"}`}>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/70 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-60 shrink-0 -translate-x-full flex-col border-r border-neutral-800 bg-[#151515] transition-transform md:sticky md:top-0 md:z-20 md:translate-x-0 ${mobileOpen ? "translate-x-0" : ""} ${collapsed ? "md:w-[76px]" : "md:w-60"}`}
      >
        <Link href="/" className="flex h-16 items-center gap-3 border-b border-neutral-800 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-bold text-black">
            K
          </span>
          {!collapsed && (
            <span>
              <b className="block text-sm">Kadiz</b>
              <small className="text-neutral-400">Escola de Futebol</small>
            </span>
          )}
        </Link>
        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {groups.map((group) => {
            const links = group.links.filter((item) => canViewNavigation(user, item.permission));
            if (!links.length) return null;
            return (
              <div key={group.title}>
                <p
                  className={`mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.15em] text-neutral-500 ${collapsed ? "sr-only" : ""}`}
                >
                  {group.title}
                </p>
                <div className="space-y-1">
                  {links.map(({ label, href, icon: Icon }) => {
                    const isNewStudentPath = pathname === "/alunos/novo";
                    const active =
                      pathname === href ||
                      (href !== "/" && pathname.startsWith(`${href}/`) && !(href === "/alunos" && isNewStudentPath));
                    return (
                      <Link
                        title={collapsed ? label : undefined}
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm ${active ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"}`}
                      >
                        <Icon size={17} />
                        {!collapsed && label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        {!collapsed && (
          <p className="mt-auto shrink-0 px-5 py-5 text-xs text-neutral-600">©2026 Kadiz — Escola de Futebol</p>
        )}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-neutral-800 bg-[#111]/95 px-5 backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Alternar menu"
              className="hidden rounded p-1.5 text-neutral-400 hover:bg-neutral-800 md:block"
            >
              <Menu size={18} />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={mobileOpen}
              className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 md:hidden"
            >
              <Menu size={18} />
            </button>
            <span className="text-xs text-neutral-500">
              Secretaria <span className="mx-2">›</span> <span className="text-neutral-200">{pageName(pathname)}</span>
            </span>
          </div>
          <div className="relative flex items-center gap-3">
            <button
              onClick={() => setLight(!light)}
              aria-label="Alternar tema"
              className="rounded p-2 text-neutral-400 hover:bg-neutral-800"
            >
              {light ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-xs font-semibold"
            >
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#111] bg-emerald-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-52 rounded-lg border border-neutral-700 bg-neutral-900 p-2 shadow-xl">
                <p className="px-2 py-1 text-xs text-neutral-400">{user.name ?? user.email}</p>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full rounded px-2 py-2 text-left text-sm hover:bg-neutral-800"
                >
                  Sair
                </button>
              </div>
            )}
            <ChevronDown className="text-neutral-600" size={13} />
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-7rem)] max-w-[1160px] px-5 py-8">{children}</main>
        <footer className="mx-auto flex max-w-[1160px] items-center justify-between border-t border-neutral-900 px-5 py-5 text-xs text-neutral-600">
          <span>©2026 Kadiz — Escola de Futebol</span>
          <div className="flex gap-4">
            {canViewNavigation(user, "documents") && <Link href="/documentos">Documentos</Link>}
            {canViewNavigation(user, "calendar") && <Link href="/agenda">Agenda</Link>}
            {canViewNavigation(user, "users") && <Link href="/usuarios">Usuários</Link>}
          </div>
        </footer>
      </div>
    </div>
  );
}

function pageName(path: string) {
  if (path === "/alunos/novo") return "Novo Cadastro";
  if (path.startsWith("/atendidos/")) return "Atendido";
  if (path === "/atendidos") return "Atendidos";
  const segment = path.split("/").filter(Boolean)[0] ?? "Início";
  return (
    (
      {
        alunos: "Alunos",
        documentos: "Documentos",
        polos: "Polos e Turmas",
        chamada: "Chamada",
        usuarios: "Usuários",
        psicologia: "Psicologia",
        "servico-social": "Serviço Social",
        financeiro: "Financeiro",
        agenda: "Agenda",
        tarefas: "Tarefas",
        lanche: "Lanche",
        estoque: "Estoque",
        objetivos: "Objetivos e Metas",
        auditoria: "Auditoria",
      } as Record<string, string>
    )[segment] ?? "Início"
  );
}

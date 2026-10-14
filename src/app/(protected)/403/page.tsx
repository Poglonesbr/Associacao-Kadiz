import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto mt-20 max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-10 text-center">
      <ShieldAlert className="mx-auto mb-4 text-amber-400" size={36} />
      <h1 className="text-2xl font-semibold">Acesso restrito</h1>
      <p className="mt-2 text-neutral-400">Esta área contém informações protegidas por sigilo profissional.</p>
      <Link href="/" className="mt-6 inline-block text-sm text-emerald-400">
        Voltar ao início
      </Link>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  if (await getServerSession(authOptions)) redirect("/");
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-2xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-xl font-black text-black">
            K
          </span>
          <div>
            <h1 className="text-xl font-semibold">Kadiz</h1>
            <p className="text-sm text-neutral-400">Escola de Futebol</p>
          </div>
        </div>
        <p className="mb-6 text-sm text-neutral-400">Acesso exclusivo para equipe e profissionais.</p>
        <LoginForm />
      </div>
    </main>
  );
}

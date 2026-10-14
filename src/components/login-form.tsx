"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field } from "@/components/ui";

export function LoginForm() {
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(formData: FormData) {
    const result = await signIn("credentials", { email: formData.get("email"), password: formData.get("password"), redirect: false });
    if (result?.error) setError("E-mail ou senha inválidos.");
    else router.push("/");
  }
  return <form action={submit} className="space-y-4"><Field label="E-mail" name="email" type="email" required placeholder="seu@email.com" /><Field label="Senha" name="password" type="password" required placeholder="••••••••" />{error && <p className="text-sm text-red-400">{error}</p>}<Button className="w-full">Entrar</Button></form>;
}

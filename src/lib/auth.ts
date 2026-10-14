import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: { email: { label: "E-mail", type: "email" }, password: { label: "Senha", type: "password" } },
      async authorize(credentials) {
        const input = loginSchema.safeParse(credentials);
        if (!input.success) return null;
        const user = await prisma.user.findUnique({ where: { email: input.data.email.toLowerCase() } });
        if (!user || !user.active || !(await compare(input.data.password, user.passwordHash))) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          accessPsicologia: user.accessPsicologia,
          accessServicoSocial: user.accessServicoSocial,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) Object.assign(token, user);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as NonNullable<typeof session.user.role>;
        session.user.accessPsicologia = Boolean(token.accessPsicologia);
        session.user.accessServicoSocial = Boolean(token.accessServicoSocial);
      }
      return session;
    },
  },
};

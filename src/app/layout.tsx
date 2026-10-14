import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kadiz | Gestão da Escola",
  description: "Sistema de gestão interna da Associação Kadiz.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    await requirePermission("documents");
    const form = await request.formData();
    const file = form.get("file");
    const documentId = String(form.get("documentId") ?? "");
    if (!(file instanceof File) || !documentId || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Arquivo inválido (máximo 10 MB)." }, { status: 400 });
    const extension = path.extname(file.name).toLowerCase();
    if (![".pdf", ".jpg", ".jpeg", ".png"].includes(extension)) return NextResponse.json({ error: "Formato não permitido." }, { status: 400 });
    const document = await prisma.studentDocument.findUnique({ where: { id: documentId } });
    if (!document) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    const folder = process.env.UPLOAD_DIR ?? "./uploads";
    await mkdir(folder, { recursive: true });
    const fileName = `${randomUUID()}${extension}`;
    const filePath = path.join(folder, fileName);
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    await prisma.studentDocument.update({ where: { id: documentId }, data: { filePath, fileName: file.name, status: "ENTREGUE", deliveredAt: new Date() } });
    return NextResponse.redirect(new URL("/documentos", request.url));
  } catch {
    return NextResponse.json({ error: "Acesso não autorizado ou falha no envio." }, { status: 403 });
  }
}

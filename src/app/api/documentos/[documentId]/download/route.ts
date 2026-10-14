import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/guards";
import { logAccess } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const mimeTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET(_request: Request, { params }: { params: { documentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  try {
    const user = await requirePermission("documents");
    const document = await prisma.studentDocument.findUnique({ where: { id: params.documentId } });
    if (!document?.filePath || !document.fileName) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
    const uploadRoot = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
    const filePath = path.resolve(document.filePath);
    if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
    const data = await readFile(filePath);
    await logAccess({ userId: user.id, action: "VIEW", resource: "StudentDocument", resourceId: document.id, alunoId: document.alunoId });
    const extension = path.extname(filePath).toLowerCase();
    return new NextResponse(data, {
      headers: {
        "Content-Type": mimeTypes[extension] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }
}

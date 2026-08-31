// /api/orientation/metiers — base de connaissances métiers
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const metier = await db.metier.findUnique({
      where: { id },
      include: { filieres: { include: { filiere: true } } },
    });
    if (!metier) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({
      ...metier,
      competences: metier.competencesCles?.split("|").map((s) => s.trim()).filter(Boolean) ?? [],
      filieres: metier.filieres.map((f) => f.filiere),
    });
  }
  const metiers = await db.metier.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(
    metiers.map((m) => ({
      ...m,
      competences: m.competencesCles?.split("|").map((s) => s.trim()).filter(Boolean) ?? [],
    }))
  );
}

// /api/orientation/filieres — base de connaissances filières
// GET : liste (avec profils) ou détail par ?id=
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const filiere = await db.filiere.findUnique({
      where: { id },
      include: { metiers: { include: { metier: true } } },
    });
    if (!filiere) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({
      ...filiere,
      etablissements: filiere.etablissementsDisponibles?.split("|").map((s) => s.trim()).filter(Boolean) ?? [],
      domaines: filiere.domaines?.split("|").map((s) => s.trim()).filter(Boolean) ?? [],
      metiers: filiere.metiers.map((m) => m.metier),
    });
  }
  const filieres = await db.filiere.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(
    filieres.map((f) => ({
      ...f,
      etablissements: f.etablissementsDisponibles?.split("|").map((s) => s.trim()).filter(Boolean) ?? [],
      domaines: f.domaines?.split("|").map((s) => s.trim()).filter(Boolean) ?? [],
    }))
  );
}

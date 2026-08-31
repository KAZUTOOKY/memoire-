// /api/orientation/filieres — base de connaissances filières
// GET : liste (avec profils) ou détail par ?id=
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function parseList(s: string | null): string[] {
  return s?.split("|").map((x) => x.trim()).filter(Boolean) ?? [];
}

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
      etablissements: parseList(filiere.etablissementsDisponibles),
      domaines: parseList(filiere.domaines),
      avantagesFinanciers: parseList(filiere.avantagesFinanciers),
      inconvenientsFinanciers: parseList(filiere.inconvenientsFinanciers),
      avantagesMentaux: parseList(filiere.avantagesMentaux),
      inconvenientsMentaux: parseList(filiere.inconvenientsMentaux),
      avantagesPhysiques: parseList(filiere.avantagesPhysiques),
      inconvenientsPhysiques: parseList(filiere.inconvenientsPhysiques),
      conseils: parseList(filiere.conseils),
      metiers: filiere.metiers.map((m) => m.metier),
    });
  }
  const filieres = await db.filiere.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(
    filieres.map((f) => ({
      ...f,
      etablissements: parseList(f.etablissementsDisponibles),
      domaines: parseList(f.domaines),
      avantagesFinanciers: parseList(f.avantagesFinanciers),
      inconvenientsFinanciers: parseList(f.inconvenientsFinanciers),
      avantagesMentaux: parseList(f.avantagesMentaux),
      inconvenientsMentaux: parseList(f.inconvenientsMentaux),
      avantagesPhysiques: parseList(f.avantagesPhysiques),
      inconvenientsPhysiques: parseList(f.inconvenientsPhysiques),
      conseils: parseList(f.conseils),
    }))
  );
}

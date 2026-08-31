// /api/orientation/users — gestion du profil utilisateur
// POST : crée un utilisateur
// PATCH : met à jour le profil (niveau, filière, localisation)
// GET : récupère un utilisateur par id
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { niveauEtudes, filiereActuelleId, localisation } = body;
    const utilisateur = await db.utilisateur.create({
      data: {
        niveauEtudes: niveauEtudes ?? null,
        filiereActuelleId: filiereActuelleId ?? null,
        localisation: localisation ?? null,
      },
      include: { filiereActuelle: true },
    });
    return NextResponse.json(utilisateur, { status: 201 });
  } catch (e) {
    console.error("[users POST]", e);
    return NextResponse.json({ error: "Erreur de création" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id, niveauEtudes, filiereActuelleId, localisation,
      ambition, rythme, autonomie, styleTravail, toleranceStress, filiereSouhaitee,
    } = body;
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (niveauEtudes !== undefined) data.niveauEtudes = niveauEtudes;
    if (filiereActuelleId !== undefined) data.filiereActuelleId = filiereActuelleId || null;
    if (localisation !== undefined) data.localisation = localisation;
    if (ambition !== undefined) data.ambition = ambition;
    if (rythme !== undefined) data.rythme = rythme;
    if (autonomie !== undefined) data.autonomie = autonomie;
    if (styleTravail !== undefined) data.styleTravail = styleTravail;
    if (toleranceStress !== undefined) data.toleranceStress = toleranceStress;
    if (filiereSouhaitee !== undefined) data.filiereSouhaitee = filiereSouhaitee;

    const utilisateur = await db.utilisateur.update({
      where: { id },
      data,
      include: { filiereActuelle: true },
    });
    return NextResponse.json(utilisateur);
  } catch (e) {
    console.error("[users PATCH]", e);
    return NextResponse.json({ error: "Erreur de mise à jour" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const utilisateur = await db.utilisateur.findUnique({
    where: { id },
    include: { filiereActuelle: true },
  });
  if (!utilisateur) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(utilisateur);
}

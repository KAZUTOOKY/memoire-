// POST /api/orientation/init — Initialise un utilisateur + session (1er lancement)
// GET  /api/orientation/init?utilisateurId=... — Récupère l'état (utilisateur + session active)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const niveauEtudes = body?.niveauEtudes ?? null;
    const localisation = body?.localisation ?? null;

    const utilisateur = await db.utilisateur.create({
      data: {
        niveauEtudes: niveauEtudes ?? null,
        localisation: localisation ?? null,
      },
    });
    const session = await db.session.create({
      data: { utilisateurId: utilisateur.id, statut: "active" },
    });
    return NextResponse.json({ utilisateur, session });
  } catch (e) {
    console.error("[init] erreur", e);
    return NextResponse.json({ error: "Erreur d'initialisation" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const utilisateurId = searchParams.get("utilisateurId");
  if (!utilisateurId) {
    return NextResponse.json({ error: "utilisateurId requis" }, { status: 400 });
  }
  const utilisateur = await db.utilisateur.findUnique({
    where: { id: utilisateurId },
    include: { filiereActuelle: true },
  });
  if (!utilisateur) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  const sessionActive = await db.session.findFirst({
    where: { utilisateurId, statut: "active" },
    orderBy: { dateDebut: "desc" },
  });
  return NextResponse.json({ utilisateur, session: sessionActive });
}

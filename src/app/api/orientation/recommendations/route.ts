// /api/orientation/recommendations — recommandations personnalisées
// GET ?utilisateurId=...&sessionId=... : génère (ou régénère) des recommandations
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recommander, profilDominant } from "@/lib/orientation/recommendation";
import { RIASEC_DIMENSIONS, RIASEC_KEYS, type RiasecDimension } from "@/lib/orientation/riasec-constants";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const utilisateurId = searchParams.get("utilisateurId");
  const sessionId = searchParams.get("sessionId");
  if (!utilisateurId) return NextResponse.json({ error: "utilisateurId requis" }, { status: 400 });

  const utilisateur = await db.utilisateur.findUnique({
    where: { id: utilisateurId },
    include: { filiereActuelle: true },
  });
  if (!utilisateur) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const profilComplet = RIASEC_KEYS.some((k) => (utilisateur as unknown as Record<string, number>)[`score${RIASEC_DIMENSIONS[k as RiasecDimension].label}`] > 0);
  if (!profilComplet) {
    return NextResponse.json({
      error: "Profil RIASEC incomplet",
      message: "Vous devez d'abord passer le test RIASEC pour obtenir des recommandations.",
      profilComplet: false,
    }, { status: 400 });
  }

  const profil = {
    R: utilisateur.scoreRealiste,
    I: utilisateur.scoreInvestigateur,
    A: utilisateur.scoreArtistique,
    S: utilisateur.scoreSocial,
    E: utilisateur.scoreEntreprenant,
    C: utilisateur.scoreConventionnel,
  };

  const metiers = await db.metier.findMany({
    include: { filieres: { include: { filiere: true } } },
  });

  const filieres = await db.filiere.findMany({
    include: { metiers: { include: { metier: true } } },
  });

  const recos = recommander(profil, metiers, { limite: 5 });
  // Recommandations de filières compatibles (même algo)
  const recosFilieres = recommander(profil, filieres, { limite: 4 });

  // Persister si une sessionId est fournie
  let sessionIdFinal = sessionId;
  if (!sessionIdFinal) {
    const session = await db.session.create({
      data: { utilisateurId, statut: "active" },
    });
    sessionIdFinal = session.id;
  }
  await db.recommandation.createMany({
    data: recos.map((r) => ({
      sessionId: sessionIdFinal,
      metierId: r.cible.id,
      scoreCompatibilite: r.scoreCompatibilite,
      justification: r.justification,
    })),
  });

  const dom = profilDominant(profil);

  return NextResponse.json({
    profilComplet: true,
    dominant: dom,
    dominantLabel: RIASEC_DIMENSIONS[dom].label,
    recommandations: recos.map((r) => ({
      metier: {
        id: r.cible.id,
        nom: r.cible.nom,
        secteurActivite: r.cible.secteurActivite,
        salaireMoyen: r.cible.salaireMoyen,
        niveauMinimum: r.cible.niveauMinimum,
        description: r.cible.description,
      },
      scoreCompatibilite: r.scoreCompatibilite,
      justification: r.justification,
    })),
    recommandationsFilieres: recosFilieres.map((r) => ({
      filiere: {
        id: r.cible.id,
        nom: r.cible.nom,
        duree: r.cible.duree,
        conditionsAcces: r.cible.conditionsAcces,
        etablissementsDisponibles: r.cible.etablissementsDisponibles,
        debouchesText: r.cible.debouchesText,
        description: r.cible.description,
      },
      scoreCompatibilite: r.scoreCompatibilite,
      justification: r.justification,
    })),
    sessionId: sessionIdFinal,
  });
}

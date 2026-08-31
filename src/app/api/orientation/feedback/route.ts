// /api/orientation/feedback — feedback utilisateur pour l'apprentissage de l'IA
// POST : enregistre un feedback (👍/👎 + correction) et apprend de nouveaux mots-clés NLU
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyserMessage, type NluContext } from "@/lib/orientation/nlu";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      utilisateurId,
      sessionId,
      interactionId,
      messageUtilisateur,
      reponseBot,
      intentionDetectee,
      note, // 1 = positif, -1 = négatif
      correction,
      intentionCorrecte,
    } = body as {
      utilisateurId?: string;
      sessionId?: string;
      interactionId?: string;
      messageUtilisateur: string;
      reponseBot: string;
      intentionDetectee?: string;
      note: number;
      correction?: string;
      intentionCorrecte?: string;
    };

    if (!messageUtilisateur || typeof note !== "number") {
      return NextResponse.json({ error: "messageUtilisateur et note requis" }, { status: 400 });
    }

    // 1. Enregistrer le feedback
    const feedback = await db.feedback.create({
      data: {
        utilisateurId: utilisateurId ?? null,
        sessionId: sessionId ?? null,
        interactionId: interactionId ?? null,
        messageUtilisateur,
        reponseBot,
        intentionDetectee: intentionDetectee ?? null,
        note,
        correction: correction ?? null,
        intentionCorrecte: intentionCorrecte ?? null,
      },
    });

    // 2. Apprentissage : si feedback négatif + intentionCorrecte fournie,
    //    on extrait les mots-clés du message et on les associe à l'intention correcte
    let motsAppris = 0;
    if (note === -1 && intentionCorrecte && intentionCorrecte !== intentionDetectee) {
      // Charger le contexte NLU pour les filières/métiers
      const filieres = await db.filiere.findMany({ select: { id: true, nom: true, domaines: true } });
      const metiers = await db.metier.findMany({ select: { id: true, nom: true } });
      const ctx: NluContext = {
        filieres: filieres.map((f) => ({
          id: f.id,
          nom: f.nom,
          domaines: f.domaines ? f.domaines.split("|").filter(Boolean) : [],
        })),
        metiers: metiers.map((m) => ({ id: m.id, nom: m.nom })),
      };

      // Analyser le message avec le contexte
      const resultat = analyserMessage(messageUtilisateur, ctx);

      // Extraire les mots significatifs (> 4 lettres, non stop-words)
      const stopWords = new Set([
        "le", "la", "les", "un", "une", "des", "du", "de", "et", "ou", "mais",
        "je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "me", "te",
        "se", "a", "au", "aux", "ce", "cet", "cette", "ces", "mon", "ma", "mes",
        "ton", "ta", "tes", "son", "sa", "ses", "notre", "votre", "leur",
        "que", "qui", "quoi", "comment", "pourquoi", "quand", "où", "est",
        "suis", "etre", "pour", "par", "avec", "sans", "dans", "sur", "sous",
        "pas", "ne", "ni", "plus", "tres", "trop", "bien", "tout", "tous",
        "vous", "aider", "veux", "voudrais", "souhaite", "aimerais", "peux",
        "pouvez", "donner", "montrer", "voir", "savoir", "connaitre",
      ]);

      const mots = messageUtilisateur
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((m) => m.length > 3 && !stopWords.has(m));

      // Associer chaque mot-clé à l'intention correcte (avec upsert)
      for (const mot of [...new Set(mots)].slice(0, 5)) {
        await db.apprentissageNlu.upsert({
          where: { intention_motCle: { intention: intentionCorrecte, motCle: mot } },
          create: { intention: intentionCorrecte, motCle: mot, source: "feedback", poids: 1 },
          update: { poids: { increment: 1 } },
        });
        motsAppris++;
      }
    }

    return NextResponse.json({
      feedback,
      motsAppris,
      message: note === 1
        ? "Merci pour votre retour positif ! 🙌"
        : "Merci pour votre correction. J'ai appris de cette erreur pour mieux vous répondre à l'avenir. 🧠",
    }, { status: 201 });
  } catch (e) {
    console.error("[feedback POST]", e);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

// GET : liste des feedbacks (pour debug/stats)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const utilisateurId = searchParams.get("utilisateurId");
  const where = utilisateurId ? { utilisateurId } : {};
  const feedbacks = await db.feedback.findMany({
    where,
    orderBy: { dateFeedback: "desc" },
    take: 50,
  });
  const stats = {
    total: feedbacks.length,
    positifs: feedbacks.filter((f) => f.note === 1).length,
    negatifs: feedbacks.filter((f) => f.note === -1).length,
  };
  return NextResponse.json({ feedbacks, stats });
}

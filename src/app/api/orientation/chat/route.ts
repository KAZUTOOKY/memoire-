// /api/orientation/chat — point d'entrée principal du chatbot
// POST : { utilisateurId, sessionId, message } -> réponse du dialogue
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gererDialogue } from "@/lib/orientation/dialogue";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { utilisateurId, sessionId, message } = body as {
      utilisateurId: string;
      sessionId: string;
      message: string;
    };
    if (!utilisateurId || !sessionId || !message) {
      return NextResponse.json(
        { error: "utilisateurId, sessionId et message requis" },
        { status: 400 }
      );
    }
    // Vérifier que la session existe et appartient à l'utilisateur
    const session = await db.session.findUnique({ where: { id: sessionId } });
    if (!session || session.utilisateurId !== utilisateurId) {
      return NextResponse.json({ error: "Session invalide" }, { status: 404 });
    }

    const output = await gererDialogue({ utilisateurId, sessionId, message });
    return NextResponse.json(output);
  } catch (e) {
    console.error("[chat POST]", e);
    return NextResponse.json({ error: "Erreur de traitement du message" }, { status: 500 });
  }
}

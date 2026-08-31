// /api/orientation/chat-llm — endpoint de chat utilisant le LLM
// POST : { utilisateurId, sessionId, message, historique } -> réponse LLM
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gererChatLlm } from "@/lib/orientation/llm-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { utilisateurId, sessionId, message, historique } = body as {
      utilisateurId: string;
      sessionId: string;
      message: string;
      historique?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!utilisateurId || !sessionId || !message) {
      return NextResponse.json(
        { error: "utilisateurId, sessionId et message requis" },
        { status: 400 }
      );
    }

    // Verify session
    const session = await db.session.findUnique({ where: { id: sessionId } });
    if (!session || session.utilisateurId !== utilisateurId) {
      return NextResponse.json({ error: "Session invalide" }, { status: 404 });
    }

    const result = await gererChatLlm({
      utilisateurId,
      sessionId,
      message,
      historique: historique ?? [],
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("[chat-llm POST]", e);
    return NextResponse.json({ error: "Erreur de traitement LLM" }, { status: 500 });
  }
}

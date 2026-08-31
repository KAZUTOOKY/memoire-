// /api/orientation/conseiller — redirection vers un conseiller humain
// POST : crée une demande de rappel
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, utilisateurId, nom, contact, motif, urgence } = body as {
      sessionId?: string;
      utilisateurId?: string;
      nom?: string;
      contact?: string;
      motif?: string;
      urgence?: string;
    };
    if (!contact || !motif) {
      return NextResponse.json({ error: "contact et motif requis" }, { status: 400 });
    }
    const demande = await db.demandeConseiller.create({
      data: {
        sessionId: sessionId ?? null,
        utilisateurId: utilisateurId ?? null,
        nom: nom ?? null,
        contact,
        motif,
        urgence: urgence ?? "normale",
      },
    });
    return NextResponse.json({
      demande,
      message: "Votre demande a bien été enregistrée. Un conseiller vous contactera sous 48h ouvrées.",
    }, { status: 201 });
  } catch (e) {
    console.error("[conseiller POST]", e);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

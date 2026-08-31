// Service LLM pour OriensCI — utilise z-ai-web-dev-sdk (backend only)
// Le LLM gère la conversation naturelle, collecte le profil inline,
// pose le test RIASEC dans le chat, et ramène l'utilisateur vers l'objectif.
import ZAI from "z-ai-web-dev-sdk";
import { db } from "../db";
import {
  RIASEC_DIMENSIONS,
  RIASEC_ORDER,
  RIASEC_QUESTIONS,
  type RiasecDimension,
} from "./riasec-constants";
import {
  profilDominant,
  recommander,
  similariteRapide,
} from "./recommendation";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZai() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export interface LlmAction {
  type:
    | "profil_collecte"
    | "test_riasec_question"
    | "test_riasec_termine"
    | "recommandations_generees"
    | "redirection_conseiller"
    | "afficher_filiere"
    | "afficher_metier"
    | "information"
    | "suggestion";
  // données sérialisables renvoyées au client
  donnees?: Record<string, unknown>;
}

export interface LlmResponse {
  reponse: string;
  actions: LlmAction[];
  profilMisAJour?: boolean;
  testProgress?: { current: number; total: number };
}

// Build the system prompt with all context
function buildSystemPrompt(params: {
  utilisateur: {
    id: string;
    niveauEtudes: string | null;
    filiereActuelle?: { nom: string } | null;
    filiereSouhaitee: string | null;
    localisation: string | null;
    scoreRealiste: number;
    scoreInvestigateur: number;
    scoreArtistique: number;
    scoreSocial: number;
    scoreEntreprenant: number;
    scoreConventionnel: number;
    profilDominant: string | null;
    ambition: number | null;
    rythme: number | null;
    autonomie: number | null;
    styleTravail: string | null;
    toleranceStress: number | null;
  };
  filieres: Array<{ nom: string; description: string | null; duree: string | null; domaines: string | null }>;
  metiers: Array<{ nom: string; secteurActivite: string | null; description: string | null }>;
  testEnCours: { current: number; reponses: Record<number, number> } | null;
}): string {
  const { utilisateur, filieres, metiers, testEnCours } = params;
  const profilComplet =
    utilisateur.scoreRealiste + utilisateur.scoreInvestigateur + utilisateur.scoreArtistique +
    utilisateur.scoreSocial + utilisateur.scoreEntreprenant + utilisateur.scoreConventionnel > 0;

  const filieresList = filieres.map((f) => `- ${f.nom}${f.description ? ` : ${f.description.slice(0, 80)}` : ""}`).join("\n");
  const metiersList = metiers.slice(0, 20).map((m) => `- ${m.nom} (${m.secteurActivite ?? "secteur non précisé"})`).join("\n");

  return `Tu es **OriensCI**, un assistant d'orientation académique et professionnelle pour les élèves et étudiants ivoiriens (niveau Terminale à Licence). Tu aides l'utilisateur à choisir une filière et un métier en te basant sur le modèle RIASEC de Holland.

# TA MISSION
1. Connaître l'utilisateur : niveau d'études, filière actuelle, localisation, centres d'intérêt, personnalité.
2. Lui faire passer le test RIASEC (30 affirmations) directement dans le chat, une par une.
3. Calculer ses scores et générer des recommandations personnalisées (métiers + filières).
4. Répondre à ses questions sur les filières, métiers, débouchés (en utilisant la base de connaissances).
5. Le ramener vers l'objectif s'il dérive, avec bienveillance.

# CONTEXTE DE L'UTILISATEUR ACTUEL
- Niveau d'études : ${utilisateur.niveauEtudes ?? "non renseigné"}
- Filière actuelle : ${utilisateur.filiereActuelle?.nom ?? "non renseignée"}
- Filière souhaitée : ${utilisateur.filiereSouhaitee ?? "non renseignée"}
- Localisation : ${utilisateur.localisation ?? "non renseignée"}
- Test RIASEC passé : ${profilComplet ? "OUI" : "NON"}
${profilComplet ? `- Scores : R=${utilisateur.scoreRealiste}/20, I=${utilisateur.scoreInvestigateur}/20, A=${utilisateur.scoreArtistique}/20, S=${utilisateur.scoreSocial}/20, E=${utilisateur.scoreEntreprenant}/20, C=${utilisateur.scoreConventionnel}/20
- Profil dominant : ${utilisateur.profilDominant ?? "non calculé"}` : ""}
- Personnalité : ambition=${utilisateur.ambition ?? "?"}/5, rythme=${utilisateur.rythme ?? "?"}/5, autonomie=${utilisateur.autonomie ?? "?"}/5, style=${utilisateur.styleTravail ?? "?"}, stress=${utilisateur.toleranceStress ?? "?"}/5
${testEnCours ? `- TEST EN COURS : question ${testEnCours.current + 1}/30, ${Object.keys(testEnCours.reponses).length} réponses collectées` : ""}

# BASE DE CONNAISSANCES
## Filières disponibles (contexte ivoirien) :
${filieresList}

## Métiers (extrait) :
${metiersList}

# MODÈLE RIASEC (Holland)
- R = Réaliste (manuel, technique, plein air)
- I = Investigateur (recherche, analyse, science)
- A = Artistique (créativité, expression, design)
- S = Social (aider, enseigner, soigner)
- E = Entreprenant (diriger, persuader, entreprendre)
- C = Conventionnel (organiser, rigueur, chiffres)

# RÈGLES DE CONVERSATION
1. **Langue** : Tu parles en français, de manière chaleureuse et accessible (l'utilisateur est un jeune ivoirien).
2. **Concision** : Réponses courtes (max 150 mots) sauf si l'utilisateur demande du détail.
3. **Profil inline** : Si le niveau/filière/localisation est manquant, pose UNE question à la fois pour le récupérer, naturellement dans la conversation.
4. **Test RIASEC inline** : Si l'utilisateur n'a pas passé le test et que le moment est opportun (après le profil de base), propose de le passer. S'il accepte, pose les 30 affirmations UNE PAR UNE. Pour chaque affirmation, demande à l'utilisateur d'indiquer son niveau d'accord (0 = pas du tout d'accord, 1 = plutôt en désaccord, 2 = neutre, 3 = plutôt d'accord, 4 = tout à fait d'accord). Accepte aussi les réponses en langage naturel ("d'accord", "pas d'accord", "oui", "non", "tout à fait"). Après chaque réponse, passe à la question suivante. Quand les 30 sont répondues, déclenche l'action "test_riasec_termine".
5. **Digressions** : Si l'utilisateur dévie, réponds brièvement à sa question puis ramène-le avec douceur vers l'orientation ("Au fait, pour bien vous orienter...").
6. **Recommandations** : Quand le test est terminé, propose de générer les recommandations.
7. **Conseiller humain** : Si la demande dépasse tes capacités, propose la redirection vers un conseiller humain.

# FORMAT DE RÉPONSE (OBLIGATOIRE)
Tu DOIS répondre en JSON valide uniquement, avec cette structure exacte :
\`\`\`json
{
  "reponse": "ton message à l'utilisateur (texte simple, peut contenir **gras** et listes)",
  "actions": [
    {
      "type": "un_des_types_ci_dessous",
      "donnees": { ... }
    }
  ]
}
\`\`\`

## Types d'actions possibles :
- "profil_collecte" : quand tu as récupéré une info de profil. donnees: { champ: "niveauEtudes"|"localisation"|"filiereSouhaitee", valeur: string }
- "test_riasec_question" : quand tu poses une question du test. donnees: { ordre: number (1-30), dimension: "R"|"I"|"A"|"S"|"E"|"C", enonce: string }
- "test_riasec_termine" : quand les 30 questions sont répondues. donnees: {} (le système calculera les scores)
- "recommandations_generees" : pour déclencher la génération de recommandations. donnees: {}
- "redirection_conseiller" : pour rediriger vers un conseiller humain. donnees: {}
- "afficher_filiere" : pour afficher la fiche détaillée d'une filière. donnees: { nom: string }
- "afficher_metier" : pour afficher la fiche d'un métier. donnees: { nom: string }
- "suggestion" : pour proposer des réponses rapides. donnees: { message: string } (peut être multiple)
- "information" : action neutre, juste du texte. donnees: {} (ou omis)

## Exemples :
- Profil manquant → pose la question + action "information"
- Question du test → action "test_riasec_question" avec l'énoncé
- Test fini → action "test_riasec_termine"
- User demande reco → action "recommandations_generees"

# IMPORTANT
- Réponds TOUJOURS en JSON valide, sans texte avant ou après.
- Le champ "reponse" contient ton message en langage naturel.
- Les "actions" indiquent au système ce qu'il doit faire (sauvegarder, calculer, etc.).
- Tu peux mettre plusieurs actions (ex: reponse + suggestion).
- Sois empathique et encourageant. L'orientation est un moment clé de vie.`;
}

// Extract profile info from the LLM response (action profil_collecte)
async function applyProfilCollecte(utilisateurId: string, champ: string, valeur: string) {
  const data: Record<string, unknown> = {};
  if (champ === "niveauEtudes") data.niveauEtudes = valeur;
  else if (champ === "localisation") data.localisation = valeur;
  else if (champ === "filiereSouhaitee") data.filiereSouhaitee = valeur;
  else return false;

  await db.utilisateur.update({ where: { id: utilisateurId }, data });
  return true;
}

// Parse the LLM JSON response
function parseLlmResponse(raw: string): { reponse: string; actions: LlmAction[] } {
  // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
  let jsonStr = raw.trim();
  // Remove markdown code fences if present
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      reponse: parsed.reponse ?? raw,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    };
  } catch {
    // If JSON parse fails, return the raw text as the response
    return { reponse: raw, actions: [] };
  }
}

export interface LlmChatInput {
  utilisateurId: string;
  sessionId: string;
  message: string;
  // Conversation history (last N messages)
  historique: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function gererChatLlm(input: LlmChatInput): Promise<LlmResponse> {
  const { utilisateurId, sessionId, message } = input;

  // Load user
  const utilisateur = await db.utilisateur.findUnique({
    where: { id: utilisateurId },
    include: { filiereActuelle: true },
  });
  if (!utilisateur) {
    return {
      reponse: "Je ne trouve pas votre profil. Veuillez recharger la page.",
      actions: [],
    };
  }

  // Load knowledge base
  const filieres = await db.filiere.findMany({ select: { nom: true, description: true, duree: true, domaines: true } });
  const metiers = await db.metier.findMany({ select: { nom: true, secteurActivite: true, description: true } });

  // Load test in progress state (stored in session metadata or interaction metadata)
  // We store test progress in the last interaction's metadata or reconstruct from session
  const lastInteractions = await db.interaction.findMany({
    where: { sessionId, messageUtilisateur: { not: null } },
    orderBy: { dateHeure: "desc" },
    take: 50,
  });

  // Detect if test is in progress by looking for test_riasec_question actions in recent interactions
  let testEnCours: { current: number; reponses: Record<number, number> } | null = null;
  // Parse recent interactions to find test state
  for (const it of lastInteractions.reverse()) {
    if (it.metadata) {
      try {
        const meta = JSON.parse(it.metadata);
        if (meta.testProgress) {
          testEnCours = meta.testProgress;
        }
        if (meta.testTermine) {
          testEnCours = null;
          break;
        }
      } catch {
        /* ignore */
      }
    }
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt({ utilisateur, filieres, metiers, testEnCours });

  // Build messages array (system + history + current message)
  // Convert history to ChatMessage format
  const messages: Array<{ role: "assistant" | "user"; content: string }> = [
    { role: "assistant", content: systemPrompt },
  ];
  // Add up to 10 last messages from history for context
  const recentHistory = input.historique.slice(-10);
  for (const h of recentHistory) {
    messages.push({ role: h.role, content: h.content });
  }
  messages.push({ role: "user", content: message });

  // Call LLM
  let rawResponse: string;
  try {
    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
      stream: false,
    });
    rawResponse = completion.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    console.error("[LLM] erreur:", e);
    return {
      reponse: "Désolé, j'ai rencontré une erreur technique. Pouvez-vous reformuler votre message ?",
      actions: [],
    };
  }

  const parsed = parseLlmResponse(rawResponse);
  let profilMisAJour = false;
  let testProgress: { current: number; total: number } | undefined;
  const finalActions: LlmAction[] = [];

  // Process actions
  for (const action of parsed.actions) {
    switch (action.type) {
      case "profil_collecte": {
        const champ = action.donnees?.champ as string;
        const valeur = action.donnees?.valeur as string;
        if (champ && valeur) {
          const ok = await applyProfilCollecte(utilisateurId, champ, valeur);
          if (ok) profilMisAJour = true;
        }
        finalActions.push(action);
        break;
      }
      case "test_riasec_question": {
        const ordre = action.donnees?.ordre as number;
        if (ordre) {
          testProgress = { current: ordre, total: 30 };
        }
        finalActions.push(action);
        break;
      }
      case "test_riasec_termine": {
        // The LLM says test is done. We need to collect all responses from the conversation
        // and compute scores. The responses are in the conversation history.
        // We'll save this action and let the frontend trigger the score computation.
        finalActions.push(action);
        break;
      }
      case "recommandations_generees": {
        // Generate recommendations
        const updatedUser = await db.utilisateur.findUnique({ where: { id: utilisateurId } });
        if (updatedUser) {
          const profil = {
            R: updatedUser.scoreRealiste,
            I: updatedUser.scoreInvestigateur,
            A: updatedUser.scoreArtistique,
            S: updatedUser.scoreSocial,
            E: updatedUser.scoreEntreprenant,
            C: updatedUser.scoreConventionnel,
          };
          const profilComplet = Object.values(profil).some((v) => v > 0);
          if (profilComplet) {
            const allMetiers = await db.metier.findMany({ include: { filieres: { include: { filiere: true } } } });
            const allFilieres = await db.filiere.findMany();
            const recosMetiers = recommander(profil, allMetiers, { limite: 5 });
            const recosFilieres = recommander(profil, allFilieres, { limite: 4 });
            // Persist
            await db.recommandation.createMany({
              data: recosMetiers.map((r) => ({
                sessionId,
                metierId: r.cible.id,
                scoreCompatibilite: r.scoreCompatibilite,
                justification: r.justification,
              })),
            });
            const dom = profilDominant(profil);
            finalActions.push({
              type: "recommandations_generees",
              donnees: {
                recommandations: recosMetiers.map((r) => ({
                  metierId: r.cible.id,
                  nom: r.cible.nom,
                  score: r.scoreCompatibilite,
                  justification: r.justification,
                  secteur: r.cible.secteurActivite,
                  salaire: r.cible.salaireMoyen,
                })),
                recommandationsFilieres: recosFilieres.map((r) => ({
                  filiereId: r.cible.id,
                  nom: r.cible.nom,
                  score: r.scoreCompatibilite,
                  justification: r.justification,
                  duree: r.cible.duree,
                  etablissements: r.cible.etablissementsDisponibles
                    ? r.cible.etablissementsDisponibles.split("|").map((s) => s.trim()).filter(Boolean)
                    : [],
                  debouches: r.cible.debouchesText,
                  description: r.cible.description,
                  conditionsAcces: r.cible.conditionsAcces,
                  avantagesFinanciers: r.cible.avantagesFinanciers ? r.cible.avantagesFinanciers.split("|").filter(Boolean) : [],
                  inconvenientsFinanciers: r.cible.inconvenientsFinanciers ? r.cible.inconvenientsFinanciers.split("|").filter(Boolean) : [],
                  avantagesMentaux: r.cible.avantagesMentaux ? r.cible.avantagesMentaux.split("|").filter(Boolean) : [],
                  inconvenientsMentaux: r.cible.inconvenientsMentaux ? r.cible.inconvenientsMentaux.split("|").filter(Boolean) : [],
                  avantagesPhysiques: r.cible.avantagesPhysiques ? r.cible.avantagesPhysiques.split("|").filter(Boolean) : [],
                  inconvenientsPhysiques: r.cible.inconvenientsPhysiques ? r.cible.inconvenientsPhysiques.split("|").filter(Boolean) : [],
                  conseils: r.cible.conseils ? r.cible.conseils.split("|").filter(Boolean) : [],
                })),
                dominant: dom,
                dominantLabel: RIASEC_DIMENSIONS[dom].label,
              },
            });
          }
        }
        break;
      }
      case "afficher_filiere": {
        const nom = action.donnees?.nom as string;
        if (nom) {
          const f = await db.filiere.findFirst({ where: { nom: { equals: nom } } });
          if (f) {
            const updatedUser2 = await db.utilisateur.findUnique({ where: { id: utilisateurId } });
            if (updatedUser2) {
              const profil = {
                R: updatedUser2.scoreRealiste, I: updatedUser2.scoreInvestigateur, A: updatedUser2.scoreArtistique,
                S: updatedUser2.scoreSocial, E: updatedUser2.scoreEntreprenant, C: updatedUser2.scoreConventionnel,
              };
              const profilComplet = Object.values(profil).some((v) => v > 0);
              const score = profilComplet ? similariteRapide(profil, f) : undefined;
              finalActions.push({
                type: "afficher_filiere",
                donnees: {
                  filiere: {
                    nom: f.nom,
                    description: f.description,
                    duree: f.duree,
                    conditionsAcces: f.conditionsAcces,
                    etablissements: f.etablissementsDisponibles ? f.etablissementsDisponibles.split("|").map((s) => s.trim()).filter(Boolean) : [],
                    debouches: f.debouchesText,
                    avantagesFinanciers: f.avantagesFinanciers ? f.avantagesFinanciers.split("|").filter(Boolean) : [],
                    inconvenientsFinanciers: f.inconvenientsFinanciers ? f.inconvenientsFinanciers.split("|").filter(Boolean) : [],
                    avantagesMentaux: f.avantagesMentaux ? f.avantagesMentaux.split("|").filter(Boolean) : [],
                    inconvenientsMentaux: f.inconvenientsMentaux ? f.inconvenientsMentaux.split("|").filter(Boolean) : [],
                    avantagesPhysiques: f.avantagesPhysiques ? f.avantagesPhysiques.split("|").filter(Boolean) : [],
                    inconvenientsPhysiques: f.inconvenientsPhysiques ? f.inconvenientsPhysiques.split("|").filter(Boolean) : [],
                    conseils: f.conseils ? f.conseils.split("|").filter(Boolean) : [],
                    score,
                  },
                },
              });
            }
          }
        }
        break;
      }
      default:
        finalActions.push(action);
    }
  }

  // If no actions, add a default "information" action
  if (finalActions.length === 0) {
    finalActions.push({ type: "information" });
  }

  // Persist the interaction
  const intention = await db.intention.findUnique({ where: { libelle: "information_generale" } });
  await db.interaction.create({
    data: {
      sessionId,
      intentionId: intention?.id,
      messageUtilisateur: message,
      reponseSysteme: parsed.reponse,
      metadata: JSON.stringify({
        source: "llm",
        actions: finalActions.map((a) => a.type),
        testProgress: testProgress,
      }),
    },
  });

  return {
    reponse: parsed.reponse,
    actions: finalActions,
    profilMisAJour,
    testProgress,
  };
}

// Helper: compute RIASEC scores from inline test answers collected by the LLM
export async function calculerScoresRiasecDepuisReponses(
  utilisateurId: string,
  reponses: Record<number, number>
): Promise<{ scores: Record<RiasecDimension, number>; dominant: RiasecDimension }> {
  const scores: Record<RiasecDimension, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const q of RIASEC_QUESTIONS) {
    const val = reponses[q.ordre];
    if (typeof val === "number" && val >= 0 && val <= 4) {
      scores[q.dimension] += val;
    }
  }
  // Normalize to /20
  for (const k of RIASEC_ORDER) {
    scores[k] = Math.round((scores[k] / 20) * 20);
  }
  const dom = profilDominant(scores);
  await db.utilisateur.update({
    where: { id: utilisateurId },
    data: {
      scoreRealiste: scores.R,
      scoreInvestigateur: scores.I,
      scoreArtistique: scores.A,
      scoreSocial: scores.S,
      scoreEntreprenant: scores.E,
      scoreConventionnel: scores.C,
      profilDominant: dom,
    },
  });
  return { scores, dominant: dom };
}

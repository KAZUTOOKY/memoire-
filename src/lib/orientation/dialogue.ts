// Gestionnaire de dialogue — coordonne les échanges, relance si infos manquantes.
// Dépend de la couche données (Prisma) et des modules NLU + recommandation.
import { db } from "../db";
import { analyserMessage, type NluResult, type NluContext } from "./nlu";
import {
  recommander,
  profilDominant,
  genererJustification,
  type ProfilRiasec,
} from "./recommendation";
import {
  RIASEC_DIMENSIONS,
  RIASEC_KEYS,
  type RiasecDimension,
} from "./riasec-constants";

export interface DialogueInput {
  utilisateurId: string;
  sessionId: string;
  message: string;
}

export interface DialogueAction {
  type:
    | "texte"
    | "proposer_test"
    | "proposer_recommandations"
    | "demarrer_profil"
    | "redirection_conseiller"
    | "afficher_profil"
    | "afficher_filiere"
    | "afficher_metier"
    | "afficher_liste_filieres"
    | "afficher_liste_metiers";
  texte: string;
  // données complémentaires sérialisables (renvoyées au client pour rendu enrichi)
  donnees?: Record<string, unknown>;
}

export interface DialogueOutput {
  reponseSysteme: string;
  intentionDetectee: string;
  confidence: number;
  actions: DialogueAction[];
  interactionId?: string;
}

async function construireContexteNLU(): Promise<NluContext> {
  const filieres = await db.filiere.findMany({
    select: { id: true, nom: true, domaines: true },
  });
  const metiers = await db.metier.findMany({
    select: { id: true, nom: true },
  });
  return {
    filieres: filieres.map((f) => ({
      id: f.id,
      nom: f.nom,
      domaines: f.domaines ? f.domaines.split("|").filter(Boolean) : [],
    })),
    metiers: metiers.map((m) => ({ id: m.id, nom: m.nom })),
  };
}

function profilUtilisateurVersProfilRiasec(u: {
  scoreRealiste: number;
  scoreInvestigateur: number;
  scoreArtistique: number;
  scoreSocial: number;
  scoreEntreprenant: number;
  scoreConventionnel: number;
}): ProfilRiasec {
  return {
    R: u.scoreRealiste,
    I: u.scoreInvestigateur,
    A: u.scoreArtistique,
    S: u.scoreSocial,
    E: u.scoreEntreprenant,
    C: u.scoreConventionnel,
  };
}

function profilEstRenseigne(profil: ProfilRiasec): boolean {
  return RIASEC_KEYS.some((k) => profil[k] > 0);
}

// Formatage d'une filière pour réponse
function formaterFiliere(f: {
  nom: string;
  description: string | null;
  conditionsAcces: string | null;
  etablissementsDisponibles: string | null;
  duree: string | null;
  debouchesText: string | null;
}): string {
  return [
    `📚 **${f.nom}**`,
    f.description ? `_${f.description}_` : "",
    "",
    `🔹 **Durée** : ${f.duree ?? "non précisée"}`,
    `🔹 **Conditions d'accès** : ${f.conditionsAcces ?? "non précisées"}`,
    `🔹 **Établissements** : ${f.etablissementsDisponibles?.replace(/\s*\|\s*/g, ", ") ?? "non précisés"}`,
    `🔹 **Débouchés** : ${f.debouchesText ?? "non précisés"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function formaterMetier(m: {
  nom: string;
  description: string | null;
  secteurActivite: string | null;
  descriptionDebouches: string | null;
  salaireMoyen: string | null;
  competencesCles: string | null;
  niveauMinimum: string | null;
}): string {
  return [
    `💼 **${m.nom}**`,
    m.description ? `_${m.description}_` : "",
    "",
    `🔹 **Secteur** : ${m.secteurActivite ?? "non précisé"}`,
    `🔹 **Niveau minimum** : ${m.niveauMinimum ?? "non précisé"}`,
    `🔹 **Salaire moyen (CI)** : ${m.salaireMoyen ?? "non précisé"}`,
    `🔹 **Compétences clés** : ${m.competencesCles?.replace(/\s*\|\s*/g, ", ") ?? "non précisées"}`,
    `🔹 **Débouchés** : ${m.descriptionDebouches ?? "non précisés"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function gererDialogue(input: DialogueInput): Promise<DialogueOutput> {
  const { utilisateurId, sessionId, message } = input;

  const utilisateur = await db.utilisateur.findUnique({
    where: { id: utilisateurId },
    include: { filiereActuelle: true },
  });
  if (!utilisateur) {
    return {
      reponseSysteme:
        "Je ne trouve pas votre profil utilisateur. Veuillez créer votre profil pour commencer.",
      intentionDetectee: "information_generale",
      confidence: 0,
      actions: [{ type: "demarrer_profil", texte: "Créer mon profil" }],
    };
  }

  const ctx = await construireContexteNLU();
  const nlu: NluResult = analyserMessage(message, ctx);

  const profil = profilUtilisateurVersProfilRiasec(utilisateur);
  const profilComplet = profilEstRenseigne(profil);
  const profilDeBaseRenseigne = !!(utilisateur.niveauEtudes || utilisateur.localisation || utilisateur.filiereActuelleId);

  let actions: DialogueAction[] = [];
  let reponseSysteme = "";

  switch (nlu.intent) {
    case "salutation": {
      reponseSysteme = profilDeBaseRenseigne
        ? `Bonjour 👋 ! Ravi de vous revoir. Je suis **OriensCI**, votre assistant d'orientation. En quoi puis-je vous aider aujourd'hui ?`
        : `Bonjour 👋 ! Je suis **OriensCI**, votre assistant d'orientation académique et professionnelle en Côte d'Ivoire.\n\nPour bien vous accompagner, je vous propose de commencer par créer votre profil (niveau d'études, filière actuelle, localisation) puis de passer le test RIASEC. Vous pouvez aussi me poser une question libre à tout moment.`;
      actions = [{ type: "texte", texte: reponseSysteme }];
      if (!profilDeBaseRenseigne) {
        actions.push({ type: "demarrer_profil", texte: "Créer mon profil" });
      }
      break;
    }

    case "remerciement": {
      reponseSysteme = "Avec plaisir ! 🙌 N'hésitez pas si vous avez d'autres questions — sur une filière, un métier, les débouchés, ou pour relancer une recommandation.";
      actions = [{ type: "texte", texte: reponseSysteme }];
      break;
    }

    case "information_generale": {
      reponseSysteme = [
        "Je suis **OriensCI**, un chatbot d'aide à l'orientation académique et professionnelle adapté au contexte ivoirien.",
        "",
        "Voici ce que je peux faire pour vous :",
        "• 📋 Créer votre **profil** (niveau, filière, localisation)",
        "• 🧭 Vous faire passer le **test RIASEC** (modèle de Holland) pour identifier vos intérêts",
        "• 💬 Répondre à vos **questions** sur les filières, métiers et débouchés",
        "• 🎯 Générer des **recommandations personnalisées** (score de compatibilité + justification)",
        "• 👤 Vous **rediriger vers un conseiller humain** si besoin",
        "",
        "Comment souhaitez-vous commencer ?",
      ].join("\n");
      actions = [
        { type: "texte", texte: reponseSysteme },
        { type: "demarrer_profil", texte: "Créer mon profil" },
        { type: "proposer_test", texte: "Passer le test RIASEC" },
      ];
      break;
    }

    case "demarrage_profil": {
      reponseSysteme = "Parfait ! Configurons votre profil ensemble. Cliquez sur le bouton ci-dessous pour ouvrir le formulaire de profil.";
      actions = [
        { type: "demarrage_profil", texte: reponseSysteme },
        { type: "demarrer_profil", texte: "Ouvrir le formulaire de profil" },
      ];
      break;
    }

    case "demande_test_riasec": {
      reponseSysteme = profilComplet
        ? "Vous avez déjà passé le test RIASEC. Vous pouvez le repasser pour affiner vos résultats, ou consulter votre profil actuel."
        : "Excellent ! Le test RIASEC comporte 30 affirmations. Pour chacune, indiquez votre niveau d'accord. Cela nous permettra de calculer vos 6 scores (Réaliste, Investigateur, Artistique, Social, Entreprenant, Conventionnel) et de vous proposer des métiers compatibles.";
      actions = [
        { type: "texte", texte: reponseSysteme },
        { type: "proposer_test", texte: profilComplet ? "Repasser le test" : "Démarrer le test RIASEC" },
      ];
      break;
    }

    case "consultation_profil": {
      if (!profilComplet && !profilDeBaseRenseigne) {
        reponseSysteme = "Vous n'avez pas encore de profil enregistré. Commencez par renseigner votre profil de base, puis passez le test RIASEC.";
        actions = [
          { type: "texte", texte: reponseSysteme },
          { type: "demarrer_profil", texte: "Créer mon profil" },
          { type: "proposer_test", texte: "Passer le test RIASEC" },
        ];
        break;
      }
      const dom = profilComplet ? profilDominant(profil) : null;
      const lignes: string[] = ["📊 **Votre profil OriensCI**", ""];
      lignes.push(`🔹 **Niveau d'études** : ${utilisateur.niveauEtudes ?? "non renseigné"}`);
      lignes.push(`🔹 **Filière actuelle** : ${utilisateur.filiereActuelle?.nom ?? "non renseignée"}`);
      lignes.push(`🔹 **Localisation** : ${utilisateur.localisation ?? "non renseignée"}`);
      if (profilComplet) {
        lignes.push("");
        lignes.push("🧭 **Vos scores RIASEC** :");
        for (const k of RIASEC_KEYS) {
          const dim = RIASEC_DIMENSIONS[k as RiasecDimension];
          lignes.push(`• ${dim.label} (${k}) : **${profil[k]}** / 20`);
        }
        lignes.push("");
        lignes.push(`🎯 **Profil dominant** : **${RIASEC_DIMENSIONS[dom as RiasecDimension].label}** — ${RIASEC_DIMENSIONS[dom as RiasecDimension].description}`);
      } else {
        lignes.push("");
        lignes.push("_Vous n'avez pas encore passé le test RIASEC. Passez-le pour obtenir vos scores._");
      }
      reponseSysteme = lignes.join("\n");
      actions = [
        { type: "afficher_profil", texte: reponseSysteme, donnees: { profil, profilComplet, dominant: dom } },
      ];
      if (!profilComplet) {
        actions.push({ type: "proposer_test", texte: "Passer le test RIASEC" });
      }
      break;
    }

    case "demande_recommandation": {
      if (!profilComplet) {
        reponseSysteme = "Pour générer des recommandations personnalisées, je dois d'abord connaître vos scores RIASEC. Passons le test !";
        actions = [
          { type: "texte", texte: reponseSysteme },
          { type: "proposer_test", texte: "Passer le test RIASEC" },
        ];
        break;
      }
      const metiers = await db.metier.findMany({
        include: { filieres: { include: { filiere: true } } },
      });
      const recos = recommander(profil, metiers, {
        limite: 5,
        filtreNiveau: (m) => {
          // RG : on filtre selon le niveau d'études minimum déclaré
          if (!utilisateur.niveauEtudes || !m.niveauMinimum) return true;
          // logique souple : si l'utilisateur est en Terminale, on garde tout
          return true;
        },
      });
      // Persistance des recommandations (RG6)
      await db.recommandation.createMany({
        data: recos.map((r) => ({
          sessionId,
          metierId: r.cible.id,
          scoreCompatibilite: r.scoreCompatibilite,
          justification: r.justification,
        })),
      });
      const dom = profilDominant(profil);
      const lignes: string[] = [
        `🎯 Voici vos **${recos.length} recommandations personnalisées** (profil dominant : **${RIASEC_DIMENSIONS[dom].label}**) :`,
        "",
      ];
      recos.forEach((r, i) => {
        lignes.push(`**${i + 1}. ${r.cible.nom}** — compatibilité **${Math.round(r.scoreCompatibilite * 100)}%**`);
        lignes.push(`   _${r.justification}_`);
        if (r.cible.secteurActivite) lignes.push(`   🔹 Secteur : ${r.cible.secteurActivite}`);
        lignes.push("");
      });
      reponseSysteme = lignes.join("\n");
      actions = [
        {
          type: "proposer_recommandations",
          texte: reponseSysteme,
          donnees: {
            recommandations: recos.map((r) => ({
              metierId: r.cible.id,
              nom: r.cible.nom,
              score: r.scoreCompatibilite,
              justification: r.justification,
              secteur: r.cible.secteurActivite,
              salaire: r.cible.salaireMoyen,
            })),
            dominant: dom,
          },
        },
      ];
      break;
    }

    case "recherche_filiere": {
      const filiereNom = nlu.entities.filiereNom;
      if (filiereNom) {
        const f = await db.filiere.findFirst({
          where: { nom: { equals: filiereNom } },
        });
        if (f) {
          reponseSysteme = formaterFiliere(f);
          // métiers accessibles depuis cette filière
          const metiers = await db.filiereMetier.findMany({
            where: { filiereId: f.id },
            include: { metier: true },
          });
          if (metiers.length > 0) {
            reponseSysteme += `\n\n🔹 **Métiers accessibles** : ${metiers.map((m) => m.metier.nom).join(", ")}`;
          }
          actions = [
            { type: "afficher_filiere", texte: reponseSysteme, donnees: { filiereId: f.id, nom: f.nom } },
          ];
        } else {
          reponseSysteme = `Je n'ai pas trouvé de filière correspondant à "${filiereNom}". Voici la liste des filières disponibles :`;
          const filieres = await db.filiere.findMany();
          actions = [
            { type: "texte", texte: reponseSysteme },
            { type: "afficher_liste_filieres", texte: reponseSysteme, donnees: { filieres: filieres.map((x) => ({ id: x.id, nom: x.nom })) } },
          ];
        }
      } else {
        const filieres = await db.filiere.findMany({ orderBy: { nom: "asc" } });
        reponseSysteme = `Voici les **${filieres.length} filières** de notre base (contexte ivoirien) :\n\n${filieres.map((f, i) => `${i + 1}. ${f.nom}`).join("\n")}\n\nCliquez sur une filière pour en savoir plus.`;
        actions = [
          { type: "afficher_liste_filieres", texte: reponseSysteme, donnees: { filieres: filieres.map((f) => ({ id: f.id, nom: f.nom })) } },
        ];
      }
      break;
    }

    case "recherche_metier": {
      const metierNom = nlu.entities.metierNom;
      if (metierNom) {
        const m = await db.metier.findFirst({
          where: { nom: { equals: metierNom } },
        });
        if (m) {
          reponseSysteme = formaterMetier(m);
          const filieres = await db.filiereMetier.findMany({
            where: { metierId: m.id },
            include: { filiere: true },
          });
          if (filieres.length > 0) {
            reponseSysteme += `\n\n🔹 **Filières pour y accéder** : ${filieres.map((f) => f.filiere.nom).join(", ")}`;
          }
          actions = [
            { type: "afficher_metier", texte: reponseSysteme, donnees: { metierId: m.id, nom: m.nom } },
          ];
        } else {
          reponseSysteme = `Je n'ai pas trouvé le métier "${metierNom}". Voici la liste des métiers disponibles :`;
          const metiers = await db.metier.findMany();
          actions = [
            { type: "texte", texte: reponseSysteme },
            { type: "afficher_liste_metiers", texte: reponseSysteme, donnees: { metiers: metiers.map((x) => ({ id: x.id, nom: x.nom })) } },
          ];
        }
      } else {
        const metiers = await db.metier.findMany({ orderBy: { nom: "asc" } });
        reponseSysteme = `Voici les **${metiers.length} métiers** de notre base :\n\n${metiers.map((m, i) => `${i + 1}. ${m.nom}`).join("\n")}\n\nCliquez sur un métier pour en savoir plus.`;
        actions = [
          { type: "afficher_liste_metiers", texte: reponseSysteme, donnees: { metiers: metiers.map((m) => ({ id: m.id, nom: m.nom })) } },
        ];
      }
      break;
    }

    case "demande_debouches": {
      // Si une filière ou un métier est mentionné, on affiche ses débouchés
      if (nlu.entities.metierNom) {
        const m = await db.metier.findFirst({
          where: { nom: { equals: nlu.entities.metierNom } },
        });
        if (m) {
          reponseSysteme = `💼 **Débouchés du métier ${m.nom}** :\n\n${m.descriptionDebouches ?? "Information non disponible."}\n\n🔹 Salaire moyen (CI) : ${m.salaireMoyen ?? "non précisé"}`;
          actions = [{ type: "afficher_metier", texte: reponseSysteme, donnees: { metierId: m.id, nom: m.nom } }];
          break;
        }
      }
      if (nlu.entities.filiereNom) {
        const f = await db.filiere.findFirst({
          where: { nom: { equals: nlu.entities.filiereNom } },
        });
        if (f) {
          const metiers = await db.filiereMetier.findMany({
            where: { filiereId: f.id },
            include: { metier: true },
          });
          reponseSysteme = `📚 **Débouchés de la filière ${f.nom}** :\n\n${f.debouchesText ?? "Information non disponible."}\n\n🔹 Métiers typiques : ${metiers.map((m) => m.metier.nom).join(", ")}`;
          actions = [{ type: "afficher_filiere", texte: reponseSysteme, donnees: { filiereId: f.id, nom: f.nom } }];
          break;
        }
      }
      reponseSysteme = "Pour quel métier ou filière souhaitez-vous connaître les débouchés ? Vous pouvez nommer une filière (ex. : Informatique, Médecine) ou un métier (ex. : avocat, développeur).";
      actions = [
        { type: "texte", texte: reponseSysteme },
        { type: "afficher_liste_filieres", texte: "Voir les filières", donnees: { filieres: (await db.filiere.findMany({ select: { id: true, nom: true } })) } },
      ];
      break;
    }

    case "aide_conseiller": {
      reponseSysteme = [
        "🧑‍💼 **Mise en relation avec un conseiller humain**",
        "",
        "Je comprends que votre demande nécessite un accompagnement humain personnalisé. Vous pouvez être rappelé(e) par un conseiller d'orientation du **CIO (Centre d'Information et d'Orientation)** de Côte d'Ivoire.",
        "",
        "📋 Pour cela, laissez vos coordonnées via le formulaire ci-dessous. Un conseiller vous contactera sous 48h ouvrées.",
        "",
        "📞 Vous pouvez aussi contacter directement :",
        "• Direction de l'Orientation Scolaire et Professionnelle (DOSP) — Ministère de l'Éducation Nationale",
        "• CIO Abidjan Plateau : +225 27 20 21 00 00",
      ].join("\n");
      actions = [
        { type: "redirection_conseiller", texte: reponseSysteme },
      ];
      break;
    }

    default: {
      reponseSysteme = "Je n'ai pas tout à fait compris votre demande. Pouvez-vous reformuler ? Vous pouvez me poser une question sur une filière, un métier, les débouchés, demander une recommandation, ou demander à parler à un conseiller humain.";
      actions = [
        { type: "texte", texte: reponseSysteme },
        { type: "proposer_test", texte: "Passer le test RIASEC" },
        { type: "demarrer_profil", texte: "Créer mon profil" },
      ];
    }
  }

  // Persistance de l'interaction (RG4, RG5)
  const intention = await db.intention.findUnique({ where: { libelle: nlu.intent } });
  const interaction = await db.interaction.create({
    data: {
      sessionId,
      intentionId: intention?.id,
      messageUtilisateur: message,
      reponseSysteme,
      metadata: JSON.stringify({ entities: nlu.entities, confidence: nlu.confidence }),
    },
  });

  return {
    reponseSysteme,
    intentionDetectee: nlu.intent,
    confidence: nlu.confidence,
    actions,
    interactionId: interaction.id,
  };
}

// Justification autonome (réutilisable côté API recommandations)
export { genererJustification };

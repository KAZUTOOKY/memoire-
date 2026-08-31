// Constantes RIASEC partagées (modèle de Holland)
// R = Réaliste, I = Investigateur, A = Artistique, S = Social, E = Entreprenant, C = Conventionnel

export type RiasecDimension = "R" | "I" | "A" | "S" | "E" | "C";

export const RIASEC_DIMENSIONS: Record<
  RiasecDimension,
  { code: RiasecDimension; label: string; description: string; couleur: string; traits: string[] }
> = {
  R: {
    code: "R",
    label: "Réaliste",
    description:
      "Aime le travail manuel, technique, en plein air. Pratique, concret, manipule outils et machines.",
    couleur: "#D97706",
    traits: ["Manuel", "Technique", "Pratique", "Concret"],
  },
  I: {
    code: "I",
    label: "Investigateur",
    description:
      "Aime la recherche, l'analyse, la résolution de problèmes. Scientifique, curieux, logique.",
    couleur: "#0891B2",
    traits: ["Analytique", "Scientifique", "Curieux", "Logique"],
  },
  A: {
    code: "A",
    label: "Artistique",
    description:
      "Aime la créativité, l'expression, le design. Original, imaginatif, indépendant.",
    couleur: "#DB2777",
    traits: ["Créatif", "Original", "Expressif", "Imaginatif"],
  },
  S: {
    code: "S",
    label: "Social",
    description:
      "Aime aider, enseigner, soigner, accompagner. Empathique, coopératif, à l'écoute.",
    couleur: "#16A34A",
    traits: ["Empathique", "Coopératif", "À l'écoute", "Bienveillant"],
  },
  E: {
    code: "E",
    label: "Entreprenant",
    description:
      "Aime diriger, persuader, entreprendre. Leader, ambitieux, convaincant.",
    couleur: "#DC2626",
    traits: ["Leader", "Ambitieux", "Convaincant", "Initiateur"],
  },
  C: {
    code: "C",
    label: "Conventionnel",
    description:
      "Aime l'organisation, la rigueur, les données. Méthodique, précis, structuré.",
    couleur: "#7C3AED",
    traits: ["Méthodique", "Rigoureux", "Organisé", "Précis"],
  },
};

export const RIASEC_ORDER: RiasecDimension[] = ["R", "I", "A", "S", "E", "C"];

export interface QuestionRiasecDef {
  dimension: RiasecDimension;
  ordre: number;
  enonce: string;
}

// 30 questions (5 par dimension) — test d'intérêts RIASEC
export const RIASEC_QUESTIONS: QuestionRiasecDef[] = [
  // R — Réaliste
  { dimension: "R", ordre: 1, enonce: "J'aime réparer des objets ou les démonter pour comprendre comment ils fonctionnent." },
  { dimension: "R", ordre: 2, enonce: "Je préfère travailler en plein air plutôt qu'assis derrière un bureau." },
  { dimension: "R", ordre: 3, enonce: "J'aime utiliser des outils, des machines ou du matériel technique." },
  { dimension: "R", ordre: 4, enonce: "J'aimerais conduire des engins, cultiver la terre ou construire des structures." },
  { dimension: "R", ordre: 5, enonce: "Je me sens à l'aise avec les travaux manuels et physiques." },
  // I — Investigateur
  { dimension: "I", ordre: 6, enonce: "J'aime poser des questions et comprendre pourquoi les choses fonctionnent." },
  { dimension: "I", ordre: 7, enonce: "J'aime résoudre des problèmes complexes et faire des recherches." },
  { dimension: "I", ordre: 8, enonce: "Les matières scientifiques (maths, physique, SVT) me passionnent." },
  { dimension: "I", ordre: 9, enonce: "J'aime analyser des données et tirer des conclusions logiques." },
  { dimension: "I", ordre: 10, enonce: "J'aimerais participer à des expériences ou des investigations scientifiques." },
  // A — Artistique
  { dimension: "A", ordre: 11, enonce: "J'aime dessiner, peindre, écrire ou créer de mes propres mains." },
  { dimension: "A", ordre: 12, enonce: "Je préfère travailler de manière libre et créative plutôt que de suivre des règles strictes." },
  { dimension: "A", ordre: 13, enonce: "J'apprécie la musique, le théâtre, le design ou les arts visuels." },
  { dimension: "A", ordre: 14, enonce: "J'aime imaginer de nouvelles idées et exprimer ma créativité." },
  { dimension: "A", ordre: 15, enonce: "J'aimerais concevoir des œuvres, des designs ou des contenus originaux." },
  // S — Social
  { dimension: "S", ordre: 16, enonce: "J'aime aider les autres et être utile à mon entourage." },
  { dimension: "S", ordre: 17, enonce: "J'apprécie travailler en équipe et écouter les problèmes des gens." },
  { dimension: "S", ordre: 18, enonce: "J'aimerais enseigner, former ou accompagner des personnes." },
  { dimension: "S", ordre: 19, enonce: "Je me sens bien quand je peux soigner, conseiller ou soutenir quelqu'un." },
  { dimension: "S", ordre: 20, enonce: "J'aime organiser des activités collectives et animer des groupes." },
  // E — Entreprenant
  { dimension: "E", ordre: 21, enonce: "J'aime prendre des initiatives et diriger un groupe." },
  { dimension: "E", ordre: 22, enonce: "J'aimerais créer mon entreprise ou mon propre projet." },
  { dimension: "E", ordre: 23, enonce: "J'aime convaincre, négocier et vendre des idées." },
  { dimension: "E", ordre: 24, enonce: "Je me sens à l'aise pour parler en public et influencer les autres." },
  { dimension: "E", ordre: 25, enonce: "J'aimerais occuper un poste de responsable ou de manager." },
  // C — Conventionnel
  { dimension: "C", ordre: 26, enonce: "J'aime organiser, classer et structurer des informations." },
  { dimension: "C", ordre: 27, enonce: "Je préfère suivre des règles claires et des procédures précises." },
  { dimension: "C", ordre: 28, enonce: "J'aime travailler avec des chiffres, des tableaux et des données." },
  { dimension: "C", ordre: 29, enonce: "J'apprécie les tâches qui demandent rigueur, méthode et précision." },
  { dimension: "C", ordre: 30, enonce: "J'aimerais gérer des dossiers, des comptes ou des documents administratifs." },
];

// Échelle d'accord (Likert en 5 points)
export const RIASEC_SCALE = [
  { value: 0, label: "Pas du tout d'accord", court: "PAS" },
  { value: 1, label: "Plutôt en désaccord", court: "DES" },
  { value: 2, label: "Neutre", court: "NEU" },
  { value: 3, label: "Plutôt d'accord", court: "ACC" },
  { value: 4, label: "Tout à fait d'accord", court: "TAF" },
] as const;

export interface RiasecVector {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

export const RIASEC_KEYS: (keyof RiasecVector)[] = ["R", "I", "A", "S", "E", "C"];

export const SCORE_FIELD_BY_DIM: Record<RiasecDimension, string> = {
  R: "scoreRealiste",
  I: "scoreInvestigateur",
  A: "scoreArtistique",
  S: "scoreSocial",
  E: "scoreEntreprenant",
  C: "scoreConventionnel",
};

export const PROFIL_FIELD_BY_DIM: Record<RiasecDimension, string> = {
  R: "profilRealiste",
  I: "profilInvestigateur",
  A: "profilArtistique",
  S: "profilSocial",
  E: "profilEntreprenant",
  C: "profilConventionnel",
};

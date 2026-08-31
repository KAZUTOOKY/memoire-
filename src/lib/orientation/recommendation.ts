// Moteur de recommandation — approche hybride (similitude cosinus + règles explicites)
// Conforme au mémoire : algo RIASEC en 5 étapes.
import { RIASEC_DIMENSIONS, RIASEC_KEYS, type RiasecDimension, type RiasecVector } from "./riasec-constants";

export interface ProfilRiasec {
  R: number; I: number; A: number; S: number; E: number; C: number;
}

export interface CibleRiasec {
  profilRealiste: number;
  profilInvestigateur: number;
  profilArtistique: number;
  profilSocial: number;
  profilEntreprenant: number;
  profilConventionnel: number;
}

// 1. Vecteur de scores RIASEC de l'utilisateur (issu du test)
export function vecteurUtilisateur(profil: ProfilRiasec): RiasecVector {
  return {
    R: profil.R,
    I: profil.I,
    A: profil.A,
    S: profil.S,
    E: profil.E,
    C: profil.C,
  };
}

export function vecteurCible(c: CibleRiasec): RiasecVector {
  return {
    R: c.profilRealiste,
    I: c.profilInvestigateur,
    A: c.profilArtistique,
    S: c.profilSocial,
    E: c.profilEntreprenant,
    C: c.profilConventionnel,
  };
}

// 2. Mesure de similarité : similarité cosinus
export function similariteCosinus(a: RiasecVector, b: RiasecVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const k of RIASEC_KEYS) {
    dot += a[k] * b[k];
    normA += a[k] * a[k];
    normB += b[k] * b[k];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

// Distance euclidienne normalisée (alternative, sert de second indicateur)
export function distanceEuclidienneNormalisee(a: RiasecVector, b: RiasecVector): number {
  let sum = 0;
  for (const k of RIASEC_KEYS) {
    const diff = a[k] - b[k];
    sum += diff * diff;
  }
  // max possible distance : 6 dimensions * (10)^2 = 600 => sqrt ≈ 24.49
  const maxDist = Math.sqrt(6 * 100);
  return 1 - Math.sqrt(sum) / maxDist;
}

// 5. Profil dominant = dimension RIASEC au score le plus élevé
export function profilDominant(profil: ProfilRiasec): RiasecDimension {
  let best: RiasecDimension = "R";
  let bestVal = -Infinity;
  for (const k of RIASEC_KEYS) {
    if (profil[k] > bestVal) {
      bestVal = profil[k];
      best = k;
    }
  }
  return best;
}

// Top 2 dimensions (pour la justification)
export function topDimensions(profil: ProfilRiasec, n = 2): RiasecDimension[] {
  return [...RIASEC_KEYS]
    .sort((a, b) => profil[b] - profil[a])
    .slice(0, n);
}

// Génère une justification textuelle automatique (RG4 du mémoire)
export function genererJustification(profil: ProfilRiasec, cible: CibleRiasec, nomCible: string): string {
  const dom = profilDominant(profil);
  const top = topDimensions(profil, 2);
  const labelDom = RIASEC_DIMENSIONS[dom].label;
  const labelTop2 = RIASEC_DIMENSIONS[top[1]].label;

  const cibleVec = vecteurCible(cible);
  // Dimensions où l'utilisateur ET la cible sont tous deux élevés
  const forteCoincidence = RIASEC_KEYS.filter(
    (k) => profil[k] >= 6 && cibleVec[k] >= 7
  );

  let just = `${nomCible} correspond fortement à votre profil ${labelDom}`;
  if (top[1] !== top[0]) {
    just += ` et ${labelTop2}`;
  }
  if (forteCoincidence.length > 0) {
    const labels = forteCoincidence.slice(0, 2).map((k) => RIASEC_DIMENSIONS[k].label);
    just += `. Vos scores élevés en ${labels.join(" et ")} rejoignent les attentes de cette voie.`;
  } else {
    just += `. Ce choix valorise vos points forts naturels.`;
  }
  return just;
}

export interface RecommandationCalculee<T> {
  cible: T;
  scoreCompatibilite: number; // 0..1
  justification: string;
}

// 4. Retourner 3 à 5 recommandations maximum, triées par score décroissant
export function recommander<T extends { id: string; nom: string } & CibleRiasec>(
  profil: ProfilRiasec,
  cibles: T[],
  options?: { limite?: number; filtreNiveau?: (c: T) => boolean }
): RecommandationCalculee<T>[] {
  const limite = options?.limite ?? 5;
  const userVec = vecteurUtilisateur(profil);

  const scored = cibles
    .filter((c) => (options?.filtreNiveau ? options.filtreNiveau(c) : true))
    .map((c) => {
      const cibleVec = vecteurCible(c);
      const cos = similariteCosinus(userVec, cibleVec);
      const euc = distanceEuclidienneNormalisee(userVec, cibleVec);
      // Score hybride : pondération cosinus (0.7) + euclidienne (0.3)
      const score = cos * 0.7 + euc * 0.3;
      return {
        cible: c,
        scoreCompatibilite: Math.round(score * 1000) / 1000,
        justification: genererJustification(profil, c, c.nom),
      };
    })
    .sort((a, b) => b.scoreCompatibilite - a.scoreCompatibilite)
    .slice(0, Math.max(3, Math.min(limite, 5)));

  return scored;
}

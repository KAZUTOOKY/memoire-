"use client";
import { Check, ClipboardList, Compass, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  etape: 1 | 2 | 3; // 1=profil, 2=test, 3=recommandations
  className?: string;
}

const ETAPES = [
  {
    num: 1,
    label: "Profil",
    description: "Niveau & filière",
    icon: ClipboardList,
  },
  {
    num: 2,
    label: "Test RIASEC",
    description: "30 questions",
    icon: Compass,
  },
  {
    num: 3,
    label: "Recommandations",
    description: "Métiers ciblés",
    icon: Sparkles,
  },
];

export function OnboardingStepper({ etape, className }: Props) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-1">
        {ETAPES.map((e, i) => {
          const isDone = etape > e.num;
          const isCurrent = etape === e.num;
          const Icon = e.icon;
          return (
            <div key={e.num} className="flex-1 flex items-center">
              <div className="flex-1 flex flex-col items-center gap-0.5 relative">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 shrink-0",
                    isDone && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "bg-background border-primary text-primary ring-4 ring-primary/15 scale-110",
                    !isDone && !isCurrent && "bg-background border-border text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="text-center leading-tight mt-0.5">
                  <div
                    className={cn(
                      "text-[10px] font-semibold transition-colors",
                      isDone || isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {e.label}
                  </div>
                  <div className="text-[9px] text-muted-foreground hidden sm:block">
                    {e.description}
                  </div>
                </div>
                {isCurrent && (
                  <span className="absolute -bottom-1 h-0.5 w-8 rounded-full bg-primary" />
                )}
              </div>
              {i < ETAPES.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-1 mb-3 transition-all duration-500",
                    isDone ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Calcule l'étape d'onboarding en fonction de l'état de l'utilisateur.
 */
export function calculerEtape(utilisateur: {
  niveauEtudes: string | null;
  filiereActuelleId: string | null;
  localisation: string | null;
  scoreRealiste: number;
  scoreInvestigateur: number;
  scoreArtistique: number;
  scoreSocial: number;
  scoreEntreprenant: number;
  scoreConventionnel: number;
} | null): 1 | 2 | 3 {
  if (!utilisateur) return 1;
  const profilBase = !!(utilisateur.niveauEtudes || utilisateur.filiereActuelleId || utilisateur.localisation);
  if (!profilBase) return 1;
  const profilComplet =
    utilisateur.scoreRealiste + utilisateur.scoreInvestigateur + utilisateur.scoreArtistique +
    utilisateur.scoreSocial + utilisateur.scoreEntreprenant + utilisateur.scoreConventionnel > 0;
  if (!profilComplet) return 2;
  return 3;
}

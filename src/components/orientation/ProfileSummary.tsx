"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  MapPin,
  BookOpen,
  Compass,
  UserCog,
  Sparkles,
} from "lucide-react";
import {
  RIASEC_DIMENSIONS,
  RIASEC_ORDER,
  type RiasecDimension,
} from "@/lib/orientation/riasec-constants";
import type { Utilisateur } from "@/lib/orientation/types";

interface Props {
  utilisateur: Utilisateur | null;
  onEditProfil: () => void;
  onPasserTest: () => void;
  onRecommandations: () => void;
  onConseiller: () => void;
}

export function ProfileSummary({ utilisateur, onEditProfil, onPasserTest, onRecommandations, onConseiller }: Props) {
  if (!utilisateur) return null;

  const profilComplet =
    utilisateur.scoreRealiste + utilisateur.scoreInvestigateur + utilisateur.scoreArtistique +
    utilisateur.scoreSocial + utilisateur.scoreEntreprenant + utilisateur.scoreConventionnel > 0;

  const scores: Record<RiasecDimension, number> = {
    R: utilisateur.scoreRealiste,
    I: utilisateur.scoreInvestigateur,
    A: utilisateur.scoreArtistique,
    S: utilisateur.scoreSocial,
    E: utilisateur.scoreEntreprenant,
    C: utilisateur.scoreConventionnel,
  };

  const dominant = utilisateur.profilDominant as RiasecDimension | null;
  const maxScore = 20;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCog className="h-4 w-4 text-primary" />
          Mon profil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs">Niveau</span>
            <span className="ml-auto font-medium text-right">
              {utilisateur.niveauEtudes ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs">Filière</span>
            <span className="ml-auto font-medium text-right text-[13px]">
              {utilisateur.filiereActuelle?.nom ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs">Ville</span>
            <span className="ml-auto font-medium">
              {utilisateur.localisation ?? "—"}
            </span>
          </div>
        </div>

        {profilComplet ? (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium flex items-center gap-1">
                <Compass className="h-3.5 w-3.5" /> Profil RIASEC
              </span>
              {dominant && (
                <Badge
                  className="text-[10px]"
                  style={{
                    background: RIASEC_DIMENSIONS[dominant].couleur,
                    color: "#fff",
                  }}
                >
                  {RIASEC_DIMENSIONS[dominant].label}
                </Badge>
              )}
            </div>
            <div className="space-y-1.5">
              {RIASEC_ORDER.map((d) => (
                <div key={d} className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono font-bold w-3"
                    style={{ color: RIASEC_DIMENSIONS[d].couleur }}
                  >
                    {d}
                  </span>
                  <div className="riasec-bar flex-1">
                    <span
                      style={{
                        width: `${(scores[d] / maxScore) * 100}%`,
                        background: RIASEC_DIMENSIONS[d].couleur,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-7 text-right tabular-nums">
                    {scores[d]}/20
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Vous n'avez pas encore passé le test RIASEC.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={onEditProfil}>
            Modifier
          </Button>
          <Button
            variant={profilComplet ? "outline" : "default"}
            size="sm"
            className="text-xs h-8"
            onClick={onPasserTest}
          >
            {profilComplet ? "Repasser" : "Test RIASEC"}
          </Button>
          <Button
            variant="default"
            size="sm"
            className="text-xs h-8 col-span-2"
            onClick={onRecommandations}
            disabled={!profilComplet}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Mes recommandations
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 col-span-2 text-accent-foreground"
            onClick={onConseiller}
          >
            Parler à un conseiller humain
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

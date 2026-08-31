"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Briefcase, TrendingUp } from "lucide-react";
import type { RiasecRecoAffichage } from "@/lib/orientation/types";

interface Props {
  recommandations: RiasecRecoAffichage[];
  dominantLabel?: string;
  onVoirMetier?: (metierId: string) => void;
}

function scoreColor(score: number): string {
  if (score >= 0.8) return "#16A34A";
  if (score >= 0.65) return "#65A30D";
  if (score >= 0.5) return "#D97706";
  return "#DC2626";
}

export function RecommendationsCard({ recommandations, dominantLabel, onVoirMetier }: Props) {
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Recommandations personnalisées
          </span>
          {dominantLabel && (
            <Badge variant="secondary" className="text-[11px]">Profil {dominantLabel}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {recommandations.map((r, i) => (
          <div
            key={r.metierId}
            className="reco-card rounded-lg border bg-card p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="font-semibold text-sm truncate">{r.nom}</p>
                  </div>
                  {r.secteur && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{r.secteur}</p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className="text-base font-bold leading-none"
                  style={{ color: scoreColor(r.score) }}
                >
                  {Math.round(r.score * 100)}%
                </div>
                <div className="text-[10px] text-muted-foreground">compatibilité</div>
              </div>
            </div>

            <Progress
              value={r.score * 100}
              className="h-1.5 mt-2"
              style={{ ["--progress-foreground" as string]: scoreColor(r.score) }}
            />

            <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed italic">
              {r.justification}
            </p>

            {r.salaire && (
              <p className="text-[11px] mt-1.5">
                <span className="text-muted-foreground">Salaire moyen (CI) : </span>
                <span className="font-medium">{r.salaire}</span>
              </p>
            )}

            {onVoirMetier && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 mt-2 px-2 text-[11px] w-full"
                onClick={() => onVoirMetier(r.metierId)}
              >
                En savoir plus sur ce métier →
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { School, GraduationCap, MapPin, ChevronRight } from "lucide-react";

export interface FiliereRecoAffichage {
  filiereId: string;
  nom: string;
  score: number;
  justification: string;
  duree?: string | null;
  etablissements?: string[] | null;
  debouches?: string | null;
}

interface Props {
  recommandations: FiliereRecoAffichage[];
  onVoirFiliere?: (filiereId: string) => void;
}

function scoreColor(score: number): string {
  if (score >= 0.8) return "#16A34A";
  if (score >= 0.65) return "#65A30D";
  if (score >= 0.5) return "#D97706";
  return "#DC2626";
}

export function FiliereRecommendationsCard({ recommandations, onVoirFiliere }: Props) {
  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <School className="h-4 w-4 text-accent-foreground" />
          Filières recommandées
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {recommandations.map((r, i) => (
          <div key={r.filiereId} className="reco-card rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{r.nom}</p>
                  {r.duree && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {r.duree}
                    </p>
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
                <div className="text-[10px] text-muted-foreground">fit</div>
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

            {r.etablissements && r.etablissements.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {r.etablissements.slice(0, 3).map((e, idx) => (
                  <Badge key={idx} variant="outline" className="text-[9px] gap-0.5">
                    <MapPin className="h-2 w-2" />
                    {e}
                  </Badge>
                ))}
              </div>
            )}

            {onVoirFiliere && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 mt-2 px-2 text-[11px] w-full"
                onClick={() => onVoirFiliere(r.filiereId)}
              >
                En savoir plus sur cette filière
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

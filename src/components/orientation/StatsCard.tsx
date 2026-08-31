"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  History,
  MessageSquare,
  Sparkles,
  Calendar,
  TrendingUp,
  Award,
} from "lucide-react";

interface Stats {
  nbSessions: number;
  sessionsActives: number;
  totalInteractions: number;
  totalRecommandations: number;
  profilDominantLabel: string | null;
  profilDominantCouleur: string | null;
  scoreMax: number;
  scoreMoyen: number;
  joursInscription: number;
}

interface Props {
  utilisateurId?: string;
  onVoirHistorique?: () => void;
}

export function StatsCard({ utilisateurId, onVoirHistorique }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!utilisateurId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/orientation/stats?utilisateurId=${utilisateurId}`);
        if (res.ok && !cancelled) {
          setStats(await res.json());
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [utilisateurId]);

  if (!stats) return null;

  return (
    <Card className="border-primary/20 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-primary" /> Statistiques
          </span>
          {onVoirHistorique && stats.nbSessions > 1 && (
            <button
              onClick={onVoirHistorique}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              <History className="h-2.5 w-2.5" /> Historique
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <StatBox
            icon={<History className="h-3 w-3" />}
            value={stats.nbSessions}
            label="Sessions"
            color="text-primary"
          />
          <StatBox
            icon={<MessageSquare className="h-3 w-3" />}
            value={stats.totalInteractions}
            label="Messages"
            color="text-accent-foreground"
          />
          <StatBox
            icon={<Sparkles className="h-3 w-3" />}
            value={stats.totalRecommandations}
            label="Recos"
            color="text-primary"
          />
          <StatBox
            icon={<Calendar className="h-3 w-3" />}
            value={stats.joursInscription}
            label="Jours"
            color="text-accent-foreground"
          />
        </div>

        {stats.profilDominantLabel && (
          <div className="flex items-center gap-2 pt-1 border-t">
            <Award className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground">Profil</span>
            <Badge
              className="text-[10px] ml-auto"
              style={{
                background: stats.profilDominantCouleur ?? "var(--primary)",
                color: "#fff",
              }}
            >
              {stats.profilDominantLabel}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-muted/40 rounded-lg p-2 flex items-center gap-2">
      <span className={color}>{icon}</span>
      <div className="min-w-0">
        <div className="text-sm font-bold tabular-nums leading-none">{value}</div>
        <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{label}</div>
      </div>
    </div>
  );
}

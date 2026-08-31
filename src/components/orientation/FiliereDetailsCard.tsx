"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Brain,
  Activity,
  Lightbulb,
  CheckCircle2,
  XCircle,
  School,
  GraduationCap,
  MapPin,
  Clock,
} from "lucide-react";

export interface FiliereDetailsData {
  nom: string;
  description?: string | null;
  duree?: string | null;
  conditionsAcces?: string | null;
  etablissements?: string[];
  debouches?: string | null;
  avantagesFinanciers: string[];
  inconvenientsFinanciers: string[];
  avantagesMentaux: string[];
  inconvenientsMentaux: string[];
  avantagesPhysiques: string[];
  inconvenientsPhysiques: string[];
  conseils: string[];
  score?: number;
}

interface Props {
  filiere: FiliereDetailsData;
  onVoirFiliere?: (id: string) => void;
}

export function FiliereDetailsCard({ filiere }: Props) {
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <School className="h-4 w-4 text-primary" />
            {filiere.nom}
          </span>
          {filiere.score !== undefined && (
            <Badge className="text-[11px]">{Math.round(filiere.score * 100)}% fit</Badge>
          )}
        </CardTitle>
        {filiere.description && (
          <p className="text-[12px] text-muted-foreground italic mt-1">{filiere.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Infos de base */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="bg-muted/40 rounded-md p-2">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Clock className="h-3 w-3" /> Durée
            </div>
            <div className="font-medium">{filiere.duree ?? "—"}</div>
          </div>
          <div className="bg-muted/40 rounded-md p-2">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <GraduationCap className="h-3 w-3" /> Accès
            </div>
            <div className="font-medium text-[10px] line-clamp-2">{filiere.conditionsAcces ?? "—"}</div>
          </div>
          <div className="bg-muted/40 rounded-md p-2">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <MapPin className="h-3 w-3" /> Établissements
            </div>
            <div className="font-medium text-[10px] line-clamp-2">
              {filiere.etablissements?.slice(0, 2).join(", ") ?? "—"}
            </div>
          </div>
        </div>

        {/* Avantages/Inconvénients par plan */}
        <div className="space-y-2">
          <ProsConsBlock
            icon={<Wallet className="h-3.5 w-3.5" />}
            title="Plan financier"
            color="text-emerald-600"
            bg="bg-emerald-50 dark:bg-emerald-950/30"
            avantages={filiere.avantagesFinanciers}
            inconvenients={filiere.inconvenientsFinanciers}
          />
          <ProsConsBlock
            icon={<Brain className="h-3.5 w-3.5" />}
            title="Plan mental & psychologique"
            color="text-violet-600"
            bg="bg-violet-50 dark:bg-violet-950/30"
            avantages={filiere.avantagesMentaux}
            inconvenients={filiere.inconvenientsMentaux}
          />
          <ProsConsBlock
            icon={<Activity className="h-3.5 w-3.5" />}
            title="Plan physique & santé"
            color="text-orange-600"
            bg="bg-orange-50 dark:bg-orange-950/30"
            avantages={filiere.avantagesPhysiques}
            inconvenients={filiere.inconvenientsPhysiques}
          />
        </div>

        {/* Conseils */}
        {filiere.conseils.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5">
            <p className="text-[11px] font-semibold flex items-center gap-1 mb-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              Conseils en appui
            </p>
            <ul className="space-y-1">
              {filiere.conseils.map((c, i) => (
                <li key={i} className="text-[11px] flex items-start gap-1.5">
                  <span className="text-primary mt-0.5 shrink-0">→</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {filiere.debouches && (
          <div className="text-[11px] pt-1 border-t">
            <span className="text-muted-foreground">Débouchés : </span>
            <span className="font-medium">{filiere.debouches}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProsConsBlock({
  icon,
  title,
  color,
  bg,
  avantages,
  inconvenients,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  bg: string;
  avantages: string[];
  inconvenients: string[];
}) {
  if (avantages.length === 0 && inconvenients.length === 0) return null;
  return (
    <div className={`rounded-lg p-2.5 ${bg}`}>
      <p className={`text-[11px] font-semibold flex items-center gap-1 mb-1.5 ${color}`}>
        {icon}
        {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 mb-0.5 flex items-center gap-0.5">
            <CheckCircle2 className="h-2.5 w-2.5" /> Avantages
          </p>
          <ul className="space-y-0.5">
            {avantages.map((a, i) => (
              <li key={i} className="text-[10px] flex items-start gap-1">
                <span className="text-emerald-600 mt-0.5 shrink-0">+</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-medium text-red-700 dark:text-red-400 mb-0.5 flex items-center gap-0.5">
            <XCircle className="h-2.5 w-2.5" /> Inconvénients
          </p>
          <ul className="space-y-0.5">
            {inconvenients.map((inc, i) => (
              <li key={i} className="text-[10px] flex items-start gap-1">
                <span className="text-red-600 mt-0.5 shrink-0">−</span>
                <span>{inc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

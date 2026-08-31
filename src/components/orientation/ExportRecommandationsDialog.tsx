"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, FileDown } from "lucide-react";
import { RIASEC_DIMENSIONS, type RiasecDimension } from "@/lib/orientation/riasec-constants";
import type { Utilisateur, RiasecRecoAffichage } from "@/lib/orientation/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  utilisateur: Utilisateur | null;
  recommandations: RiasecRecoAffichage[];
  dominantLabel?: string;
}

export function ExportRecommandationsDialog({ open, onOpenChange, utilisateur, recommandations, dominantLabel }: Props) {
  if (!utilisateur) return null;

  function handlePrint() {
    window.print();
  }

  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Export de mes recommandations
          </DialogTitle>
          <DialogDescription>
            Imprimez ou enregistrez en PDF votre synthèse d'orientation.
          </DialogDescription>
        </DialogHeader>

        {/* Document imprimable */}
        <div className="border rounded-lg p-5 print:border-0 print:p-0">
          {/* En-tête */}
          <div className="flex items-center justify-between border-b pb-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                  O
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">OriensCI</h2>
                  <p className="text-[10px] text-muted-foreground leading-tight">Synthèse d'orientation</p>
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] text-muted-foreground">
              <p>{dateStr}</p>
              <p>N° session : {utilisateur.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>

          {/* Profil utilisateur */}
          <section className="mb-4">
            <h3 className="text-sm font-semibold mb-1.5">Profil de l'étudiant</h3>
            <div className="grid grid-cols-3 gap-2 text-[12px]">
              <div className="bg-muted/40 rounded p-2">
                <p className="text-[10px] text-muted-foreground">Niveau</p>
                <p className="font-medium">{utilisateur.niveauEtudes ?? "—"}</p>
              </div>
              <div className="bg-muted/40 rounded p-2">
                <p className="text-[10px] text-muted-foreground">Filière actuelle</p>
                <p className="font-medium text-[11px]">{utilisateur.filiereActuelle?.nom ?? "—"}</p>
              </div>
              <div className="bg-muted/40 rounded p-2">
                <p className="text-[10px] text-muted-foreground">Localisation</p>
                <p className="font-medium">{utilisateur.localisation ?? "—"}</p>
              </div>
            </div>
          </section>

          {/* Profil RIASEC */}
          {dominantLabel && (
            <section className="mb-4">
              <h3 className="text-sm font-semibold mb-1.5">Profil RIASEC dominant</h3>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                <Badge
                  className="text-xs"
                  style={{
                    background: RIASEC_DIMENSIONS[utilisateur.profilDominant as RiasecDimension]?.couleur ?? "var(--primary)",
                    color: "#fff",
                  }}
                >
                  {dominantLabel}
                </Badge>
                <p className="text-[11px] text-muted-foreground flex-1">
                  {RIASEC_DIMENSIONS[utilisateur.profilDominant as RiasecDimension]?.description ?? ""}
                </p>
              </div>
              <div className="grid grid-cols-6 gap-1 mt-2">
                {(["R","I","A","S","E","C"] as RiasecDimension[]).map((d) => {
                  const v = (utilisateur as unknown as Record<string, number>)[
                    d === "R" ? "scoreRealiste" :
                    d === "I" ? "scoreInvestigateur" :
                    d === "A" ? "scoreArtistique" :
                    d === "S" ? "scoreSocial" :
                    d === "E" ? "scoreEntreprenant" : "scoreConventionnel"
                  ];
                  return (
                    <div key={d} className="text-center rounded p-1" style={{ background: `${RIASEC_DIMENSIONS[d].couleur}22` }}>
                      <div className="text-[9px] font-bold" style={{ color: RIASEC_DIMENSIONS[d].couleur }}>{d}</div>
                      <div className="text-sm font-bold tabular-nums">{v}/20</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recommandations */}
          <section>
            <h3 className="text-sm font-semibold mb-1.5">Recommandations personnalisées</h3>
            <p className="text-[11px] text-muted-foreground mb-2">
              {recommandations.length} métiers recommandés, classés par score de compatibilité décroissant.
            </p>
            <ol className="space-y-2">
              {recommandations.map((r, i) => (
                <li key={r.metierId} className="border rounded-lg p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-[13px] truncate">{r.nom}</span>
                    </div>
                    <Badge className="text-[10px]">{Math.round(r.score * 100)}%</Badge>
                  </div>
                  {r.secteur && <p className="text-[10px] text-muted-foreground mb-1">Secteur : {r.secteur}</p>}
                  <p className="text-[11px] italic">{r.justification}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-4 pt-3 border-t text-[10px] text-muted-foreground text-center">
            OriensCI — Prototype de recherche · Modèle RIASEC de Holland · Côte d'Ivoire
            <br />
            Ce document est généré automatiquement et ne remplace pas un conseil officiel d'orientation.
          </div>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Imprimer / Enregistrer en PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

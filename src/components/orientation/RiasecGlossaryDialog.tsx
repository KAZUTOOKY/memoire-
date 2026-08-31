"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen } from "lucide-react";
import {
  RIASEC_DIMENSIONS,
  RIASEC_ORDER,
  type RiasecDimension,
} from "@/lib/orientation/riasec-constants";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const EXEMPLES_METIERS: Record<RiasecDimension, string[]> = {
  R: ["Ingénieur civil", "Mécanicien", "Agronome", "Électricien", "Technicien BTP"],
  I: ["Chercheur", "Médecin", "Data analyst", "Biologiste", "Ingénieur R&D"],
  A: ["Architecte", "Designer", "Journaliste", "Artiste", "Réalisateur"],
  S: ["Enseignant", "Infirmier", "Psychologue", "Travailleur social", "Conseiller"],
  E: ["Entrepreneur", "Commercial", "Manager", "Avocat", "Politique"],
  C: ["Comptable", "Auditeur", "Gestionnaire", "Administrateur", "Contrôleur qualité"],
};

const MATIERES_FORTES: Record<RiasecDimension, string[]> = {
  R: ["Mathématiques", "Physique", "SVT (pratique)", "Technologie"],
  I: ["Mathématiques", "Physique-Chimie", "SVT", "Anglais scientifique"],
  A: ["Français", "Arts plastiques", "Musique", "Philosophie"],
  S: ["Français", "Philo", "SES", "Langues", "Histoire-Géo"],
  E: ["SES", "Histoire-Géo", "Langues", "Maths Économiques"],
  C: ["Mathématiques", "SES", "Comptabilité", "Informatique bureautique"],
};

export function RiasecGlossaryDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Glossaire RIASEC — Modèle de Holland
          </DialogTitle>
          <DialogDescription>
            Le modèle RIASEC de John Holland classe les intérêts professionnels en 6 dimensions.
            Chaque personne combine ces 6 pôles dans des proportions différentes.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[70vh] pr-2">
          <div className="space-y-3">
            {RIASEC_ORDER.map((d) => {
              const dim = RIASEC_DIMENSIONS[d];
              return (
                <Card
                  key={d}
                  className="overflow-hidden"
                  style={{ borderLeft: `4px solid ${dim.couleur}` }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white font-bold text-sm"
                        style={{ background: dim.couleur }}
                      >
                        {d}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{dim.label}</h3>
                          <Badge
                            variant="outline"
                            className="text-[9px]"
                            style={{ color: dim.couleur, borderColor: dim.couleur }}
                          >
                            {dim.traits.join(" · ")}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                          {dim.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Métiers types
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {EXEMPLES_METIERS[d].map((m) => (
                                <Badge
                                  key={m}
                                  variant="secondary"
                                  className="text-[10px]"
                                  style={{ background: `${dim.couleur}22`, color: dim.couleur }}
                                >
                                  {m}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Matières fortes
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {MATIERES_FORTES[d].map((m) => (
                                <Badge key={m} variant="outline" className="text-[10px]">
                                  {m}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                💡 <strong className="text-foreground">Astuce</strong> : Votre profil RIASEC est
                rarement pur. La plupart des gens combinent 2 à 3 dimensions dominantes. Plus
                votre score est élevé sur une dimension, plus les métiers correspondants vous
                conviendront probablement.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

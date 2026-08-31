"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Filiere, Utilisateur } from "@/lib/orientation/types";

const NIVEAUX = [
  { value: "Terminale", label: "Terminale" },
  { value: "Bac obtenu", label: "Baccalauréat obtenu" },
  { value: "Licence 1", label: "Licence 1" },
  { value: "Licence 2", label: "Licence 2" },
  { value: "Licence 3", label: "Licence 3" },
  { value: "Master 1", label: "Master 1" },
  { value: "Autre", label: "Autre / En réorientation" },
];

const VILLES_CI = [
  "Abidjan", "Yamoussoukro", "Bouaké", "Daloa", "San-Pédro", "Korhogo",
  "Man", "Divo", "Gagnoa", "Abengourou", "Dabou", "Grand-Bassam",
  "Bondoukou", "Séguéla", "Odienné", "Autre ville",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  utilisateur: Utilisateur | null;
  filieres: Filiere[];
  onSaved: (u: Utilisateur) => void;
}

export function ProfileSetupDialog({ open, onOpenChange, utilisateur, filieres, onSaved }: Props) {
  const [niveau, setNiveau] = useState<string>("");
  const [filiereId, setFiliereId] = useState<string>("__aucune__");
  const [localisation, setLocalisation] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (utilisateur) {
      setNiveau(utilisateur.niveauEtudes ?? "");
      setFiliereId(utilisateur.filiereActuelleId ?? "__aucune__");
      setLocalisation(utilisateur.localisation ?? "");
    } else {
      setNiveau("");
      setFiliereId("__aucune__");
      setLocalisation("");
    }
  }, [utilisateur, open]);

  async function handleSave() {
    if (!utilisateur) return;
    setSaving(true);
    try {
      const res = await fetch("/api/orientation/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: utilisateur.id,
          niveauEtudes: niveau || null,
          filiereActuelleId: filiereId === "__aucune__" ? null : filiereId,
          localisation: localisation || null,
        }),
      });
      if (!res.ok) throw new Error("Erreur");
      const updated = (await res.json()) as Utilisateur;
      onSaved(updated);
      toast.success("Profil enregistré ! Vous pouvez maintenant passer le test RIASEC.");
      onOpenChange(false);
    } catch {
      toast.error("Impossible d'enregistrer le profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Mon profil d'orientation</DialogTitle>
          <DialogDescription>
            Renseignez votre situation actuelle. Ces informations nous aideront à mieux cibler nos recommandations.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="niveau">Niveau d'études actuel</Label>
            <Select value={niveau} onValueChange={setNiveau}>
              <SelectTrigger id="niveau"><SelectValue placeholder="Sélectionnez votre niveau" /></SelectTrigger>
              <SelectContent>
                {NIVEAUX.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filiere">Filière actuelle (si applicable)</Label>
            <Select value={filiereId} onValueChange={setFiliereId}>
              <SelectTrigger id="filiere"><SelectValue placeholder="Aucune / non définie" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="__aucune__">Aucune / non définie</SelectItem>
                {filieres.map((f) => <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ville">Localisation (ville)</Label>
            <Select value={localisation} onValueChange={setLocalisation}>
              <SelectTrigger id="ville"><SelectValue placeholder="Votre ville en Côte d'Ivoire" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {VILLES_CI.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving || !niveau}>
            {saving ? "Enregistrement…" : "Enregistrer mon profil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

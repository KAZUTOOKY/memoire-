"use client";
import { useState } from "react";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  messageContent: string;
  intention?: string;
  utilisateurId?: string;
  sessionId?: string;
  interactionId?: string;
}

const INTENTIONS_OPTIONS = [
  { value: "salutation", label: "Salutation" },
  { value: "recherche_filiere", label: "Recherche de filière" },
  { value: "recherche_metier", label: "Recherche de métier" },
  { value: "demande_debouches", label: "Débouchés" },
  { value: "demande_recommandation", label: "Recommandation" },
  { value: "demande_test_riasec", label: "Test RIASEC" },
  { value: "consultation_profil", label: "Profil" },
  { value: "aide_conseiller", label: "Conseiller humain" },
  { value: "information_generale", label: "Information générale" },
];

export function FeedbackButtons({ messageContent, intention, utilisateurId, sessionId, interactionId }: Props) {
  const [given, setGiven] = useState<1 | -1 | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [correction, setCorrection] = useState("");
  const [intentionCorrecte, setIntentionCorrecte] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitFeedback(note: 1 | -1) {
    setGiven(note);
    if (note === 1) {
      // Feedback positif : enregistrer directement
      try {
        await fetch("/api/orientation/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            utilisateurId, sessionId, interactionId,
            messageUtilisateur: "", // sera rempli par le contexte si disponible
            reponseBot: messageContent,
            intentionDetectee: intention,
            note,
          }),
        });
        toast.success("Merci pour votre retour positif ! 🙌");
      } catch {
        /* ignore */
      }
    } else {
      // Feedback négatif : ouvrir le dialog de correction
      setShowDialog(true);
    }
  }

  async function submitCorrection() {
    setSaving(true);
    try {
      await fetch("/api/orientation/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utilisateurId, sessionId, interactionId,
          messageUtilisateur: "",
          reponseBot: messageContent,
          intentionDetectee: intention,
          note: -1,
          correction,
          intentionCorrecte: intentionCorrecte || undefined,
        }),
      });
      toast.success("Merci ! J'ai appris de cette erreur pour mieux vous répondre. 🧠");
      setShowDialog(false);
      setCorrection("");
      setIntentionCorrecte("");
    } catch {
      toast.error("Impossible d'enregistrer le feedback.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 mt-0.5">
        <button
          onClick={() => submitFeedback(1)}
          className={`p-1 rounded transition-colors ${
            given === 1
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
              : "text-muted-foreground hover:text-emerald-600 hover:bg-muted/50"
          }`}
          title="Bonne réponse"
          disabled={given !== null}
        >
          <ThumbsUp className="h-3 w-3" />
        </button>
        <button
          onClick={() => submitFeedback(-1)}
          className={`p-1 rounded transition-colors ${
            given === -1
              ? "bg-red-100 text-red-600 dark:bg-red-900/40"
              : "text-muted-foreground hover:text-red-600 hover:bg-muted/50"
          }`}
          title="Mauvaise réponse"
          disabled={given !== null}
        >
          <ThumbsDown className="h-3 w-3" />
        </button>
        {given && (
          <span className="text-[9px] text-muted-foreground ml-0.5">
            {given === 1 ? "👍 noté" : "👎 corrigé"}
          </span>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ThumbsDown className="h-4 w-4 text-red-500" />
              Aidez-moi à m'améliorer
            </DialogTitle>
            <DialogDescription>
              Votre correction me permet d'apprendre et de mieux répondre la prochaine fois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="intention-corr" className="text-xs">
                Quelle intention auriez-vous attendue ?
              </Label>
              <Select value={intentionCorrecte} onValueChange={setIntentionCorrecte}>
                <SelectTrigger id="intention-corr">
                  <SelectValue placeholder="Sélectionnez (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {INTENTIONS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="correction" className="text-xs">
                Qu'est-ce qui n'allait pas ? (optionnel)
              </Label>
              <Textarea
                id="correction"
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
                placeholder="Ex : la réponse ne correspondait pas à ma question..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button size="sm" onClick={submitCorrection} disabled={saving}>
              {saving ? "Envoi…" : "Envoyer la correction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

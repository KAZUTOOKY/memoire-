"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Sparkles,
  ClipboardList,
  Compass,
  HeartHandshake,
  List,
  School,
  Briefcase,
  BookOpen,
  ChevronRight,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { MessageMarkdown } from "./MessageMarkdown";
import { ProfileSetupDialog } from "./ProfileSetupDialog";
import { RiasecTestDialog } from "./RiasecTestDialog";
import { CounselorDialog } from "./CounselorDialog";
import { RecommendationsCard } from "./RecommendationsCard";
import { ProfileSummary } from "./ProfileSummary";
import {
  RIASEC_DIMENSIONS,
  RIASEC_ORDER,
  type RiasecDimension,
} from "@/lib/orientation/riasec-constants";
import type {
  Utilisateur,
  Session,
  ChatMessage,
  DialogueAction,
  Filiere,
  Metier,
  RiasecRecoAffichage,
} from "@/lib/orientation/types";

const STORAGE_KEY = "oriensci_ctx_v1";

interface StoredCtx { utilisateurId: string; sessionId: string; }

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const NLU_INTENT_LABELS: Record<string, string> = {
  salutation: "Salutation",
  recherche_filiere: "Recherche de filière",
  recherche_metier: "Recherche de métier",
  demande_debouches: "Débouchés",
  demande_recommandation: "Recommandation",
  demande_test_riasec: "Test RIASEC",
  consultation_profil: "Mon profil",
  aide_conseiller: "Conseiller humain",
  remerciement: "Remerciement",
  demarrage_profil: "Profil",
  information_generale: "Information",
};

export function ChatInterface() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [metiers, setMetiers] = useState<Metier[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [showCounselor, setShowCounselor] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [dark, setDark] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialisation au montage
  useEffect(() => {
    setMounted(true);
    (async () => {
      // Charger filières & métiers pour les selects + listes
      try {
        const [fr, mr] = await Promise.all([
          fetch("/api/orientation/filieres"),
          fetch("/api/orientation/metiers"),
        ]);
        if (fr.ok) setFilieres(await fr.json());
        if (mr.ok) setMetiers(await mr.json());
      } catch {
        /* ignore */
      }

      // Restaurer contexte
      const stored = typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;
      if (stored) {
        try {
          const ctx = JSON.parse(stored) as StoredCtx;
          const res = await fetch(`/api/orientation/init?utilisateurId=${ctx.utilisateurId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.utilisateur && data.session) {
              setUtilisateur(data.utilisateur);
              setSession(data.session);
              // Charger l'historique de la session
              await chargerHistorique(data.session.id);
              return;
            }
          }
        } catch {
          /* fallback ci-dessous */
        }
      }
      // Sinon, init fresh
      await initFresh();
    })();
  }, []);

  useEffect(() => {
    setDark(theme === "dark");
  }, [theme]);

  const initFresh = useCallback(async () => {
    try {
      const res = await fetch("/api/orientation/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUtilisateur(data.utilisateur);
      setSession(data.session);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ utilisateurId: data.utilisateur.id, sessionId: data.session.id })
      );
      // Message de bienvenue
      setMessages([
        {
          id: uid(),
          role: "bot",
          content:
            "Bonjour 👋 ! Je suis **OriensCI**, votre assistant d'orientation académique et professionnelle en Côte d'Ivoire.\n\nPour bien vous accompagner, je vous propose de :\n• 📋 Créer votre **profil** (niveau, filière, ville)\n• 🧭 Passer le **test RIASEC** pour identifier vos intérêts\n• 💬 Me poser une **question libre** sur une filière, un métier ou des débouchés\n\nComment souhaitez-vous commencer ?",
          timestamp: new Date().toISOString(),
          actions: [
            { type: "demarrer_profil", texte: "Créer mon profil" },
            { type: "proposer_test", texte: "Passer le test RIASEC" },
          ],
        },
      ]);
    } catch {
      toast.error("Impossible d'initialiser la session.");
    }
  }, []);

  const chargerHistorique = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/orientation/sessions?sessionId=${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      const msgs: ChatMessage[] = [];
      if (data.interactions && data.interactions.length > 0) {
        for (const it of data.interactions) {
          if (it.messageUtilisateur) {
            msgs.push({
              id: uid(),
              role: "user",
              content: it.messageUtilisateur,
              timestamp: it.dateHeure,
            });
          }
          if (it.reponseSysteme) {
            msgs.push({
              id: uid(),
              role: "bot",
              content: it.reponseSysteme,
              timestamp: it.dateHeure,
              intention: it.intention?.libelle,
            });
          }
        }
      } else {
        msgs.push({
          id: uid(),
          role: "bot",
          content:
            "Bonjour 👋 ! Je suis **OriensCI**. Reprenons votre orientation. Posez-moi une question ou créez votre profil.",
          timestamp: new Date().toISOString(),
        });
      }
      setMessages(msgs);
    } catch {
      /* ignore */
    }
  };

  // Scroll auto vers le bas à chaque nouveau message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);

  const envoyerMessage = useCallback(async (texte?: string) => {
    const msg = (texte ?? input).trim();
    if (!msg || !utilisateur || !session || loading) return;
    setInput("");
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch("/api/orientation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utilisateurId: utilisateur.id, sessionId: session.id, message: msg }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const botMsg: ChatMessage = {
        id: uid(),
        role: "bot",
        content: data.reponseSysteme,
        timestamp: new Date().toISOString(),
        intention: data.intentionDetectee,
        confidence: data.confidence,
        actions: data.actions,
      };
      setMessages((prev) => [...prev, botMsg]);
      // Rafraîchir l'utilisateur (scores éventuels)
      const ur = await fetch(`/api/orientation/users?id=${utilisateur.id}`);
      if (ur.ok) setUtilisateur(await ur.json());
    } catch {
      toast.error("Le message n'a pas pu être envoyé.");
    } finally {
      setLoading(false);
    }
  }, [input, utilisateur, session, loading]);

  const handleAction = useCallback((action: DialogueAction) => {
    switch (action.type) {
      case "proposer_test":
        setShowTest(true);
        break;
      case "demarrer_profil":
        setShowProfile(true);
        break;
      case "redirection_conseiller":
        setShowCounselor(true);
        break;
      case "proposer_recommandations":
        // déjà affiché inline ; on ne fait rien de plus
        break;
      default:
        break;
    }
  }, []);

  const demanderRecommandations = useCallback(async () => {
    if (!utilisateur) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/orientation/recommendations?utilisateurId=${utilisateur.id}${session ? `&sessionId=${session.id}` : ""}`
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Impossible de générer des recommandations.");
        if (!data.profilComplet) setShowTest(true);
        return;
      }
      const recos: RiasecRecoAffichage[] = (data.recommandations || []).map((r: { metier: { id: string; nom: string; secteurActivite?: string | null; salaireMoyen?: string | null }; scoreCompatibilite: number; justification: string }) => ({
        metierId: r.metier.id,
        nom: r.metier.nom,
        score: r.scoreCompatibilite,
        justification: r.justification,
        secteur: r.metier.secteurActivite,
        salaire: r.metier.salaireMoyen,
      }));
      const botMsg: ChatMessage = {
        id: uid(),
        role: "bot",
        content:
          `🎯 Voici vos **${recos.length} recommandations** (profil dominant : **${data.dominantLabel}**). Cliquez sur un métier pour en savoir plus.`,
        timestamp: new Date().toISOString(),
        intention: "demande_recommandation",
        actions: [
          {
            type: "proposer_recommandations",
            texte: "",
            donnees: { recommandations: recos, dominant: data.dominant },
          },
        ],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      toast.error("Erreur lors de la génération des recommandations.");
    } finally {
      setLoading(false);
    }
  }, [utilisateur, session]);

  const voirMetier = useCallback(async (metierId: string) => {
    if (!metiers.length) return;
    const m = metiers.find((x) => x.id === metierId);
    if (!m) return;
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: `Parle-moi du métier : ${m.nom}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    // déclencher l'envoi via l'API
    setLoading(true);
    try {
      const res = await fetch("/api/orientation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utilisateurId: utilisateur?.id,
          sessionId: session?.id,
          message: `Parle-moi du métier : ${m.nom}`,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          content: data.reponseSysteme,
          timestamp: new Date().toISOString(),
          intention: data.intentionDetectee,
          actions: data.actions,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [metiers, utilisateur, session]);

  const voirFiliere = useCallback(async (filiereId: string) => {
    if (!filieres.length) return;
    const f = filieres.find((x) => x.id === filiereId);
    if (!f) return;
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", content: `Parle-moi de la filière : ${f.nom}`, timestamp: new Date().toISOString() },
    ]);
    try {
      const res = await fetch("/api/orientation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utilisateurId: utilisateur?.id,
          sessionId: session?.id,
          message: `Parle-moi de la filière : ${f.nom}`,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          content: data.reponseSysteme,
          timestamp: new Date().toISOString(),
          intention: data.intentionDetectee,
          actions: data.actions,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [filieres, utilisateur, session]);

  const onTestCompleted = useCallback((result: {
    utilisateur: Utilisateur;
    scores: Record<RiasecDimension, number>;
    dominant: RiasecDimension;
    dominantLabel: string;
    top3: Array<{ dim: RiasecDimension; label: string; score: number; description: string }>;
  }) => {
    setUtilisateur(result.utilisateur);
    const top3Texte = result.top3
      .map((t) => `• **${t.label}** (${t.score}/20) — ${t.description}`)
      .join("\n");
    const botMsg: ChatMessage = {
      id: uid(),
      role: "bot",
      content:
        `✅ Test RIASEC terminé ! Votre profil dominant est **${result.dominantLabel}**.\n\n🧭 **Vos 3 dimensions fortes** :\n${top3Texte}\n\nVous pouvez maintenant générer vos **recommandations personnalisées**.`,
      timestamp: new Date().toISOString(),
      intention: "demande_test_riasec",
      actions: [
        { type: "proposer_recommandations", texte: "Voir mes recommandations", donnees: { trigger: "recommandations" } },
      ],
    };
    setMessages((prev) => [...prev, botMsg]);
  }, []);

  const onProfilSaved = useCallback((u: Utilisateur) => {
    setUtilisateur(u);
    const botMsg: ChatMessage = {
      id: uid(),
      role: "bot",
      content:
        `📋 Profil enregistré ! Niveau : **${u.niveauEtudes ?? "non précisé"}**, Filière : **${u.filiereActuelle?.nom ?? "non précisée"}**, Ville : **${u.localisation ?? "non précisée"}**.\n\nPour obtenir vos recommandations, passons maintenant le **test RIASEC** (≈ 3 min).`,
      timestamp: new Date().toISOString(),
      intention: "demarrage_profil",
      actions: [{ type: "proposer_test", texte: "Passer le test RIASEC" }],
    };
    setMessages((prev) => [...prev, botMsg]);
  }, []);

  const quickActions = [
    { label: "Créer mon profil", icon: ClipboardList, action: () => setShowProfile(true), color: "text-primary" },
    { label: "Passer le test RIASEC", icon: Compass, action: () => setShowTest(true), color: "text-accent-foreground" },
    { label: "Mes recommandations", icon: Sparkles, action: demanderRecommandations, color: "text-primary" },
    { label: "Liste des filières", icon: School, action: () => envoyerMessage("Quelles filières proposez-vous ?"), color: "text-foreground" },
    { label: "Liste des métiers", icon: Briefcase, action: () => envoyerMessage("Quels métiers proposez-vous ?"), color: "text-foreground" },
    { label: "Conseiller humain", icon: HeartHandshake, action: () => setShowCounselor(true), color: "text-destructive" },
  ];

  return (
    <div className="min-h-screen flex flex-col app-bg">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Menu"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold shadow-sm shrink-0">
              <Compass className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-[15px] leading-tight truncate">
                OriensCI
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight truncate hidden sm:block">
                Chatbot d'orientation académique & professionnelle
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Badge variant="outline" className="hidden md:inline-flex text-[10px] gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {metiers.length} métiers · {filieres.length} filières
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(dark ? "light" : "dark")}
              aria-label="Changer de thème"
              className="h-9 w-9"
            >
              {mounted && dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-4 py-3 min-h-0">
        <div className="grid lg:grid-cols-[280px_1fr] gap-3 h-[calc(100vh-3.5rem-2.5rem-1.5rem)]">
          {/* SIDEBAR (desktop + drawer mobile) */}
          <aside
            className={`${sidebarOpen ? "block" : "hidden"} lg:block fixed lg:static inset-0 lg:inset-auto z-40 lg:z-auto bg-background lg:bg-transparent overflow-y-auto scroll-thin p-3 lg:p-0`}
          >
            <div className="flex items-center justify-between mb-2 lg:hidden">
              <span className="font-semibold text-sm">Menu</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {utilisateur && (
              <ProfileSummary
                utilisateur={utilisateur}
                onEditProfil={() => { setShowProfile(true); setSidebarOpen(false); }}
                onPasserTest={() => { setShowTest(true); setSidebarOpen(false); }}
                onRecommandations={() => { demanderRecommandations(); setSidebarOpen(false); }}
                onConseiller={() => { setShowCounselor(true); setSidebarOpen(false); }}
              />
            )}

            <Card className="mt-3 border-primary/20 hidden lg:block">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <List className="h-3.5 w-3.5" /> Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1">
                {quickActions.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => { qa.action(); setSidebarOpen(false); }}
                    className="flex items-center gap-2 text-[12px] px-2 py-1.5 rounded-md hover:bg-secondary text-left transition-colors"
                  >
                    <qa.icon className={`h-3.5 w-3.5 ${qa.color}`} />
                    <span>{qa.label}</span>
                    <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* CHAT */}
          <section className="flex flex-col rounded-xl border bg-card/60 overflow-hidden min-h-0 shadow-sm">
            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto scroll-thin p-3 sm:p-4 space-y-3 min-h-0"
            >
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Chargement…</p>
                </div>
              )}
              {messages.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  onAction={handleAction}
                  onVoirMetier={voirMetier}
                  onVoirFiliere={voirFiliere}
                  onRecommandations={demanderRecommandations}
                />
              ))}
              {loading && (
                <div className="flex items-end gap-2">
                  <BotAvatar />
                  <div className="chat-bubble-bot px-3 py-2.5">
                    <div className="flex items-center gap-1 h-5">
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions mobile */}
            <div className="lg:hidden border-t bg-background/50 px-2 py-1.5 flex gap-1 overflow-x-auto scroll-thin">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  onClick={qa.action}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border bg-card whitespace-nowrap shrink-0"
                >
                  <qa.icon className={`h-3 w-3 ${qa.color}`} />
                  {qa.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="border-t bg-background/80 backdrop-blur p-2 sm:p-3 shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); envoyerMessage(); }}
                className="flex items-end gap-2"
              >
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      envoyerMessage();
                    }
                  }}
                  placeholder="Posez votre question (filière, métier, débouchés, recommandation…)"
                  rows={1}
                  className="min-h-[42px] max-h-32 resize-none text-sm"
                  disabled={loading || !utilisateur}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={loading || !input.trim() || !utilisateur}
                  className="h-[42px] w-[42px] shrink-0"
                  aria-label="Envoyer"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground mt-1 px-1">
                OriensCI est un prototype de recherche. Pour un conseil officiel, contactez un conseiller humain.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER (sticky) */}
      <footer className="mt-auto border-t bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 h-10 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Compass className="h-3 w-3 text-primary" />
            <span className="font-medium text-foreground">OriensCI</span>
            <span className="hidden sm:inline">— Prototype de recherche · Modèle RIASEC de Holland</span>
            <span className="sm:hidden">· RIASEC</span>
          </span>
          <span className="hidden sm:inline">
            Contexte : Côte d'Ivoire · Terminale → Licence
          </span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>

      {/* DIALOGS */}
      {utilisateur && (
        <ProfileSetupDialog
          open={showProfile}
          onOpenChange={setShowProfile}
          utilisateur={utilisateur}
          filieres={filieres}
          onSaved={onProfilSaved}
        />
      )}
      {utilisateur && (
        <RiasecTestDialog
          open={showTest}
          onOpenChange={setShowTest}
          utilisateur={utilisateur}
          onCompleted={onTestCompleted}
        />
      )}
      <CounselorDialog
        open={showCounselor}
        onOpenChange={setShowCounselor}
        utilisateurId={utilisateur?.id}
        sessionId={session?.id}
      />
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
      <Compass className="h-4 w-4" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground border">
      <span className="text-[11px] font-bold">Moi</span>
    </div>
  );
}

function MessageRow({
  message,
  onAction,
  onVoirMetier,
  onVoirFiliere,
  onRecommandations,
}: {
  message: ChatMessage;
  onAction: (a: DialogueAction) => void;
  onVoirMetier: (id: string) => void;
  onVoirFiliere: (id: string) => void;
  onRecommandations: () => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex items-end gap-2 msg-in ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser ? <UserAvatar /> : <BotAvatar />}
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
        <div
          className={`px-3 py-2 text-[13px] sm:text-sm leading-relaxed ${
            isUser ? "chat-bubble-user" : "chat-bubble-bot"
          }`}
        >
          <MessageMarkdown text={message.content} />
        </div>

        {/* Intention détectée (badge) */}
        {!isUser && message.intention && (
          <Badge variant="outline" className="text-[9px] py-0 h-4 font-normal text-muted-foreground">
            {NLU_INTENT_LABELS[message.intention] ?? message.intention}
          </Badge>
        )}

        {/* Actions inline */}
        {!isUser && message.actions && message.actions.length > 0 && (
          <ActionRenderer
            actions={message.actions}
            onAction={onAction}
            onVoirMetier={onVoirMetier}
            onVoirFiliere={onVoirFiliere}
            onRecommandations={onRecommandations}
          />
        )}
      </div>
    </div>
  );
}

function ActionRenderer({
  actions,
  onAction,
  onVoirMetier,
  onVoirFiliere,
  onRecommandations,
}: {
  actions: DialogueAction[];
  onAction: (a: DialogueAction) => void;
  onVoirMetier: (id: string) => void;
  onVoirFiliere: (id: string) => void;
  onRecommandations: () => void;
}) {
  return (
    <>
      {actions.map((a, i) => {
        if (a.type === "proposer_recommandations") {
          const recos = (a.donnees?.recommandations as RiasecRecoAffichage[] | undefined);
          const dominant = a.donnees?.dominant as RiasecDimension | undefined;
          if (!recos) {
            // Bouton déclencheur
            return (
              <Button key={i} size="sm" onClick={onRecommandations} className="text-xs h-8">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Voir mes recommandations
              </Button>
            );
          }
          return (
            <div key={i} className="w-full max-w-md">
              <RecommendationsCard
                recommandations={recos}
                dominantLabel={dominant ? RIASEC_DIMENSIONS[dominant].label : undefined}
                onVoirMetier={onVoirMetier}
              />
            </div>
          );
        }
        if (a.type === "afficher_profil") {
          const profil = a.donnees?.profil as { R: number; I: number; A: number; S: number; E: number; C: number } | undefined;
          const profilComplet = a.donnees?.profilComplet as boolean | undefined;
          const dominant = a.donnees?.dominant as RiasecDimension | undefined;
          if (!profil) return null;
          return (
            <Card key={i} className="w-full max-w-md border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-primary" /> Profil RIASEC
                  {dominant && profilComplet && (
                    <Badge className="text-[10px] ml-auto" style={{ background: RIASEC_DIMENSIONS[dominant].couleur, color: "#fff" }}>
                      {RIASEC_DIMENSIONS[dominant].label}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {RIASEC_ORDER.map((d) => (
                  <div key={d} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold w-3" style={{ color: RIASEC_DIMENSIONS[d].couleur }}>
                      {d}
                    </span>
                    <div className="riasec-bar flex-1">
                      <span style={{ width: `${(profil[d] / 20) * 100}%`, background: RIASEC_DIMENSIONS[d].couleur }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-7 text-right tabular-nums">{profil[d]}/20</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        }
        if (a.type === "afficher_liste_filieres") {
          const list = (a.donnees?.filieres as { id: string; nom: string }[] | undefined) ?? [];
          return (
            <Card key={i} className="w-full max-w-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-primary" /> Filières disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-56 overflow-y-auto scroll-thin">
                {list.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onVoirFiliere(f.id)}
                    className="flex items-center justify-between text-[12px] px-2 py-1.5 rounded-md hover:bg-secondary text-left"
                  >
                    <span className="truncate">{f.nom}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>
          );
        }
        if (a.type === "afficher_liste_metiers") {
          const list = (a.donnees?.metiers as { id: string; nom: string }[] | undefined) ?? [];
          return (
            <Card key={i} className="w-full max-w-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary" /> Métiers disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-56 overflow-y-auto scroll-thin">
                {list.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onVoirMetier(m.id)}
                    className="flex items-center justify-between text-[12px] px-2 py-1.5 rounded-md hover:bg-secondary text-left"
                  >
                    <span className="truncate">{m.nom}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>
          );
        }
        // Boutons simples (proposer_test, demarrer_profil, redirection_conseiller)
        const label = a.texte || defaultLabel(a.type);
        return (
          <Button
            key={i}
            size="sm"
            variant={a.type === "redirection_conseiller" ? "outline" : "default"}
            onClick={() => onAction(a)}
            className="text-xs h-8"
          >
            {iconFor(a.type)} {label}
          </Button>
        );
      })}
    </>
  );
}

function defaultLabel(type: DialogueAction["type"]): string {
  switch (type) {
    case "proposer_test": return "Passer le test RIASEC";
    case "demarrer_profil": return "Créer mon profil";
    case "redirection_conseiller": return "Parler à un conseiller";
    default: return "OK";
  }
}

function iconFor(type: DialogueAction["type"]): React.ReactNode {
  switch (type) {
    case "proposer_test": return <Compass className="h-3.5 w-3.5 mr-1" />;
    case "demarrer_profil": return <ClipboardList className="h-3.5 w-3.5 mr-1" />;
    case "redirection_conseiller": return <HeartHandshake className="h-3.5 w-3.5 mr-1" />;
    default: return null;
  }
}

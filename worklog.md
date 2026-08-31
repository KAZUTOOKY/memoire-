# Worklog — OriensCI (Chatbot d'orientation académique et professionnelle)

## Project Overview
Prototype fonctionnel d'un chatbot intelligent d'aide à l'orientation académique et professionnelle pour les élèves et étudiants ivoiriens (Terminale → Licence). Issu d'un mémoire de recherche.

**Adaptation technique**: Le prompt initial demandait Flask + HTML/CSS/JS vanilla + SQLite brut. L'environnement de développement impose **Next.js 16 + TypeScript + Prisma (SQLite) + shadcn/ui**. L'architecture 3 couches, les 7 entités, l'algorithme RIASEC hybride et toutes les règles de gestion sont respectés fidèlement, mais implémentés dans la stack imposée (API routes Next.js = couche logique/présentation backend ; React = couche présentation frontend ; Prisma = couche données).

## Architecture cible
- **Couche présentation**: `src/app/page.tsx` + composants React (chat, profil, test RIASEC, recommandations)
- **Couche logique**: `src/lib/orientation/` (NLU, dialogue manager, RIASEC scoring, recommandation engine) + `src/app/api/` (routes REST)
- **Couche données**: `prisma/schema.prisma` + `src/lib/db.ts` + script de seed

## Modules fonctionnels
1. Interface utilisateur (fenêtre de chat)
2. NLU (détection d'intention par mots-clés)
3. Gestionnaire de dialogue
4. Moteur de profilage + recommandation (similarité cosinus RIASEC)
5. Base de connaissances (filières/métiers ivoiriens)
6. Bascule vers conseiller humain

---

Task ID: 0
Agent: main (orchestrator)
Task: Initialisation du worklog et planification du projet.

Work Log:
- Analyse du prompt utilisateur (chatbot d'orientation RIASEC, contexte ivoirien, 7 entités, algorithme hybride).
- Vérification de l'état du projet Next.js existant (Prisma configuré, shadcn/ui installé, port 3000).
- Définition du plan en 10 tâches (schema → seed → logique → API → frontend → test → cron).

Stage Summary:
- Worklog créé. Début du développement par la couche données (Prisma schema).

---
Task ID: 1-9
Agent: main (orchestrator)
Task: Développement complet du prototype OriensCI (chatbot d'orientation RIASEC).

Work Log:
- Schéma Prisma créé avec 7 entités du mémoire (Utilisateur, Filiere, Metier, FiliereMetier, Session, Intention, Interaction, Recommandation) + QuestionRiasec + DemandeConseiller. Règles de gestion RG1-RG7 respectées via les relations Prisma.
- `db:push` exécuté avec succès.
- Seed: 15 filières ivoiriennes, 20 métiers, 33 liens filière↔métier, 11 intentions, 30 questions RIASEC (5 par dimension). Établissements réels (INP-HB, Université Alassane Ouattara, ENS, ENA, CESTI, ESA, Beaux-Arts...).
- Module NLU (`src/lib/orientation/nlu.ts`) : détection d'intention par mots-clés + détection d'entités (filière/métier par similarité de nom, dimension RIASEC, mot-clé de domaine). 11 intentions gérées.
- Moteur de recommandation (`src/lib/orientation/recommendation.ts`) : similarité cosinus (0.7) + distance euclidienne normalisée (0.3), filtre par niveau, top 3-5 résultats, justification textuelle auto-générée.
- Gestionnaire de dialogue (`src/lib/orientation/dialogue.ts`) : orchestre NLU + recommandations + base de connaissances, persiste interactions & recommandations, gère les relances.
- 8 routes API REST: /init, /users, /sessions, /riasec, /chat, /recommendations, /filieres, /metiers, /conseiller.
- Frontend React: ChatInterface (chat fenêtre), ProfileSetupDialog, RiasecTestDialog (30 questions, échelle Likert 5 points, auto-avance), CounselorDialog, RecommendationsCard, ProfileSummary (avec mini-graphiques RIASEC), MessageMarkdown (rendu markdown léger).
- Thème visuel: palette émeraude (vert drapeau ivoirien) + orange (accent), mode clair/sombre via next-themes, fond dégradé, animations (msg-in, typing dots, hover cards).
- Layout responsive: sidebar profil + actions rapides (desktop), drawer + scroll horizontal mobile. Footer sticky.
- Bug fix: `mode: "insensitive"` non supporté par SQLite/Prisma → retiré de toutes les requêtes.

Stage Summary:
- Prototype fonctionnel complet, vérifié end-to-end avec agent-browser.
- Flux validés: (1) accueil + init session, (2) création profil (Terminale + Abidjan), (3) test RIASEC 30 questions → scores calculés → profil dominant, (4) recommandations générées avec scores % + justifications, (5) redirection conseiller humain (formulaire + persistance), (6) question libre "débouchés de la médecine" → NLU détecte demande_debouches + entité métier → réponse contextuelle.
- Lint propre, serveur dev stable (PID persistant via .zscripts/dev.sh), aucune erreur runtime.
- Screenshots: screenshot-init.png, screenshot-profile-saved.png, screenshot-recommandations.png, screenshot-final.png, screenshot-mobile.png, screenshot-dark.png.

Unresolved issues / risks:
- Le test RIASEC persiste en localStorage mais pas de multi-comptes (1 utilisateur par navigateur). Acceptable pour un prototype.
- Le NLU est basé sur des mots-clés (conforme au mémoire) — peut manquer certaines formulations très libres. Le fallback `information_generale` gère ces cas.
- Pas de WebSocket temps réel (non requis par le mémoire — le chat est synchrone via fetch).

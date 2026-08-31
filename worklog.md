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

---
Task ID: 11
Agent: cron-review (round 1)
Task: QA agent-browser + planification round 1 d'améliorations (styling + features).

Work Log:
- Revue du worklog : prototype fonctionnel, 7 entités, NLU, moteur de recommandation, test RIASEC, chat, profil, redirection conseiller — tout est en place.
- QA agent-browser :
  - Serveur dev stable (PID 2773, port 3000, 0 erreur runtime, 0 erreur console).
  - Test fresh onboarding : init session OK, message de bienvenue OK.
  - Test greeting "Bonjour" : intention `salutation` détectée, réponse contextuelle OK.
  - Test question libre "C'est quoi un ingenieur civil ?" : intention `recherche_metier` détectée, entité métier matchée, fiche métier rendue avec filières d'accès OK.
  - Test whitespace input : bouton Envoyer correctement désactivé.
  - Test "xyz qwerty" (sans mot-clé) : intention `information_generale` affichée (verbose) — amélioration possible : fallback plus court avec suggestions.
- Lint propre (`bun run lint` → 0 erreur).

Issues identifiées (à traiter ce round) :
1. **Bug mineur / UX** : entrée sans mot-clé → affiche la longue présentation "information_generale" au lieu d'un message court + suggestions de questions.
2. **Styling à enrichir** :
   - Pas de visualisation radar RIASEC (uniquement barres) — un radar hexagonal serait beaucoup plus parlant.
   - Pas de stepper de progression d'onboarding (l'utilisateur ne sait pas où il en est).
   - Pas de chips de réponses rapides après les messages du bot.
   - État vide (avant 1er message) peu engageant.
   - Pas de bouton "nouvelle conversation" / "réinitialiser profil".
3. **Features à ajouter** :
   - Radar chart RIASEC (hexagone SVG) dans le profil + résultats du test.
   - Stepper d'onboarding (Profil → Test → Recommandations).
   - Quick-reply chips contextuels.
   - Bouton "Effacer la conversation" + "Réinitialiser mon profil".
   - Page/dialog "Comparer les filières" (sélection multiple, tableau comparatif).
   - Export PDF/Impression des recommandations.
   - Pied de page enrichi avec stats session.

Stage Summary:
- Prototype stable, aucune régression. On entre en phase d'enrichissement styling + features.
- Plan d'action round 1 :
  - A. Corriger le fallback NLU (message court + suggestions).
  - B. Ajouter un composant Radar RIASEC (SVG hexagonal).
  - C. Ajouter un stepper d'onboarding dans la sidebar.
  - D. Ajouter des quick-reply chips après les messages du bot.
  - E. Ajouter boutons "nouvelle conversation" + "réinitialiser profil" + "comparer filières".
  - F. Polish styling (état vide, animations, ombres, dégradés).

---
Task ID: 12
Agent: cron-review (round 1 — exécution)
Task: Enrichissement styling + features (round 1).

Work Log:
- **QA initiale** (agent-browser) : serveur stable, 0 erreur runtime, 0 erreur console. Testé greeting, question libre, fallback "xyz qwerty" (verbose), whitespace (bouton désactivé).
- **Bug fix NLU** : `information_generale` distinguait mal une vraie demande d'aide d'une entrée inconnue. Maintenant : si `confidence > 0.05` OU mot-clé d'aide détecté → présentation complète ; sinon → message court "Je n'ai pas bien compris..." + 4 chips de suggestion (filieres, métiers, recommandations, conseiller).
- **Nouveau type d'action `suggestion`** : chips de quick-reply cliquables qui envoient un message prédéfini. Ajouté à `DialogueAction` et au `ActionRenderer` (chips arrondies avec icône MessageCircle).
- **Quick-reply chips contextuels** ajoutés sur : salutation, remerciement, test RIASEC terminé, profil réinitialisé, nouvelle conversation, fallback entrée inconnue.
- **Composant `RiasecRadar`** : radar hexagonal SVG (200-240px), grille concentrique, polygone animé, étiquettes colorées, valeur au sommet dominant. Aucune dépendance externe.
- **Composant `OnboardingStepper`** : stepper visuel 3 étapes (Profil → Test RIASEC → Recommandations) avec icônes, états (done/current/todo), animations, fonction `calculerEtape()`.
- **Composant `RiasecResultDialog`** : modal de résultats détaillés avec bandeau dégradé profil dominant, radar, top 3 dimensions en cards, répartition complète en grille, boutons "Repasser" + "Voir recommandations".
- **Composant `CompareFilieresDialog`** : comparateur 2-3 filières avec recherche, tableau comparatif (description, durée, conditions, établissements, débouchés, profil RIASEC visuel par barres).
- **Composant `ExportRecommandationsDialog`** : synthèse imprimable (profil utilisateur, profil RIASEC, recommandations classées) avec bouton "Imprimer / Enregistrer en PDF".
- **Mise à jour `ProfileSummary`** : bandeau dégradé en haut, carte info profil en bg-muted/40, toggle radar/barres, stats résumées (total + score max), bouton reset, boutons avec icônes.
- **Mise à jour `ChatInterface`** :
  - Header : bouton "Nouvelle conversation" (icône Plus), bouton "Exporter" (visible si recommandations générées), bouton "Changer de thème".
  - Sidebar : stepper d'onboarding en haut, ProfileSummary avec onReset.
  - Messages : ajout nom (Vous/OriensCI) + horodatage + badge intention.
  - État vide : logo animé pulse au lieu de "Chargement...".
  - 3 nouveaux dialogs intégrés (RiasecResultDialog, CompareFilieresDialog, ExportRecommandationsDialog).
- **Bug fixes** :
  - `<button>` imbriqué dans `CompareFilieresDialog` (Checkbox dans button) → remplacé par `<div role="button">` avec checkbox custom.
  - Select controlled/uncontrolled warning dans `ProfileSetupDialog` (value null) → initialisation à "" + useEffect with fallback.
  - `next.config.ts` : ajout `allowedDevOrigins` pour supprimer warning cross-origin.

Verification (agent-browser) :
- Fresh onboarding : stepper visible (étape 1), boutons nouveau/reset/export présents. ✓
- Greeting "Bonjour" : 3 chips (Passer le test, Voir les filières, Créer mon profil). ✓
- Fallback "xyz qwerty inconnu" : message court + 4 chips. ✓
- Profil (Terminale + Abidjan) : stepper avance à étape 2, profil mis à jour. ✓
- Test RIASEC (30 TAF) : radar s'affiche dans le dialog résultats + dans la sidebar. ✓
- Recommandations : 5 métiers classés avec scores. ✓
- Export dialog : synthèse imprimable complète. ✓
- Compare dialog : sélection + tableau comparatif avec barres RIASEC. ✓
- Nouvelle conversation : message de confirmation + chips. ✓
- Reset profil : dialog confirm + reset + nouveau fresh onboarding. ✓
- Mobile (iPhone 14) : layout responsive correct. ✓
- Console : 0 erreur, 0 warning. ✓
- Lint : 0 erreur. ✓
- 12 screenshots QA : qa-1 à qa-12.

Stage Summary:
- Round 1 d'enrichissement terminé avec succès.
- Features livrées : NLU fallback + suggestions, radar RIASEC SVG, stepper onboarding, dialog résultats détaillés, comparateur de filières, export PDF, nouvelle conversation, reset profil, quick-reply chips contextuels, messages avec timestamps.
- Aucune régression, 0 erreur console, lint propre.
- Serveur dev stable, prêt pour le round 2.

Unresolved issues / risks :
- Le comparateur ne compare pas encore les métiers (uniquement filières). Peut être étendu.
- L'export PDF est basique (print natif navigateur) — pas de mise en page avancée.
- L'historique des sessions précédentes n'est pas encore consultable dans l'UI (les sessions sont créées en base mais pas affichées).
- Pas de statut "online" du conseiller humain (le formulaire est asynchrone, pas de chat temps réel).

Recommandations round 2 (priorités) :
1. **Historique des sessions** : dialog listant les sessions passées avec leur contenu.
2. **Recherche globale** : barre de recherche dans le chat (filtre messages/filieres/métiers).
3. **Statistiques d'orientation** : petite carte dans la sidebar montrant nb sessions, nb questions, profil dominant.
4. **Suggestions de filières proches** : si l'utilisateur a un profil RIASEC, suggérer les filières les plus compatibles (pas seulement les métiers).
5. **Améliorer le rendu mobile du compare dialog** (tableau scrollable horizontalement).

---
Task ID: 13
Agent: cron-review (round 2 — QA + planification)
Task: QA round 2 + planification nouvelles features.

Work Log:
- Revue du worklog : round 1 terminé (radar SVG, stepper, comparateur, export PDF, nouvelle conversation, reset profil, quick-reply chips, NLU fallback corrigé).
- QA agent-browser : serveur stable, 0 erreur console, 0 warning. Fresh onboarding OK. Profil (Licence 1 + Abidjan) OK. Test RIASEC 30 TAF → radar + dialog résultats OK. Recommandations 5 métiers OK.
- Aucune régression détectée.

Plan d'action round 2 (features + styling) :
1. **Historique des sessions** : dialog listant les sessions passées avec leur contenu (interactions + recommandations).
2. **Statistiques d'orientation** : carte dans la sidebar montrant nb sessions, nb questions, profil dominant, score moyen.
3. **Suggestions de filières compatibles** : étendre le moteur de recommandation pour proposer aussi des filières (pas seulement des métiers).
4. **Recherche globale** : barre de recherche dans le chat (filtre messages/filieres/métiers).
5. **Polish styling** : animations de transition entre messages, badge "nouveau" sur les recommandations, footer enrichi avec stats.
6. **Glossaire RIASEC** : dialog expliquant les 6 dimensions avec exemples de métiers types.

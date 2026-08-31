// Seed — OriensCI : filières & métiers ivoiriens, intentions, questions RIASEC
// Contexte : Côte d'Ivoire (Terminale → Licence)
import { db } from "../src/lib/db";
import { RIASEC_QUESTIONS } from "../src/lib/orientation/riasec-constants";

// Profils RIASEC cibles (échelle 0-10)
interface ProfilDef {
  R: number; I: number; A: number; S: number; E: number; C: number;
}

const FILIERES: Array<{
  nom: string;
  description: string;
  profil: ProfilDef;
  conditionsAcces: string;
  etablissements: string[];
  duree: string;
  debouches: string;
  domaines: string[];
}> = [
  {
    nom: "Informatique & Génie Logiciel",
    description:
      "Conception, développement et maintenance de logiciels, applications et systèmes informatiques.",
    profil: { R: 7, I: 9, A: 4, S: 2, E: 3, C: 7 },
    conditionsAcces: "Bac scientifique (C, D, E, F2) recommandé. Concours INPHB ou inscription Université.",
    etablissements: ["INP-HB (Yamoussoukro)", "Université Alassane Ouattara (Bouaké)", "Université Nangui Abrogoua (Abidjan)", "IUA"],
    duree: "3 à 5 ans",
    debouches: "Développeur, ingénieur logiciel, administrateur système, data analyst.",
    domaines: ["informatique", "programmation", "code", "logiciel", "numérique", "tech", "développement"],
  },
  {
    nom: "Génie Civil & BTP",
    description:
      "Conception et construction d'ouvrages : ponts, bâtiments, routes, infrastructures.",
    profil: { R: 9, I: 7, A: 2, S: 2, E: 4, C: 6 },
    conditionsAcces: "Bac scientifique (C, D, E). Concours INP-HB (École Polytechnique).",
    etablissements: ["INP-HB — ENSP (Yamoussoukro)", "Université Jean Lorougnon Guédé (Daloa)", "Institut National Polytechnique"],
    duree: "5 ans",
    debouches: "Ingénieur génie civil, conducteur de travaux, bureau d'études, BTP.",
    domaines: ["construction", "btp", "génie", "civil", "ouvrage", "pont", "route", "bâtiment"],
  },
  {
    nom: "Médecine & Sciences de la Santé",
    description:
      "Formation médicale : diagnostic, traitement et prévention des maladies.",
    profil: { R: 5, I: 9, A: 2, S: 8, E: 2, C: 4 },
    conditionsAcces: "Bac scientifique (C, D). Concours très sélectif Université Alassane Ouattara.",
    etablissements: ["Université Alassane Ouattara (Bouaké) — UFR SMA", "CHU de Bouaké", "CHU de Cocody"],
    duree: "7 à 9 ans",
    debouches: "Médecin généraliste, spécialiste, chirurgien, médecin de famille.",
    domaines: ["médecine", "santé", "soin", "hôpital", "maladie", "patient", "docteur", "médical"],
  },
  {
    nom: "Sciences Économiques & Gestion",
    description:
      "Analyse économique, gestion d'entreprise, finance, comptabilité et commerce.",
    profil: { R: 1, I: 7, A: 2, S: 3, E: 7, C: 6 },
    conditionsAcces: "Bac (toutes séries, surtout D, G). Inscription Université.",
    etablissements: ["Université Alassane Ouattara (Bouaké)", "Université Jean Lorougnon Guédé (Daloa)", "ESPAE — INP-HB"],
    duree: "3 à 5 ans",
    debouches: "Économiste, analyste financier, gestionnaire, contrôleur de gestion.",
    domaines: ["économie", "gestion", "finance", "entreprise", "comptabilité", "commerce", "argent"],
  },
  {
    nom: "Droit & Sciences Juridiques",
    description:
      "Étude du droit : civil, pénal, des affaires, public. Formation des juristes et avocats.",
    profil: { R: 1, I: 5, A: 3, S: 7, E: 6, C: 5 },
    conditionsAcces: "Bac (toutes séries). Inscription Université ou ENA pour le droit public.",
    etablissements: ["Université Alassane Ouattara (Bouaké) — UFR SJAP", "Université Jean Lorougnon Guédé", "ENA (Abidjan)"],
    duree: "3 à 7 ans",
    debouches: "Avocat, magistrat, juriste d'entreprise, notaire, conseiller juridique.",
    domaines: ["droit", "justice", "loi", "juridique", "avocat", "tribunal", "juriste"],
  },
  {
    nom: "Marketing & Commerce",
    description:
      "Stratégie commerciale, marketing digital, vente, gestion de la relation client.",
    profil: { R: 1, I: 3, A: 5, S: 6, E: 9, C: 4 },
    conditionsAcces: "Bac (toutes séries). BTS, DUT ou licence professionnelle.",
    etablissements: ["INP-HB — ESPAE", "IUA (Abidjan)", "Université Alassane Ouattara", "Groupe ISM"],
    duree: "2 à 5 ans",
    debouches: "Chargé de marketing, chef de produit, commercial, brand manager.",
    domaines: ["marketing", "commerce", "vente", "publicité", "produit", "client", "business"],
  },
  {
    nom: "Architecture & Beaux-Arts",
    description:
      "Conception d'espaces et bâtiments, design, arts plastiques et visuels.",
    profil: { R: 7, I: 6, A: 9, S: 2, E: 4, C: 3 },
    conditionsAcces: "Bac (toutes séries). Concours École des Beaux-Arts d'Abidjan.",
    etablissements: ["École des Beaux-Arts d'Abidjan (ENSA)", "INP-HB — ESTRAS"],
    duree: "5 ans",
    debouches: "Architecte, designer d'espace, urbaniste, artiste plasticien.",
    domaines: ["architecture", "design", "art", "beaux", "dessin", "créatif", "espace", "bâtir"],
  },
  {
    nom: "Communication & Journalisme",
    description:
      "Information, presse, audiovisuel, communication d'entreprise et relations publiques.",
    profil: { R: 1, I: 4, A: 7, S: 7, E: 6, C: 3 },
    conditionsAcces: "Bac (toutes séries). Concours CESTI ou ISMP.",
    etablissements: ["CESTI — Université Alassane Ouattara", "ISMP (Abidjan)", "Groupe ISM"],
    duree: "3 à 5 ans",
    debouches: "Journaliste, rédacteur, chargé de communication, animateur, attaché de presse.",
    domaines: ["communication", "journalisme", "presse", "média", "info", "écriture", "radio", "tv"],
  },
  {
    nom: "Agronomie & Sciences Agricoles",
    description:
      "Production végétale et animale, gestion durable des ressources, agro-industrie.",
    profil: { R: 8, I: 7, A: 2, S: 3, E: 3, C: 4 },
    conditionsAcces: "Bac scientifique (C, D). Concours ESA INP-HB.",
    etablissements: ["INP-HB — ESA (Yamoussoukro)", "Université Jean Lorougnon Guédé (Daloa)"],
    duree: "5 ans",
    debouches: "Ingénieur agronome, chef de projet agricole, agro-industrie, conseiller agricole.",
    domaines: ["agriculture", "agronomie", "agro", "terre", "culture", "élevage", "champ", "rural"],
  },
  {
    nom: "Électrotechnique & Électronique",
    description:
      "Production et distribution d'énergie, systèmes électroniques, automatismes industriels.",
    profil: { R: 9, I: 7, A: 2, S: 2, E: 3, C: 6 },
    conditionsAcces: "Bac scientifique (C, D, E, F2). Concours INP-HB.",
    etablissements: ["INP-HB — ENSP (Yamoussoukro)", "IUT (Abidjan, Bouaké)"],
    duree: "2 à 5 ans",
    debouches: "Ingénieur électricien, automaticien, technicien supérieur, maintenance industrielle.",
    domaines: ["électricité", "électrotechnique", "électronique", "énergie", "courant", "circuit", "automatisme"],
  },
  {
    nom: "Comptabilité & Finance",
    description:
      "Tenue et contrôle des comptes, audit, fiscalité, gestion financière.",
    profil: { R: 3, I: 6, A: 1, S: 2, E: 5, C: 9 },
    conditionsAcces: "Bac (surtout D, G). BTS, DUT ou licence. Préparation DEC/DECOFI.",
    etablissements: ["IUT — Université Alassane Ouattara", "INTEC", "Groupe ISM", "IPG"],
    duree: "2 à 7 ans",
    debouches: "Comptable, expert-comptable, auditeur, contrôleur financier, trésorier.",
    domaines: ["comptabilité", "finance", "compte", "audit", "fiscalité", "bilan", "chiffre"],
  },
  {
    nom: "Enseignement & Sciences de l'Éducation",
    description:
      "Formation des enseignants du primaire et secondaire, sciences de l'éducation.",
    profil: { R: 2, I: 6, A: 5, S: 9, E: 3, C: 4 },
    conditionsAcces: "Bac. Concours ENS (École Normale Supérieure).",
    etablissements: ["ENS — Abidjan", "ENS — Bouaké", "Université Alassane Ouattara"],
    duree: "3 à 5 ans",
    debouches: "Enseignant, professeur, conseiller pédagogique, inspecteur de l'éducation.",
    domaines: ["enseignement", "professeur", "maître", "école", "éducation", "pédagogie", "enseigner"],
  },
  {
    nom: "Géologie & Mines",
    description:
      "Exploration et exploitation des ressources minières, hydrogéologie, environnement.",
    profil: { R: 8, I: 8, A: 2, S: 2, E: 3, C: 5 },
    conditionsAcces: "Bac scientifique (C, D). Concours INP-HB.",
    etablissements: ["INP-HB — ESM (École des Mines)", "Université Alassane Ouattara"],
    duree: "5 ans",
    debouches: "Géologue, ingénieur des mines, hydrogéologue, prospecteur, environnement.",
    domaines: ["géologie", "mine", "terre", "minerai", "pétrole", "or", "ressource", "sous-sol"],
  },
  {
    nom: "Lettres Modernes & Langues",
    description:
      "Littérature, langues, linguistique. Formation à l'analyse de texte et à la communication.",
    profil: { R: 1, I: 5, A: 8, S: 7, E: 3, C: 3 },
    conditionsAcces: "Bac (toutes séries, surtout A, G). Inscription Université.",
    etablissements: ["Université Alassane Ouattara (Bouaké) — UFR LLS", "Université Jean Lorougnon Guédé"],
    duree: "3 à 5 ans",
    debouches: "Enseignant, journaliste, rédacteur, traducteur, attaché de communication.",
    domaines: ["lettre", "littérature", "langue", "français", "anglais", "texte", "écriture"],
  },
  {
    nom: "Management Public & Administration",
    description:
      "Gestion des affaires publiques, management administratif, gouvernance.",
    profil: { R: 1, I: 4, A: 3, S: 6, E: 8, C: 6 },
    conditionsAcces: "Bac (toutes séries). Concours ENA.",
    etablissements: ["ENA (Abidjan)", "Université Alassane Ouattara — UFR SJAP"],
    duree: "3 ans",
    debouches: "Administrateur civil, cadre de la fonction publique, magistrat administratif.",
    domaines: ["administration", "public", "fonction", "état", "gouvernance", "management", "ena"],
  },
];

const METIERS: Array<{
  nom: string;
  description: string;
  profil: ProfilDef;
  secteur: string;
  debouches: string;
  salaire: string;
  competences: string[];
  niveauMinimum: string;
}> = [
  { nom: "Développeur informatique", description: "Conçoit et code des logiciels, sites web et applications.",
    profil: { R: 7, I: 9, A: 4, S: 2, E: 3, C: 7 }, secteur: "Numérique / IT",
    debouches: "Banques, startups, télécoms (Orange, MTN), freelancing.", salaire: "300 000 – 1 500 000 FCFA/mois",
    competences: ["Logique", "Algorithmique", "Patience", "Veille technologique"], niveauMinimum: "Bac+2 à Bac+5" },
  { nom: "Ingénieur civil / BTP", description: "Conçoit et supervise la construction d'ouvrages.",
    profil: { R: 9, I: 7, A: 2, S: 2, E: 4, C: 6 }, secteur: "Construction / BTP",
    debouches: "Bureaux d'études, entreprises de BTP (COLAS, SOGEA), fonction publique.",
    salaire: "400 000 – 1 800 000 FCFA/mois", competences: ["Rigueur", "Vision spatiale", "Encadrement", "Sécurité"], niveauMinimum: "Bac+5" },
  { nom: "Médecin généraliste", description: "Diagnostique et traite les maladies des patients.",
    profil: { R: 5, I: 9, A: 2, S: 8, E: 2, C: 4 }, secteur: "Santé",
    debouches: "Hôpitaux publics, cliniques privées, cabinet libéral, ONG.",
    salaire: "500 000 – 3 000 000 FCFA/mois", competences: ["Empathie", "Rigueur scientifique", "Écoute", "Décision"], niveauMinimum: "Bac+7 à Bac+9" },
  { nom: "Infirmier / Infirmière", description: "Soigne et accompagne les patients au quotidien.",
    profil: { R: 5, I: 6, A: 2, S: 9, E: 2, C: 4 }, secteur: "Santé",
    debouches: "Hôpitaux, centres de santé, cliniques, ONG humanitaires.",
    salaire: "150 000 – 500 000 FCFA/mois", competences: ["Empathie", "Résistance", "Soins", "Écoute"], niveauMinimum: "Bac+3" },
  { nom: "Économiste / Analyste", description: "Analyse les phénomènes économiques et conseille les décideurs.",
    profil: { R: 1, I: 7, A: 2, S: 3, E: 7, C: 6 }, secteur: "Économie / Finance",
    debouches: "BCEAO, ministère de l'Économie, banques, instituts de recherche, ONG.",
    salaire: "400 000 – 2 000 000 FCFA/mois", competences: ["Analyse", "Statistiques", "Synthèse", "Veille"], niveauMinimum: "Bac+5" },
  { nom: "Comptable / Expert-comptable", description: "Tient et contrôle les comptes des entreprises.",
    profil: { R: 3, I: 6, A: 1, S: 2, E: 5, C: 9 }, secteur: "Finance / Comptabilité",
    debouches: "Cabinets d'expertise, entreprises, banques, fonction publique.",
    salaire: "250 000 – 1 500 000 FCFA/mois", competences: ["Rigueur", "Méthode", "Honnêteté", "Chiffres"], niveauMinimum: "Bac+2 à Bac+8" },
  { nom: "Avocat / Juriste d'entreprise", description: "Conseille et défend en matière juridique.",
    profil: { R: 1, I: 5, A: 3, S: 7, E: 6, C: 5 }, secteur: "Droit / Justice",
    debouches: "Cabinets d'avocats, entreprises, banques, magistrature.",
    salaire: "300 000 – 3 000 000 FCFA/mois", competences: ["Argumentation", "Écriture", "Écoute", "Éthique"], niveauMinimum: "Bac+5 à Bac+7" },
  { nom: "Chargé de marketing", description: "Promeut les produits et gère l'image d'une marque.",
    profil: { R: 1, I: 3, A: 5, S: 6, E: 9, C: 4 }, secteur: "Marketing / Commerce",
    debouches: "Grandes entreprises (Nestlé, Cémoi, Solibra), agences de pub, startups.",
    salaire: "300 000 – 1 500 000 FCFA/mois", competences: ["Créativité", "Stratégie", "Analyse marché", "Communication"], niveauMinimum: "Bac+3 à Bac+5" },
  { nom: "Architecte", description: "Conçoit les bâtiments et aménage les espaces.",
    profil: { R: 7, I: 6, A: 9, S: 2, E: 4, C: 3 }, secteur: "Architecture / Construction",
    debouches: "Agences d'architecture, BTP, urbanisme, libéral.",
    salaire: "400 000 – 2 500 000 FCFA/mois", competences: ["Créativité", "Dessin", "Vision spatiale", "Technique"], niveauMinimum: "Bac+5" },
  { nom: "Journaliste / Rédacteur", description: "Informe le public via la presse, la radio, la TV ou le web.",
    profil: { R: 1, I: 4, A: 7, S: 7, E: 6, C: 3 }, secteur: "Médias / Communication",
    debouches: "Presse écrite (Fraternité Matin, Soir Info), radio, TV (RTI, NCRI), web.",
    salaire: "200 000 – 1 200 000 FCFA/mois", competences: ["Curiosité", "Écriture", "Esprit critique", "Écoute"], niveauMinimum: "Bac+3 à Bac+5" },
  { nom: "Ingénieur agronome", description: "Améliore les productions agricoles et gère durablement les ressources.",
    profil: { R: 8, I: 7, A: 2, S: 3, E: 3, C: 4 }, secteur: "Agriculture / Agro-industrie",
    debouches: "Ministère de l'Agriculture, ACEP, CCI, ONG rurales, agro-industrie (Cémoi, SIFCA).",
    salaire: "350 000 – 1 500 000 FCFA/mois", competences: ["Observation", "Conduite de projet", "Rigueur", "Terrain"], niveauMinimum: "Bac+5" },
  { nom: "Ingénieur électricien", description: "Conçoit et maintient des systèmes électriques et électroniques.",
    profil: { R: 9, I: 7, A: 2, S: 2, E: 3, C: 6 }, secteur: "Énergie / Industrie",
    debouches: "CIE (Compagnie Ivoirienne d'Électricité), CIPREL, industrie, maintenance.",
    salaire: "350 000 – 1 800 000 FCFA/mois", competences: ["Technique", "Sécurité", "Diagnostic", "Méthode"], niveauMinimum: "Bac+2 à Bac+5" },
  { nom: "Enseignant / Professeur", description: "Transmet des connaissances et forme les élèves.",
    profil: { R: 2, I: 6, A: 5, S: 9, E: 3, C: 4 }, secteur: "Éducation",
    debouches: "ENEP, lycées et collèges publics/privés, MENA, universités.",
    salaire: "200 000 – 800 000 FCFA/mois", competences: ["Pédagogie", "Patience", "Écoute", "Maîtrise discipline"], niveauMinimum: "Bac+3 à Bac+5" },
  { nom: "Géologue / Ingénieur des mines", description: "Explore et exploite les ressources du sous-sol.",
    profil: { R: 8, I: 8, A: 2, S: 2, E: 3, C: 5 }, secteur: "Mines / Énergie",
    debouches: "SODEMI, Randgold, sociétés pétrolières (CI-24, TOTAL), BTP, hydrogéologie.",
    salaire: "500 000 – 2 500 000 FCFA/mois", competences: ["Terrain", "Analyse", "Observation", "Rigueur"], niveauMinimum: "Bac+5" },
  { nom: "Administrateur civil", description: "Pilote les politiques publiques au sein de l'État.",
    profil: { R: 1, I: 4, A: 3, S: 6, E: 8, C: 6 }, secteur: "Fonction publique",
    debouches: "Ministères, présidence, collectivités territoriales, agences d'État.",
    salaire: "300 000 – 1 500 000 FCFA/mois", competences: ["Leadership", "Rédaction", "Vision", "Organisation"], niveauMinimum: "Bac+3 (ENA)" },
  { nom: "Entrepreneur / Créateur d'entreprise", description: "Lance et développe son propre projet économique.",
    profil: { R: 5, I: 4, A: 4, S: 5, E: 9, C: 4 }, secteur: "Entrepreneuriat",
    debouches: "Tous secteurs : tech, agriculture, services, commerce, industrie.",
    salaire: "Variable (dépend du succès)", competences: ["Initiative", "Résilience", "Vision", "Vente"], niveauMinimum: "Tous niveaux" },
  { nom: "Designer graphique", description: "Crée des visuels, identités et supports de communication.",
    profil: { R: 3, I: 5, A: 9, S: 3, E: 4, C: 3 }, secteur: "Design / Communication",
    debouches: "Agences de communication, entreprises, médias, freelancing.",
    salaire: "200 000 – 1 200 000 FCFA/mois", competences: ["Créativité", "Logiciels graphiques", "Esthétique", "Écoute client"], niveauMinimum: "Bac+2 à Bac+5" },
  { nom: "Commercial / Représentant de vente", description: "Vend des produits et développe le portefeuille client.",
    profil: { R: 3, I: 3, A: 3, S: 7, E: 8, C: 4 }, secteur: "Vente / Commerce",
    debouches: "Télécoms, FMCG (Nestlé, Unilever), banques, assurances, industrie.",
    salaire: "200 000 + commissions – 1 500 000 FCFA/mois", competences: ["Persuasion", "Écoute", "Négociation", "Résistance"], niveauMinimum: "Bac à Bac+3" },
  { nom: "Psychologue / Conseiller d'orientation", description: "Accompagne les personnes dans leurs difficultés et leur projet de vie.",
    profil: { R: 1, I: 7, A: 4, S: 9, E: 3, C: 3 }, secteur: "Accompagnement / Santé mentale",
    debouches: "Établissements scolaires, ONG, structures de santé, cabinets privés.",
    salaire: "250 000 – 1 200 000 FCFA/mois", competences: ["Écoute", "Empathie", "Confidentialité", "Analyse"], niveauMinimum: "Bac+5" },
  { nom: "Technicien de laboratoire", description: "Réalise des analyses et expérimentations scientifiques.",
    profil: { R: 7, I: 8, A: 2, S: 3, E: 2, C: 6 }, secteur: "Sciences / Laboratoire",
    debouches: "Hôpitaux, industries agroalimentaires, instituts de recherche, contrôle qualité.",
    salaire: "180 000 – 600 000 FCFA/mois", competences: ["Rigueur", "Précision", "Observation", "Méthode"], niveauMinimum: "Bac+2 à Bac+3" },
];

// Liens filière ↔ métier (par nom)
const FILIERE_METIER_LINKS: Array<[string, string]> = [
  ["Informatique & Génie Logiciel", "Développeur informatique"],
  ["Informatique & Génie Logiciel", "Ingénieur électricien"],
  ["Informatique & Génie Logiciel", "Designer graphique"],
  ["Génie Civil & BTP", "Ingénieur civil / BTP"],
  ["Génie Civil & BTP", "Architecte"],
  ["Médecine & Sciences de la Santé", "Médecin généraliste"],
  ["Médecine & Sciences de la Santé", "Infirmier / Infirmière"],
  ["Médecine & Sciences de la Santé", "Psychologue / Conseiller d'orientation"],
  ["Sciences Économiques & Gestion", "Économiste / Analyste"],
  ["Sciences Économiques & Gestion", "Entrepreneur / Créateur d'entreprise"],
  ["Sciences Économiques & Gestion", "Commercial / Représentant de vente"],
  ["Droit & Sciences Juridiques", "Avocat / Juriste d'entreprise"],
  ["Droit & Sciences Juridiques", "Administrateur civil"],
  ["Marketing & Commerce", "Chargé de marketing"],
  ["Marketing & Commerce", "Commercial / Représentant de vente"],
  ["Marketing & Commerce", "Designer graphique"],
  ["Architecture & Beaux-Arts", "Architecte"],
  ["Architecture & Beaux-Arts", "Designer graphique"],
  ["Communication & Journalisme", "Journaliste / Rédacteur"],
  ["Communication & Journalisme", "Chargé de marketing"],
  ["Agronomie & Sciences Agricoles", "Ingénieur agronome"],
  ["Électrotechnique & Électronique", "Ingénieur électricien"],
  ["Électrotechnique & Électronique", "Technicien de laboratoire"],
  ["Comptabilité & Finance", "Comptable / Expert-comptable"],
  ["Comptabilité & Finance", "Économiste / Analyste"],
  ["Enseignement & Sciences de l'Éducation", "Enseignant / Professeur"],
  ["Enseignement & Sciences de l'Éducation", "Psychologue / Conseiller d'orientation"],
  ["Géologie & Mines", "Géologue / Ingénieur des mines"],
  ["Géologie & Mines", "Technicien de laboratoire"],
  ["Lettres Modernes & Langues", "Journaliste / Rédacteur"],
  ["Lettres Modernes & Langues", "Enseignant / Professeur"],
  ["Management Public & Administration", "Administrateur civil"],
  ["Management Public & Administration", "Avocat / Juriste d'entreprise"],
];

const INTENTIONS: Array<{ libelle: string; description: string }> = [
  { libelle: "salutation", description: "Bonjour, bonsoir, salut — accueil de l'utilisateur." },
  { libelle: "recherche_filiere", description: "Recherche d'information sur une filière d'études." },
  { libelle: "recherche_metier", description: "Recherche d'information sur un métier." },
  { libelle: "demande_debouches", description: "Question sur les débouchés d'une filière ou métier." },
  { libelle: "demande_recommandation", description: "Demande de recommandation personnalisée." },
  { libelle: "demande_test_riasec", description: "Demande de passer le test RIASEC." },
  { libelle: "consultation_profil", description: "Consultation de son propre profil et scores RIASEC." },
  { libelle: "aide_conseiller", description: "Demande de mise en relation avec un conseiller humain." },
  { libelle: "remerciement", description: "Merci, super — remerciements." },
  { libelle: "information_generale", description: "Question générale sur le fonctionnement ou autre." },
  { libelle: "demarrage_profil", description: "Démarrage ou mise à jour du profil utilisateur." },
];

async function main() {
  console.log("🧹 Nettoyage de la base...");
  await db.demandeConseiller.deleteMany();
  await db.recommandation.deleteMany();
  await db.interaction.deleteMany();
  await db.session.deleteMany();
  await db.questionRiasec.deleteMany();
  await db.intention.deleteMany();
  await db.filiereMetier.deleteMany();
  await db.metier.deleteMany();
  await db.utilisateur.deleteMany();
  await db.filiere.deleteMany();

  console.log("📌 Création des intentions...");
  for (const it of INTENTIONS) {
    await db.intention.create({ data: { libelle: it.libelle, description: it.description } });
  }

  console.log("❓ Création des questions RIASEC...");
  for (const q of RIASEC_QUESTIONS) {
    await db.questionRiasec.create({
      data: { dimension: q.dimension, ordre: q.ordre, enonce: q.enonce },
    });
  }

  console.log("🎓 Création des filières...");
  const filiereByName: Record<string, string> = {};
  for (const f of FILIERES) {
    const created = await db.filiere.create({
      data: {
        nom: f.nom,
        description: f.description,
        profilRealiste: f.profil.R,
        profilInvestigateur: f.profil.I,
        profilArtistique: f.profil.A,
        profilSocial: f.profil.S,
        profilEntreprenant: f.profil.E,
        profilConventionnel: f.profil.C,
        conditionsAcces: f.conditionsAcces,
        etablissementsDisponibles: f.etablissements.join(" | "),
        duree: f.duree,
        debouchesText: f.debouches,
        domaines: f.domaines.join("|"),
      },
    });
    filiereByName[f.nom] = created.id;
  }

  console.log("💼 Création des métiers...");
  const metierByName: Record<string, string> = {};
  for (const m of METIERS) {
    const created = await db.metier.create({
      data: {
        nom: m.nom,
        description: m.description,
        profilRealiste: m.profil.R,
        profilInvestigateur: m.profil.I,
        profilArtistique: m.profil.A,
        profilSocial: m.profil.S,
        profilEntreprenant: m.profil.E,
        profilConventionnel: m.profil.C,
        secteurActivite: m.secteur,
        descriptionDebouches: m.debouches,
        salaireMoyen: m.salaire,
        competencesCles: m.competences.join("|"),
        niveauMinimum: m.niveauMinimum,
      },
    });
    metierByName[m.nom] = created.id;
  }

  console.log("🔗 Création des liens filière ↔ métier...");
  for (const [fNom, mNom] of FILIERE_METIER_LINKS) {
    const fId = filiereByName[fNom];
    const mId = metierByName[mNom];
    if (fId && mId) {
      await db.filiereMetier.create({ data: { filiereId: fId, metierId: mId } });
    }
  }

  console.log("✅ Seed terminé !");
  console.log(`   - ${FILIERES.length} filières`);
  console.log(`   - ${METIERS.length} métiers`);
  console.log(`   - ${FILIERE_METIER_LINKS.length} liens filière ↔ métier`);
  console.log(`   - ${INTENTIONS.length} intentions`);
  console.log(`   - ${RIASEC_QUESTIONS.length} questions RIASEC`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur de seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

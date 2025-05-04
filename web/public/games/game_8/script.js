// Variables du jeu
let currentWord = "";
let currentPhrase = "";
let isPlural = false;
let score = 0;
let roundCount = 0;
const MAX_ROUNDS = 10;
let gameStartTime = 0;
let combinations = [];
let usedCombinationsIndices = [];

// Éléments DOM
let wordDisplayElement;
let leftTextElement;
let rightTextElement;
let leftChoiceElement;
let rightChoiceElement;
let leftCloudElement;
let rightCloudElement;
let leftRocksElement;
let rightRocksElement;
let leftResultElement;
let rightResultElement;

// Liste de 150 combinaisons
const wordPairs = [
    // 1-15: adjectifs communs
    { singular: "Un fauteuil", plural: "Des tables", adjective: "rouge", adjFem: "rouge", adjMasc: "rouge", adjPlur: "rouges" },
    { singular: "Une chaise", plural: "Des livres", adjective: "petit", adjFem: "petite", adjMasc: "petit", adjPlur: "petits" },
    { singular: "Un livre", plural: "Des portes", adjective: "grand", adjFem: "grande", adjMasc: "grand", adjPlur: "grandes" },
    { singular: "Une fenêtre", plural: "Des tableaux", adjective: "blanc", adjFem: "blanche", adjMasc: "blanc", adjPlur: "blancs" },
    { singular: "Un téléphone", plural: "Des chaussures", adjective: "noir", adjFem: "noire", adjMasc: "noir", adjPlur: "noires" },
    { singular: "Une tasse", plural: "Des crayons", adjective: "bleu", adjFem: "bleue", adjMasc: "bleu", adjPlur: "bleus" },
    { singular: "Un stylo", plural: "Des fleurs", adjective: "vert", adjFem: "verte", adjMasc: "vert", adjPlur: "vertes" },
    { singular: "Une maison", plural: "Des gâteaux", adjective: "joli", adjFem: "jolie", adjMasc: "joli", adjPlur: "jolis" },
    { singular: "Un ballon", plural: "Des écharpes", adjective: "jaune", adjFem: "jaune", adjMasc: "jaune", adjPlur: "jaunes" },
    { singular: "Une voiture", plural: "Des jouets", adjective: "neuf", adjFem: "neuve", adjMasc: "neuf", adjPlur: "neufs" },
    { singular: "Un chat", plural: "Des robes", adjective: "gris", adjFem: "grise", adjMasc: "gris", adjPlur: "grises" },
    { singular: "Une souris", plural: "Des manteaux", adjective: "brun", adjFem: "brune", adjMasc: "brun", adjPlur: "bruns" },
    { singular: "Un oiseau", plural: "Des valises", adjective: "léger", adjFem: "légère", adjMasc: "léger", adjPlur: "légères" },
    { singular: "Une tortue", plural: "Des vélos", adjective: "lent", adjFem: "lente", adjMasc: "lent", adjPlur: "lents" },
    { singular: "Un journal", plural: "Des lettres", adjective: "vieux", adjFem: "vieille", adjMasc: "vieux", adjPlur: "vieilles" },

    // 16-30: objets de la classe
    { singular: "Un cahier", plural: "Des règles", adjective: "cassé", adjFem: "cassée", adjMasc: "cassé", adjPlur: "cassées" },
    { singular: "Une gomme", plural: "Des crayons", adjective: "propre", adjFem: "propre", adjMasc: "propre", adjPlur: "propres" },
    { singular: "Un classeur", plural: "Des feuilles", adjective: "plein", adjFem: "pleine", adjMasc: "plein", adjPlur: "pleines" },
    { singular: "Une trousse", plural: "Des cahiers", adjective: "vide", adjFem: "vide", adjMasc: "vide", adjPlur: "vides" },
    { singular: "Un cartable", plural: "Des dictionnaires", adjective: "lourd", adjFem: "lourde", adjMasc: "lourd", adjPlur: "lourds" },
    { singular: "Une horloge", plural: "Des livres", adjective: "ancien", adjFem: "ancienne", adjMasc: "ancien", adjPlur: "anciens" },
    { singular: "Un tableau", plural: "Des étagères", adjective: "sale", adjFem: "sale", adjMasc: "sale", adjPlur: "sales" },
    { singular: "Une calculatrice", plural: "Des ordinateurs", adjective: "moderne", adjFem: "moderne", adjMasc: "moderne", adjPlur: "modernes" },
    { singular: "Un pupitre", plural: "Des chaises", adjective: "solide", adjFem: "solide", adjMasc: "solide", adjPlur: "solides" },
    { singular: "Une craie", plural: "Des cahiers", adjective: "utile", adjFem: "utile", adjMasc: "utile", adjPlur: "utiles" },
    { singular: "Un pinceau", plural: "Des ciseaux", adjective: "pointu", adjFem: "pointue", adjMasc: "pointu", adjPlur: "pointus" },
    { singular: "Une feuille", plural: "Des stylos", adjective: "perdu", adjFem: "perdue", adjMasc: "perdu", adjPlur: "perdus" },
    { singular: "Un globe", plural: "Des dictionnaires", adjective: "important", adjFem: "importante", adjMasc: "important", adjPlur: "importants" },
    { singular: "Une éponge", plural: "Des craies", adjective: "sec", adjFem: "sèche", adjMasc: "sec", adjPlur: "sèches" },
    { singular: "Un taille-crayon", plural: "Des gommes", adjective: "pratique", adjFem: "pratique", adjMasc: "pratique", adjPlur: "pratiques" },

    // 31-45: animaux
    { singular: "Un chien", plural: "Des poules", adjective: "gentil", adjFem: "gentille", adjMasc: "gentil", adjPlur: "gentilles" },
    { singular: "Une abeille", plural: "Des papillons", adjective: "petit", adjFem: "petite", adjMasc: "petit", adjPlur: "petits" },
    { singular: "Un lion", plural: "Des girafes", adjective: "grand", adjFem: "grande", adjMasc: "grand", adjPlur: "grandes" },
    { singular: "Une fourmi", plural: "Des canards", adjective: "minuscule", adjFem: "minuscule", adjMasc: "minuscule", adjPlur: "minuscules" },
    { singular: "Un éléphant", plural: "Des baleines", adjective: "énorme", adjFem: "énorme", adjMasc: "énorme", adjPlur: "énormes" },
    { singular: "Une girafe", plural: "Des dinosaures", adjective: "géant", adjFem: "géante", adjMasc: "géant", adjPlur: "géants" },
    { singular: "Un lapin", plural: "Des tortues", adjective: "rapide", adjFem: "rapide", adjMasc: "rapide", adjPlur: "rapides" },
    { singular: "Une vache", plural: "Des chameaux", adjective: "calme", adjFem: "calme", adjMasc: "calme", adjPlur: "calmes" },
    { singular: "Un cheval", plural: "Des zèbres", adjective: "sauvage", adjFem: "sauvage", adjMasc: "sauvage", adjPlur: "sauvages" },
    { singular: "Une mouche", plural: "Des fourmis", adjective: "noir", adjFem: "noire", adjMasc: "noir", adjPlur: "noires" },
    { singular: "Un poisson", plural: "Des grenouilles", adjective: "coloré", adjFem: "colorée", adjMasc: "coloré", adjPlur: "colorées" },
    { singular: "Une baleine", plural: "Des requins", adjective: "dangereux", adjFem: "dangereuse", adjMasc: "dangereux", adjPlur: "dangereux" },
    { singular: "Un tigre", plural: "Des panthères", adjective: "féroce", adjFem: "féroce", adjMasc: "féroce", adjPlur: "féroces" },
    { singular: "Une grenouille", plural: "Des serpents", adjective: "vert", adjFem: "verte", adjMasc: "vert", adjPlur: "verts" },
    { singular: "Un panda", plural: "Des koalas", adjective: "doux", adjFem: "douce", adjMasc: "doux", adjPlur: "doux" },

    // 46-60: vêtements
    { singular: "Un pantalon", plural: "Des chemises", adjective: "propre", adjFem: "propre", adjMasc: "propre", adjPlur: "propres" },
    { singular: "Une jupe", plural: "Des chaussettes", adjective: "sale", adjFem: "sale", adjMasc: "sale", adjPlur: "sales" },
    { singular: "Un tee-shirt", plural: "Des jupes", adjective: "neuf", adjFem: "neuve", adjMasc: "neuf", adjPlur: "neuves" },
    { singular: "Une robe", plural: "Des manteaux", adjective: "long", adjFem: "longue", adjMasc: "long", adjPlur: "longs" },
    { singular: "Un chapeau", plural: "Des gants", adjective: "chaud", adjFem: "chaude", adjMasc: "chaud", adjPlur: "chauds" },
    { singular: "Une écharpe", plural: "Des ceintures", adjective: "large", adjFem: "large", adjMasc: "large", adjPlur: "larges" },
    { singular: "Un manteau", plural: "Des robes", adjective: "épais", adjFem: "épaisse", adjMasc: "épais", adjPlur: "épaisses" },
    { singular: "Une casquette", plural: "Des shorts", adjective: "blanc", adjFem: "blanche", adjMasc: "blanc", adjPlur: "blancs" },
    { singular: "Un short", plural: "Des blouses", adjective: "court", adjFem: "courte", adjMasc: "court", adjPlur: "courtes" },
    { singular: "Une chaussette", plural: "Des écharpes", adjective: "doux", adjFem: "douce", adjMasc: "doux", adjPlur: "douces" },
    { singular: "Un pull", plural: "Des vestes", adjective: "chic", adjFem: "chic", adjMasc: "chic", adjPlur: "chics" },
    { singular: "Une chemise", plural: "Des pulls", adjective: "serré", adjFem: "serrée", adjMasc: "serré", adjPlur: "serrés" },
    { singular: "Un pyjama", plural: "Des cravates", adjective: "confortable", adjFem: "confortable", adjMasc: "confortable", adjPlur: "confortables" },
    { singular: "Une chaussure", plural: "Des gants", adjective: "usé", adjFem: "usée", adjMasc: "usé", adjPlur: "usés" },
    { singular: "Un bonnet", plural: "Des chapeaux", adjective: "tricoté", adjFem: "tricotée", adjMasc: "tricoté", adjPlur: "tricotés" },

    // 61-75: fruits et légumes
    { singular: "Un citron", plural: "Des fraises", adjective: "mûr", adjFem: "mûre", adjMasc: "mûr", adjPlur: "mûres" },
    { singular: "Une pomme", plural: "Des melons", adjective: "juteux", adjFem: "juteuse", adjMasc: "juteux", adjPlur: "juteux" },
    { singular: "Un ananas", plural: "Des oranges", adjective: "acide", adjFem: "acide", adjMasc: "acide", adjPlur: "acides" },
    { singular: "Une banane", plural: "Des citrons", adjective: "jaune", adjFem: "jaune", adjMasc: "jaune", adjPlur: "jaunes" },
    { singular: "Un melon", plural: "Des pommes", adjective: "sucré", adjFem: "sucrée", adjMasc: "sucré", adjPlur: "sucrées" },
    { singular: "Une fraise", plural: "Des kiwis", adjective: "petit", adjFem: "petite", adjMasc: "petit", adjPlur: "petits" },
    { singular: "Un kiwi", plural: "Des bananes", adjective: "vert", adjFem: "verte", adjMasc: "vert", adjPlur: "vertes" },
    { singular: "Une orange", plural: "Des ananas", adjective: "frais", adjFem: "fraîche", adjMasc: "frais", adjPlur: "frais" },
    { singular: "Un concombre", plural: "Des carottes", adjective: "croquant", adjFem: "croquante", adjMasc: "croquant", adjPlur: "croquantes" },
    { singular: "Une tomate", plural: "Des poireaux", adjective: "rouge", adjFem: "rouge", adjMasc: "rouge", adjPlur: "rouges" },
    { singular: "Un poireau", plural: "Des tomates", adjective: "long", adjFem: "longue", adjMasc: "long", adjPlur: "longues" },
    { singular: "Une carotte", plural: "Des concombres", adjective: "sain", adjFem: "saine", adjMasc: "sain", adjPlur: "sains" },
    { singular: "Un brocoli", plural: "Des pommes de terre", adjective: "cuit", adjFem: "cuite", adjMasc: "cuit", adjPlur: "cuites" },
    { singular: "Une salade", plural: "Des champignons", adjective: "frais", adjFem: "fraîche", adjMasc: "frais", adjPlur: "frais" },
    { singular: "Un champignon", plural: "Des salades", adjective: "délicieux", adjFem: "délicieuse", adjMasc: "délicieux", adjPlur: "délicieuses" },

    // 76-90: objets de la maison
    { singular: "Un canapé", plural: "Des tables", adjective: "confortable", adjFem: "confortable", adjMasc: "confortable", adjPlur: "confortables" },
    { singular: "Une lampe", plural: "Des téléviseurs", adjective: "allumé", adjFem: "allumée", adjMasc: "allumé", adjPlur: "allumés" },
    { singular: "Un miroir", plural: "Des fenêtres", adjective: "propre", adjFem: "propre", adjMasc: "propre", adjPlur: "propres" },
    { singular: "Une armoire", plural: "Des lits", adjective: "grand", adjFem: "grande", adjMasc: "grand", adjPlur: "grands" },
    { singular: "Un lit", plural: "Des étagères", adjective: "large", adjFem: "large", adjMasc: "large", adjPlur: "larges" },
    { singular: "Une cheminée", plural: "Des fauteuils", adjective: "chaud", adjFem: "chaude", adjMasc: "chaud", adjPlur: "chauds" },
    { singular: "Un four", plural: "Des cafetières", adjective: "électrique", adjFem: "électrique", adjMasc: "électrique", adjPlur: "électriques" },
    { singular: "Une assiette", plural: "Des verres", adjective: "cassé", adjFem: "cassée", adjMasc: "cassé", adjPlur: "cassés" },
    { singular: "Un verre", plural: "Des assiettes", adjective: "transparent", adjFem: "transparente", adjMasc: "transparent", adjPlur: "transparentes" },
    { singular: "Une fourchette", plural: "Des couteaux", adjective: "pointu", adjFem: "pointue", adjMasc: "pointu", adjPlur: "pointus" },
    { singular: "Un oreiller", plural: "Des couvertures", adjective: "moelleux", adjFem: "moelleuse", adjMasc: "moelleux", adjPlur: "moelleuses" },
    { singular: "Une télévision", plural: "Des radios", adjective: "moderne", adjFem: "moderne", adjMasc: "moderne", adjPlur: "modernes" },
    { singular: "Un frigo", plural: "Des poêles", adjective: "froid", adjFem: "froide", adjMasc: "froid", adjPlur: "froides" },
    { singular: "Une douche", plural: "Des baignoires", adjective: "propre", adjFem: "propre", adjMasc: "propre", adjPlur: "propres" },
    { singular: "Un tapis", plural: "Des rideaux", adjective: "coloré", adjFem: "colorée", adjMasc: "coloré", adjPlur: "colorés" },

    // 91-105: métiers
    { singular: "Un boulanger", plural: "Des coiffeurs", adjective: "occupé", adjFem: "occupée", adjMasc: "occupé", adjPlur: "occupés" },
    { singular: "Une infirmière", plural: "Des médecins", adjective: "attentif", adjFem: "attentive", adjMasc: "attentif", adjPlur: "attentifs" },
    { singular: "Un cuisinier", plural: "Des professeurs", adjective: "talentueux", adjFem: "talentueuse", adjMasc: "talentueux", adjPlur: "talentueux" },
    { singular: "Une policière", plural: "Des pompiers", adjective: "courageux", adjFem: "courageuse", adjMasc: "courageux", adjPlur: "courageux" },
    { singular: "Un dentiste", plural: "Des vétérinaires", adjective: "précis", adjFem: "précise", adjMasc: "précis", adjPlur: "précises" },
    { singular: "Une actrice", plural: "Des chanteurs", adjective: "célèbre", adjFem: "célèbre", adjMasc: "célèbre", adjPlur: "célèbres" },
    { singular: "Un pilote", plural: "Des astronautes", adjective: "expérimenté", adjFem: "expérimentée", adjMasc: "expérimenté", adjPlur: "expérimentés" },
    { singular: "Une jardinière", plural: "Des facteurs", adjective: "soigneux", adjFem: "soigneuse", adjMasc: "soigneux", adjPlur: "soigneux" },
    { singular: "Un professeur", plural: "Des bibliothécaires", adjective: "patient", adjFem: "patiente", adjMasc: "patient", adjPlur: "patientes" },
    { singular: "Une avocate", plural: "Des juges", adjective: "intelligent", adjFem: "intelligente", adjMasc: "intelligent", adjPlur: "intelligents" },
    { singular: "Un architecte", plural: "Des ingénieurs", adjective: "créatif", adjFem: "créative", adjMasc: "créatif", adjPlur: "créatifs" },
    { singular: "Une danseuse", plural: "Des musiciens", adjective: "gracieux", adjFem: "gracieuse", adjMasc: "gracieux", adjPlur: "gracieux" },
    { singular: "Un pêcheur", plural: "Des agriculteurs", adjective: "travailleur", adjFem: "travailleuse", adjMasc: "travailleur", adjPlur: "travailleurs" },
    { singular: "Une boulangère", plural: "Des couturières", adjective: "habile", adjFem: "habile", adjMasc: "habile", adjPlur: "habiles" },
    { singular: "Un footballeur", plural: "Des nageurs", adjective: "rapide", adjFem: "rapide", adjMasc: "rapide", adjPlur: "rapides" },

    // 106-120: adjectifs supplémentaires
    { singular: "Un chemin", plural: "Des routes", adjective: "long", adjFem: "longue", adjMasc: "long", adjPlur: "longues" },
    { singular: "Une personne", plural: "Des enfants", adjective: "joyeux", adjFem: "joyeuse", adjMasc: "joyeux", adjPlur: "joyeux" },
    { singular: "Un nuage", plural: "Des montagnes", adjective: "blanc", adjFem: "blanche", adjMasc: "blanc", adjPlur: "blanches" },
    { singular: "Une histoire", plural: "Des contes", adjective: "amusant", adjFem: "amusante", adjMasc: "amusant", adjPlur: "amusants" },
    { singular: "Un ami", plural: "Des cousins", adjective: "fidèle", adjFem: "fidèle", adjMasc: "fidèle", adjPlur: "fidèles" },
    { singular: "Une idée", plural: "Des projets", adjective: "brillant", adjFem: "brillante", adjMasc: "brillant", adjPlur: "brillants" },
    { singular: "Un problème", plural: "Des situations", adjective: "difficile", adjFem: "difficile", adjMasc: "difficile", adjPlur: "difficiles" },
    { singular: "Une solution", plural: "Des réponses", adjective: "évident", adjFem: "évidente", adjMasc: "évident", adjPlur: "évidentes" },
    { singular: "Un projet", plural: "Des idées", adjective: "ambitieux", adjFem: "ambitieuse", adjMasc: "ambitieux", adjPlur: "ambitieuses" },
    { singular: "Une décision", plural: "Des choix", adjective: "important", adjFem: "importante", adjMasc: "important", adjPlur: "importants" },
    { singular: "Un rêve", plural: "Des espoirs", adjective: "fou", adjFem: "folle", adjMasc: "fou", adjPlur: "fous" },
    { singular: "Une chanson", plural: "Des poèmes", adjective: "beau", adjFem: "belle", adjMasc: "beau", adjPlur: "beaux" },
    { singular: "Un sentiment", plural: "Des émotions", adjective: "fort", adjFem: "forte", adjMasc: "fort", adjPlur: "fortes" },
    { singular: "Une pensée", plural: "Des opinions", adjective: "profond", adjFem: "profonde", adjMasc: "profond", adjPlur: "profondes" },
    { singular: "Un souvenir", plural: "Des moments", adjective: "précieux", adjFem: "précieuse", adjMasc: "précieux", adjPlur: "précieux" },

    // 121-135: lieux et espaces
    { singular: "Un parc", plural: "Des jardins", adjective: "verdoyant", adjFem: "verdoyante", adjMasc: "verdoyant", adjPlur: "verdoyants" },
    { singular: "Une plage", plural: "Des montagnes", adjective: "magnifique", adjFem: "magnifique", adjMasc: "magnifique", adjPlur: "magnifiques" },
    { singular: "Un musée", plural: "Des galeries", adjective: "intéressant", adjFem: "intéressante", adjMasc: "intéressant", adjPlur: "intéressantes" },
    { singular: "Une forêt", plural: "Des prairies", adjective: "dense", adjFem: "dense", adjMasc: "dense", adjPlur: "denses" },
    { singular: "Un château", plural: "Des palais", adjective: "ancien", adjFem: "ancienne", adjMasc: "ancien", adjPlur: "anciens" },
    { singular: "Une école", plural: "Des universités", adjective: "grand", adjFem: "grande", adjMasc: "grand", adjPlur: "grandes" },
    { singular: "Un hôpital", plural: "Des cliniques", adjective: "moderne", adjFem: "moderne", adjMasc: "moderne", adjPlur: "modernes" },
    { singular: "Une rue", plural: "Des avenues", adjective: "étroit", adjFem: "étroite", adjMasc: "étroit", adjPlur: "étroites" },
    { singular: "Un magasin", plural: "Des boutiques", adjective: "ouvert", adjFem: "ouverte", adjMasc: "ouvert", adjPlur: "ouvertes" },
    { singular: "Une gare", plural: "Des aéroports", adjective: "bondé", adjFem: "bondée", adjMasc: "bondé", adjPlur: "bondés" },
    { singular: "Un cinéma", plural: "Des théâtres", adjective: "populaire", adjFem: "populaire", adjMasc: "populaire", adjPlur: "populaires" },
    { singular: "Une bibliothèque", plural: "Des librairies", adjective: "silencieux", adjFem: "silencieuse", adjMasc: "silencieux", adjPlur: "silencieuses" },
    { singular: "Un restaurant", plural: "Des cafés", adjective: "délicieux", adjFem: "délicieuse", adjMasc: "délicieux", adjPlur: "délicieux" },
    { singular: "Une piscine", plural: "Des stades", adjective: "olympique", adjFem: "olympique", adjMasc: "olympique", adjPlur: "olympiques" },
    { singular: "Un pont", plural: "Des tunnels", adjective: "dangereux", adjFem: "dangereuse", adjMasc: "dangereux", adjPlur: "dangereux" },

    // 136-150: véhicules et transports
    { singular: "Un vélo", plural: "Des trottinettes", adjective: "rapide", adjFem: "rapide", adjMasc: "rapide", adjPlur: "rapides" },
    { singular: "Une voiture", plural: "Des camions", adjective: "puissant", adjFem: "puissante", adjMasc: "puissant", adjPlur: "puissants" },
    { singular: "Un avion", plural: "Des hélicoptères", adjective: "bruyant", adjFem: "bruyante", adjMasc: "bruyant", adjPlur: "bruyants" },
    { singular: "Une moto", plural: "Des vélos", adjective: "léger", adjFem: "légère", adjMasc: "léger", adjPlur: "légers" },
    { singular: "Un train", plural: "Des tramways", adjective: "électrique", adjFem: "électrique", adjMasc: "électrique", adjPlur: "électriques" },
    { singular: "Une fusée", plural: "Des satellites", adjective: "spatial", adjFem: "spatiale", adjMasc: "spatial", adjPlur: "spatiaux" },
    { singular: "Un bateau", plural: "Des canots", adjective: "amarré", adjFem: "amarrée", adjMasc: "amarré", adjPlur: "amarrés" },
    { singular: "Une barque", plural: "Des péniches", adjective: "petit", adjFem: "petite", adjMasc: "petit", adjPlur: "petites" },
    { singular: "Un sous-marin", plural: "Des bateaux", adjective: "jaune", adjFem: "jaune", adjMasc: "jaune", adjPlur: "jaunes" },
    { singular: "Une ambulance", plural: "Des taxis", adjective: "urgent", adjFem: "urgente", adjMasc: "urgent", adjPlur: "urgents" },
    { singular: "Un bus", plural: "Des métros", adjective: "ponctuel", adjFem: "ponctuelle", adjMasc: "ponctuel", adjPlur: "ponctuels" },
    { singular: "Une navette", plural: "Des tramways", adjective: "automatique", adjFem: "automatique", adjMasc: "automatique", adjPlur: "automatiques" },
    { singular: "Un camion", plural: "Des tracteurs", adjective: "lourd", adjFem: "lourde", adjMasc: "lourd", adjPlur: "lourds" },
    { singular: "Une montgolfière", plural: "Des planeurs", adjective: "coloré", adjFem: "colorée", adjMasc: "coloré", adjPlur: "colorés" },
    { singular: "Un scooter", plural: "Des motos", adjective: "neuf", adjFem: "neuve", adjMasc: "neuf", adjPlur: "neuves" }
];

// Fonction d'initialisation (OBLIGATOIRE)
function initGame() {
    console.log('Initialisation du mini-jeu Singulier ou Pluriel');
    
    // 1. Récupérer les références aux éléments DOM
    wordDisplayElement = document.getElementById('word-display');
    leftTextElement = document.getElementById('left-text');
    rightTextElement = document.getElementById('right-text');
    leftChoiceElement = document.getElementById('left-choice');
    rightChoiceElement = document.getElementById('right-choice');
    leftCloudElement = document.getElementById('left-cloud');
    rightCloudElement = document.getElementById('right-cloud');
    leftRocksElement = document.getElementById('left-rocks');
    rightRocksElement = document.getElementById('right-rocks');
    leftResultElement = document.getElementById('left-result');
    rightResultElement = document.getElementById('right-result');
    
    // 2. Configurer l'état initial du jeu
    resetGame();
    
    // 3. Ajouter les écouteurs d'événements
    leftChoiceElement.addEventListener('click', () => handleChoice('left'));
    rightChoiceElement.addEventListener('click', () => handleChoice('right'));
}

// Fonction de démarrage du jeu
function startGame() {
    // Initialiser le temps de départ
    gameStartTime = Date.now();
    
    // Copier toutes les combinaisons dans le tableau de travail
    combinations = [...wordPairs];
    
    // Vider le tableau des indices utilisés
    usedCombinationsIndices = [];
    
    // Initialiser le score et le compteur de tours
    score = 0;
    roundCount = 0;
    
    // Mettre à jour le score dans la barre supérieure
    updatetopbar_score(score);
    
    // Démarrer le premier tour
    nextRound();
}

// Fonction pour passer au tour suivant
function nextRound() {
    if (roundCount >= MAX_ROUNDS) {
        endGameWithResults();
        return;
    }
    
    roundCount++;
    
    // Réinitialiser l'affichage
    resetDisplay();
    
    // Sélectionner une combinaison aléatoire non utilisée
    const randomIndex = getRandomUnusedIndex();
    usedCombinationsIndices.push(randomIndex);
    
    const combination = combinations[randomIndex];
    
    // Décider aléatoirement si on montre l'adjectif singulier ou pluriel, masculin ou féminin
    isPlural = Math.random() >= 0.5;
    
    // Déterminer quel adjectif afficher
    if (isPlural) {
        currentWord = combination.adjPlur;
        // Phrase à trou au pluriel
        currentPhrase = combination.plural + " ___";
    } else {
        // Vérifier s'il s'agit d'un mot masculin ou féminin
        if (combination.singular.startsWith("Un ")) {
            currentWord = combination.adjMasc;
        } else {
            currentWord = combination.adjFem;
        }
        // Phrase à trou au singulier
        currentPhrase = combination.singular + " ___";
    }
    
    // Afficher l'adjectif
    wordDisplayElement.textContent = currentWord;
    
    // Décider aléatoirement si la bonne réponse est à gauche ou à droite
    const correctSide = Math.random() >= 0.5 ? 'left' : 'right';
    
    // Phrase à trou correspondant à l'autre option (pas la bonne)
    let wrongPhrase;
    if (isPlural) {
        wrongPhrase = combination.singular + " ___";
    } else {
        wrongPhrase = combination.plural + " ___";
    }
    
    if (correctSide === 'left') {
        leftTextElement.textContent = currentPhrase;
        rightTextElement.textContent = wrongPhrase;
        
        // Configurer les éléments visuels
        leftRocksElement.style.display = 'none';
        rightRocksElement.style.display = 'block';
    } else {
        rightTextElement.textContent = currentPhrase;
        leftTextElement.textContent = wrongPhrase;
        
        // Configurer les éléments visuels
        leftRocksElement.style.display = 'block';
        rightRocksElement.style.display = 'none';
    }
}

// Fonction pour gérer le choix du joueur
function handleChoice(side) {
    const correctSide = leftRocksElement.style.display === 'none' ? 'left' : 'right';
    const isCorrect = side === correctSide;
    
    // Mettre à jour le score
    if (isCorrect) {
        score += 10;
    } else {
        score = Math.max(0, score - 10); // Éviter les scores négatifs
    }
    
    // Mettre à jour le score dans la barre supérieure
    updatetopbar_score(score);
    
    // Afficher le résultat
    showResult(side, isCorrect);
    
    // Passer au tour suivant après un délai
    setTimeout(() => {
        nextRound();
    }, 1000);
}

// Fonction pour afficher le résultat
function showResult(side, isCorrect) {
    // Révéler ce qui se cache derrière les nuages
    leftCloudElement.style.display = 'none';
    rightCloudElement.style.display = 'none';
    
    // Afficher le symbole de résultat
    if (side === 'left') {
        leftResultElement.textContent = isCorrect ? '✅' : '❌';
        leftResultElement.style.display = 'block';
    } else {
        rightResultElement.textContent = isCorrect ? '✅' : '❌';
        rightResultElement.style.display = 'block';
    }
}

// Fonction pour réinitialiser l'affichage pour le prochain tour
function resetDisplay() {
    // Réinitialiser les nuages et les résultats
    leftCloudElement.style.display = 'block';
    rightCloudElement.style.display = 'block';
    leftResultElement.style.display = 'none';
    rightResultElement.style.display = 'none';
}

// Fonction pour obtenir un index aléatoire non utilisé
function getRandomUnusedIndex() {
    // Si tous les indices ont été utilisés, réinitialiser
    if (usedCombinationsIndices.length >= combinations.length) {
        usedCombinationsIndices = [];
    }
    
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * combinations.length);
    } while (usedCombinationsIndices.includes(randomIndex));
    
    return randomIndex;
}

// Fonction pour terminer le jeu (OBLIGATOIRE)
function endGameWithResults() {
    // 1. Arrêter les timers ou animations en cours
    
    // 2. Calculer le score final et le temps écoulé
    const tempsEcoule = Math.ceil((Date.now() - gameStartTime) / 1000);
    
    // 3. Appeler la fonction endGame du template
    window.GameEnd.endGame({
        score: score,            // Score obtenu
        maxScore: MAX_ROUNDS * 10, // Score maximum possible (10 points par tour)
        timeSpent: tempsEcoule   // Temps écoulé en secondes
    }, resetGame);
}

// Fonction de réinitialisation du jeu (OBLIGATOIRE)
function resetGame() {
    // Réinitialiser les variables du jeu
    score = 0;
    roundCount = 0;
    
    // Démarrer le jeu
    startGame();
}
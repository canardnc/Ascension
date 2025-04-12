// Variables pour la logique de jeu
let currentPhrase = null; // Phrase actuelle
let selectedCategory = null; // Catégorie grammaticale sélectionnée
let selectedWords = []; // Mots déjà sélectionnés dans le tour actuel
let correctWords = []; // Mots attendus pour la réponse correcte
let allWordsDone = false; // Indique si tous les mots ont été catégorisés (niveau 3)// Sélectionner une phrase aléatoire non utilisée
function getRandomPhrase(level) {
    // Sélectionner le bon tableau de phrases selon le niveau
    const phrases = level === 1 ? phrasesLevel1 : phrasesLevel2;
    const usedIndexes = level === 1 ? usedIndexesLevel1 : usedIndexesLevel2;
    
    console.log("Nombre de phrases disponibles:", phrases.length);
    console.log("Indices déjà utilisés:", usedIndexes);
    
    // Si toutes les phrases ont été utilisées, réinitialiser
    if (usedIndexes.length >= phrases.length) {
        console.log("Toutes les phrases ont été utilisées, réinitialisation...");
        if (level === 1) {
            usedIndexesLevel1 = [];
        } else {
            usedIndexesLevel2 = [];
        }
        // Utiliser le tableau réinitialisé
        return getRandomPhrase(level);
    }
    
    // Créer un tableau d'indices disponibles
    const availableIndices = [];
    for (let i = 0; i < phrases.length; i++) {
        if (!usedIndexes.includes(i)) {
            availableIndices.push(i);
        }
    }
    
    console.log("Indices disponibles:", availableIndices);
    
    // Si nous n'avons pas d'indices disponibles (cas improbable)
    if (availableIndices.length === 0) {
        console.error("Erreur: pas d'indices disponibles");
        return phrases[0]; // Retourner la première phrase par défaut
    }
    
    // Sélectionner un indice aléatoire parmi ceux disponibles
    const randomPos = Math.floor(Math.random() * availableIndices.length);
    const selectedIndex = availableIndices[randomPos];
    
    console.log("Position sélectionnée:", randomPos);
    console.log("Index sélectionné:", selectedIndex);
    
    // Ajouter l'indice à la liste des indices utilisés
    if (level === 1) {
        usedIndexesLevel1.push(selectedIndex);
    } else {
        usedIndexesLevel2.push(selectedIndex);
    }
    
    // Retourner la phrase sélectionnée
    console.log("Phrase sélectionnée:", phrases[selectedIndex].text);
    return phrases[selectedIndex];
}// Variables du jeu
let currentDifficulty = 1; // Niveau de difficulté par défaut (1, 2 ou 3)
let currentScore = 0; // Score du joueur
let currentRound = 0; // Tour actuel (de 0 à 9)
let timer = null; // Référence au timer
let timeRemaining = 30; // Temps restant en secondes
let gameStartTime = null; // Heure de début de la partie
let totalTimeSpent = 0; // Temps total passé (en secondes)
let gameActive = false; // Indique si le jeu est en cours
let usedIndexesLevel1 = []; // Indices des phrases de niveau 1 déjà utilisées
let usedIndexesLevel2 = []; // Indices des phrases de niveau 2 déjà utilisées

// Éléments DOM
let phraseDisplay;
let bombImage;
let timerValue;
let progressValue;
let categoriesContainer;
let explosionEffect;

// Les catégories grammaticales avec leurs images
const categories = [
    { id: 'nom', name: 'Nom', image: '/assets/images/pince_nom.webp' },
    { id: 'determinant', name: 'Déterminant', image: '/assets/images/pince_determinant.webp' },
    { id: 'adjectif', name: 'Adjectif', image: '/assets/images/pince_adjectif.webp' },
    { id: 'verbe', name: 'Verbe', image: '/assets/images/pince_verbe.webp' },
    { id: 'adverbe', name: 'Adverbe', image: '/assets/images/pince_adverbe.webp' }
];

// Images des bombes par niveau
const bombImages = [
    '/assets/images/bomb_1.webp', // Niveau 1
    '/assets/images/bomb_2.webp', // Niveau 2
    '/assets/images/bomb_3.webp'  // Niveau 3
];

// Banque de phrases niveau 1 (plus simples)
const phrasesLevel1 = [
    {
        text: "Le chat dort.",
        words: [
            { word: "Le", category: "determinant" },
            { word: "chat", category: "nom" },
            { word: "dort", category: "verbe" }
        ]
    },
    {
        text: "Un grand arbre.",
        words: [
            { word: "Un", category: "determinant" },
            { word: "grand", category: "adjectif" },
            { word: "arbre", category: "nom" }
        ]
    },
    {
        text: "Elle marche lentement.",
        words: [
            { word: "Elle", category: "determinant" },
            { word: "marche", category: "verbe" },
            { word: "lentement", category: "adverbe" }
        ]
    },
    {
        text: "Cette fleur rouge.",
        words: [
            { word: "Cette", category: "determinant" },
            { word: "fleur", category: "nom" },
            { word: "rouge", category: "adjectif" }
        ]
    },
    {
        text: "Il court vite.",
        words: [
            { word: "Il", category: "determinant" },
            { word: "court", category: "verbe" },
            { word: "vite", category: "adverbe" }
        ]
    },
    {
        text: "Une belle journée.",
        words: [
            { word: "Une", category: "determinant" },
            { word: "belle", category: "adjectif" },
            { word: "journée", category: "nom" }
        ]
    },
    {
        text: "Mon livre neuf.",
        words: [
            { word: "Mon", category: "determinant" },
            { word: "livre", category: "nom" },
            { word: "neuf", category: "adjectif" }
        ]
    },
    {
        text: "Nous mangeons rapidement.",
        words: [
            { word: "Nous", category: "determinant" },
            { word: "mangeons", category: "verbe" },
            { word: "rapidement", category: "adverbe" }
        ]
    },
    {
        text: "Ces enfants jouent.",
        words: [
            { word: "Ces", category: "determinant" },
            { word: "enfants", category: "nom" },
            { word: "jouent", category: "verbe" }
        ]
    },
    {
        text: "Le chien aboie fort.",
        words: [
            { word: "Le", category: "determinant" },
            { word: "chien", category: "nom" },
            { word: "aboie", category: "verbe" },
            { word: "fort", category: "adverbe" }
        ]
    },
    {
        text: "Ma voiture bleue.",
        words: [
            { word: "Ma", category: "determinant" },
            { word: "voiture", category: "nom" },
            { word: "bleue", category: "adjectif" }
        ]
    },
    {
        text: "Il parle doucement.",
        words: [
            { word: "Il", category: "determinant" },
            { word: "parle", category: "verbe" },
            { word: "doucement", category: "adverbe" }
        ]
    },
    {
        text: "Les oiseaux chantent.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "oiseaux", category: "nom" },
            { word: "chantent", category: "verbe" }
        ]
    },
    {
        text: "Son petit frère.",
        words: [
            { word: "Son", category: "determinant" },
            { word: "petit", category: "adjectif" },
            { word: "frère", category: "nom" }
        ]
    },
    {
        text: "Nous marchons ensemble.",
        words: [
            { word: "Nous", category: "determinant" },
            { word: "marchons", category: "verbe" },
            { word: "ensemble", category: "adverbe" }
        ]
    },
    {
        text: "Des fleurs rouges.",
        words: [
            { word: "Des", category: "determinant" },
            { word: "fleurs", category: "nom" },
            { word: "rouges", category: "adjectif" }
        ]
    },
    {
        text: "Il neige dehors.",
        words: [
            { word: "Il", category: "determinant" },
            { word: "neige", category: "verbe" },
            { word: "dehors", category: "adverbe" }
        ]
    },
    {
        text: "Cette maison ancienne.",
        words: [
            { word: "Cette", category: "determinant" },
            { word: "maison", category: "nom" },
            { word: "ancienne", category: "adjectif" }
        ]
    },
    {
        text: "Nous travaillons bien.",
        words: [
            { word: "Nous", category: "determinant" },
            { word: "travaillons", category: "verbe" },
            { word: "bien", category: "adverbe" }
        ]
    },
    {
        text: "Le soleil brille.",
        words: [
            { word: "Le", category: "determinant" },
            { word: "soleil", category: "nom" },
            { word: "brille", category: "verbe" }
        ]
    },
    {
        text: "Ta nouvelle robe.",
        words: [
            { word: "Ta", category: "determinant" },
            { word: "nouvelle", category: "adjectif" },
            { word: "robe", category: "nom" }
        ]
    },
    {
        text: "Elle sourit joyeusement.",
        words: [
            { word: "Elle", category: "determinant" },
            { word: "sourit", category: "verbe" },
            { word: "joyeusement", category: "adverbe" }
        ]
    },
    {
        text: "Ces grandes maisons.",
        words: [
            { word: "Ces", category: "determinant" },
            { word: "grandes", category: "adjectif" },
            { word: "maisons", category: "nom" }
        ]
    },
    {
        text: "Nous lisons attentivement.",
        words: [
            { word: "Nous", category: "determinant" },
            { word: "lisons", category: "verbe" },
            { word: "attentivement", category: "adverbe" }
        ]
    },
    {
        text: "Les enfants rient.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "enfants", category: "nom" },
            { word: "rient", category: "verbe" }
        ]
    },
    {
        text: "Un joli jardin.",
        words: [
            { word: "Un", category: "determinant" },
            { word: "joli", category: "adjectif" },
            { word: "jardin", category: "nom" }
        ]
    },
    {
        text: "Elle chante merveilleusement.",
        words: [
            { word: "Elle", category: "determinant" },
            { word: "chante", category: "verbe" },
            { word: "merveilleusement", category: "adverbe" }
        ]
    },
    {
        text: "Leur vieille voiture.",
        words: [
            { word: "Leur", category: "determinant" },
            { word: "vieille", category: "adjectif" },
            { word: "voiture", category: "nom" }
        ]
    },
    {
        text: "Nous écoutons attentivement.",
        words: [
            { word: "Nous", category: "determinant" },
            { word: "écoutons", category: "verbe" },
            { word: "attentivement", category: "adverbe" }
        ]
    },
    {
        text: "Cet animal sauvage.",
        words: [
            { word: "Cet", category: "determinant" },
            { word: "animal", category: "nom" },
            { word: "sauvage", category: "adjectif" }
        ]
    },
    {
        text: "Je parle clairement.",
        words: [
            { word: "Je", category: "determinant" },
            { word: "parle", category: "verbe" },
            { word: "clairement", category: "adverbe" }
        ]
    },
    {
        text: "Les nuages gris.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "nuages", category: "nom" },
            { word: "gris", category: "adjectif" }
        ]
    },
    {
        text: "Tu écris soigneusement.",
        words: [
            { word: "Tu", category: "determinant" },
            { word: "écris", category: "verbe" },
            { word: "soigneusement", category: "adverbe" }
        ]
    },
    {
        text: "La petite souris.",
        words: [
            { word: "La", category: "determinant" },
            { word: "petite", category: "adjectif" },
            { word: "souris", category: "nom" }
        ]
    },
    {
        text: "Vous marchez lentement.",
        words: [
            { word: "Vous", category: "determinant" },
            { word: "marchez", category: "verbe" },
            { word: "lentement", category: "adverbe" }
        ]
    },
    {
        text: "Mes nouveaux amis.",
        words: [
            { word: "Mes", category: "determinant" },
            { word: "nouveaux", category: "adjectif" },
            { word: "amis", category: "nom" }
        ]
    },
    {
        text: "Elles dansent gracieusement.",
        words: [
            { word: "Elles", category: "determinant" },
            { word: "dansent", category: "verbe" },
            { word: "gracieusement", category: "adverbe" }
        ]
    },
    {
        text: "Le grand arbre.",
        words: [
            { word: "Le", category: "determinant" },
            { word: "grand", category: "adjectif" },
            { word: "arbre", category: "nom" }
        ]
    },
    {
        text: "Il réfléchit profondément.",
        words: [
            { word: "Il", category: "determinant" },
            { word: "réfléchit", category: "verbe" },
            { word: "profondément", category: "adverbe" }
        ]
    },
    {
        text: "Nos vieux livres.",
        words: [
            { word: "Nos", category: "determinant" },
            { word: "vieux", category: "adjectif" },
            { word: "livres", category: "nom" }
        ]
    },
    {
        text: "Tu marches rapidement.",
        words: [
            { word: "Tu", category: "determinant" },
            { word: "marches", category: "verbe" },
            { word: "rapidement", category: "adverbe" }
        ]
    },
    {
        text: "La lune brille.",
        words: [
            { word: "La", category: "determinant" },
            { word: "lune", category: "nom" },
            { word: "brille", category: "verbe" }
        ]
    },
    {
        text: "Ces beaux paysages.",
        words: [
            { word: "Ces", category: "determinant" },
            { word: "beaux", category: "adjectif" },
            { word: "paysages", category: "nom" }
        ]
    },
    {
        text: "Elle nage parfaitement.",
        words: [
            { word: "Elle", category: "determinant" },
            { word: "nage", category: "verbe" },
            { word: "parfaitement", category: "adverbe" }
        ]
    },
    {
        text: "Ton petit chat.",
        words: [
            { word: "Ton", category: "determinant" },
            { word: "petit", category: "adjectif" },
            { word: "chat", category: "nom" }
        ]
    },
    {
        text: "Nous chantons fort.",
        words: [
            { word: "Nous", category: "determinant" },
            { word: "chantons", category: "verbe" },
            { word: "fort", category: "adverbe" }
        ]
    },
    {
        text: "Cette longue route.",
        words: [
            { word: "Cette", category: "determinant" },
            { word: "longue", category: "adjectif" },
            { word: "route", category: "nom" }
        ]
    },
    {
        text: "Vous parlez doucement.",
        words: [
            { word: "Vous", category: "determinant" },
            { word: "parlez", category: "verbe" },
            { word: "doucement", category: "adverbe" }
        ]
    },
    {
        text: "Ses jolis yeux.",
        words: [
            { word: "Ses", category: "determinant" },
            { word: "jolis", category: "adjectif" },
            { word: "yeux", category: "nom" }
        ]
    },
    {
        text: "Tu souris gentiment.",
        words: [
            { word: "Tu", category: "determinant" },
            { word: "souris", category: "verbe" },
            { word: "gentiment", category: "adverbe" }
        ]
    }
];

// Banque de phrases niveau 2 et 3 (plus complexes)
const phrasesLevel2 = [
    {
        text: "Le grand chat noir dort paisiblement sur le canapé.",
        words: [
            { word: "Le", category: "determinant" },
            { word: "grand", category: "adjectif" },
            { word: "chat", category: "nom" },
            { word: "noir", category: "adjectif" },
            { word: "dort", category: "verbe" },
            { word: "paisiblement", category: "adverbe" },
            { word: "sur", category: "determinant" },
            { word: "le", category: "determinant" },
            { word: "canapé", category: "nom" }
        ]
    },
    {
        text: "Ces enfants joyeux jouent bruyamment dans le jardin public.",
        words: [
            { word: "Ces", category: "determinant" },
            { word: "enfants", category: "nom" },
            { word: "joyeux", category: "adjectif" },
            { word: "jouent", category: "verbe" },
            { word: "bruyamment", category: "adverbe" },
            { word: "dans", category: "determinant" },
            { word: "le", category: "determinant" },
            { word: "jardin", category: "nom" },
            { word: "public", category: "adjectif" }
        ]
    },
    {
        text: "Ma nouvelle voiture rouge roule silencieusement sur cette route sinueuse.",
        words: [
            { word: "Ma", category: "determinant" },
            { word: "nouvelle", category: "adjectif" },
            { word: "voiture", category: "nom" },
            { word: "rouge", category: "adjectif" },
            { word: "roule", category: "verbe" },
            { word: "silencieusement", category: "adverbe" },
            { word: "sur", category: "determinant" },
            { word: "cette", category: "determinant" },
            { word: "route", category: "nom" },
            { word: "sinueuse", category: "adjectif" }
        ]
    },
    {
        text: "Les oiseaux colorés chantent mélodieusement dans les grands arbres.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "oiseaux", category: "nom" },
            { word: "colorés", category: "adjectif" },
            { word: "chantent", category: "verbe" },
            { word: "mélodieusement", category: "adverbe" },
            { word: "dans", category: "determinant" },
            { word: "les", category: "determinant" },
            { word: "grands", category: "adjectif" },
            { word: "arbres", category: "nom" }
        ]
    },
    {
        text: "Mon petit frère joue joyeusement avec ses nouveaux jouets colorés.",
        words: [
            { word: "Mon", category: "determinant" },
            { word: "petit", category: "adjectif" },
            { word: "frère", category: "nom" },
            { word: "joue", category: "verbe" },
            { word: "joyeusement", category: "adverbe" },
            { word: "avec", category: "determinant" },
            { word: "ses", category: "determinant" },
            { word: "nouveaux", category: "adjectif" },
            { word: "jouets", category: "nom" },
            { word: "colorés", category: "adjectif" }
        ]
    },
    {
        text: "Cette vieille maison abandonnée semble vraiment effrayante la nuit.",
        words: [
            { word: "Cette", category: "determinant" },
            { word: "vieille", category: "adjectif" },
            { word: "maison", category: "nom" },
            { word: "abandonnée", category: "adjectif" },
            { word: "semble", category: "verbe" },
            { word: "vraiment", category: "adverbe" },
            { word: "effrayante", category: "adjectif" },
            { word: "la", category: "determinant" },
            { word: "nuit", category: "nom" }
        ]
    },
    {
        text: "Nos amis fidèles arrivent demain pour le grand repas familial.",
        words: [
            { word: "Nos", category: "determinant" },
            { word: "amis", category: "nom" },
            { word: "fidèles", category: "adjectif" },
            { word: "arrivent", category: "verbe" },
            { word: "demain", category: "adverbe" },
            { word: "pour", category: "determinant" },
            { word: "le", category: "determinant" },
            { word: "grand", category: "adjectif" },
            { word: "repas", category: "nom" },
            { word: "familial", category: "adjectif" }
        ]
    },
    {
        text: "Le jeune professeur explique patiemment la leçon difficile aux élèves attentifs.",
        words: [
            { word: "Le", category: "determinant" },
            { word: "jeune", category: "adjectif" },
            { word: "professeur", category: "nom" },
            { word: "explique", category: "verbe" },
            { word: "patiemment", category: "adverbe" },
            { word: "la", category: "determinant" },
            { word: "leçon", category: "nom" },
            { word: "difficile", category: "adjectif" },
            { word: "aux", category: "determinant" },
            { word: "élèves", category: "nom" },
            { word: "attentifs", category: "adjectif" }
        ]
    },
    {
        text: "Un petit chien blanc aboie furieusement contre le facteur sympathique.",
        words: [
            { word: "Un", category: "determinant" },
            { word: "petit", category: "adjectif" },
            { word: "chien", category: "nom" },
            { word: "blanc", category: "adjectif" },
            { word: "aboie", category: "verbe" },
            { word: "furieusement", category: "adverbe" },
            { word: "contre", category: "determinant" },
            { word: "le", category: "determinant" },
            { word: "facteur", category: "nom" },
            { word: "sympathique", category: "adjectif" }
        ]
    },
    {
        text: "Cette délicieuse tarte aux pommes cuit lentement dans le four chaud.",
        words: [
            { word: "Cette", category: "determinant" },
            { word: "délicieuse", category: "adjectif" },
            { word: "tarte", category: "nom" },
            { word: "aux", category: "determinant" },
            { word: "pommes", category: "nom" },
            { word: "cuit", category: "verbe" },
            { word: "lentement", category: "adverbe" },
            { word: "dans", category: "determinant" },
            { word: "le", category: "determinant" },
            { word: "four", category: "nom" },
            { word: "chaud", category: "adjectif" }
        ]
    },
    {
        text: "Les fortes pluies tombent violemment sur les toits des maisons anciennes.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "fortes", category: "adjectif" },
            { word: "pluies", category: "nom" },
            { word: "tombent", category: "verbe" },
            { word: "violemment", category: "adverbe" },
            { word: "sur", category: "determinant" },
            { word: "les", category: "determinant" },
            { word: "toits", category: "nom" },
            { word: "des", category: "determinant" },
            { word: "maisons", category: "nom" },
            { word: "anciennes", category: "adjectif" }
        ]
    },
    {
        text: "Mes vieux grands-parents racontent souvent des histoires passionnantes de leur jeunesse.",
        words: [
            { word: "Mes", category: "determinant" },
            { word: "vieux", category: "adjectif" },
            { word: "grands-parents", category: "nom" },
            { word: "racontent", category: "verbe" },
            { word: "souvent", category: "adverbe" },
            { word: "des", category: "determinant" },
            { word: "histoires", category: "nom" },
            { word: "passionnantes", category: "adjectif" },
            { word: "de", category: "determinant" },
            { word: "leur", category: "determinant" },
            { word: "jeunesse", category: "nom" }
        ]
    },
    {
        text: "La petite fille timide parle doucement à son nouvel ami souriant.",
        words: [
            { word: "La", category: "determinant" },
            { word: "petite", category: "adjectif" },
            { word: "fille", category: "nom" },
            { word: "timide", category: "adjectif" },
            { word: "parle", category: "verbe" },
            { word: "doucement", category: "adverbe" },
            { word: "à", category: "determinant" },
            { word: "son", category: "determinant" },
            { word: "nouvel", category: "adjectif" },
            { word: "ami", category: "nom" },
            { word: "souriant", category: "adjectif" }
        ]
    },
    {
        text: "Cette célèbre actrice sourit gracieusement aux photographes enthousiastes.",
        words: [
            { word: "Cette", category: "determinant" },
            { word: "célèbre", category: "adjectif" },
            { word: "actrice", category: "nom" },
            { word: "sourit", category: "verbe" },
            { word: "gracieusement", category: "adverbe" },
            { word: "aux", category: "determinant" },
            { word: "photographes", category: "nom" },
            { word: "enthousiastes", category: "adjectif" }
        ]
    },
    {
        text: "Le vieux train rouge avance lentement sur les rails rouillés.",
        words: [
            { word: "Le", category: "determinant" },
            { word: "vieux", category: "adjectif" },
            { word: "train", category: "nom" },
            { word: "rouge", category: "adjectif" },
            { word: "avance", category: "verbe" },
            { word: "lentement", category: "adverbe" },
            { word: "sur", category: "determinant" },
            { word: "les", category: "determinant" },
            { word: "rails", category: "nom" },
            { word: "rouillés", category: "adjectif" }
        ]
    },
    {
        text: "Ces brillants étudiants résolvent rapidement les problèmes mathématiques complexes.",
        words: [
            { word: "Ces", category: "determinant" },
            { word: "brillants", category: "adjectif" },
            { word: "étudiants", category: "nom" },
            { word: "résolvent", category: "verbe" },
            { word: "rapidement", category: "adverbe" },
            { word: "les", category: "determinant" },
            { word: "problèmes", category: "nom" },
            { word: "mathématiques", category: "adjectif" },
            { word: "complexes", category: "adjectif" }
        ]
    },
    {
        text: "Votre nouvelle application fonctionne parfaitement sur mon téléphone portable.",
        words: [
            { word: "Votre", category: "determinant" },
            { word: "nouvelle", category: "adjectif" },
            { word: "application", category: "nom" },
            { word: "fonctionne", category: "verbe" },
            { word: "parfaitement", category: "adverbe" },
            { word: "sur", category: "determinant" },
            { word: "mon", category: "determinant" },
            { word: "téléphone", category: "nom" },
            { word: "portable", category: "adjectif" }
        ]
    },
    {
        text: "Les hautes montagnes enneigées brillent magnifiquement sous le soleil éclatant.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "hautes", category: "adjectif" },
            { word: "montagnes", category: "nom" },
            { word: "enneigées", category: "adjectif" },
            { word: "brillent", category: "verbe" },
            { word: "magnifiquement", category: "adverbe" },
            { word: "sous", category: "determinant" },
            { word: "le", category: "determinant" },
            { word: "soleil", category: "nom" },
            { word: "éclatant", category: "adjectif" }
        ]
    },
    {
        text: "Mon gentil voisin aide généreusement les personnes âgées du quartier calme.",
        words: [
            { word: "Mon", category: "determinant" },
            { word: "gentil", category: "adjectif" },
            { word: "voisin", category: "nom" },
            { word: "aide", category: "verbe" },
            { word: "généreusement", category: "adverbe" },
            { word: "les", category: "determinant" },
            { word: "personnes", category: "nom" },
            { word: "âgées", category: "adjectif" },
            { word: "du", category: "determinant" },
            { word: "quartier", category: "nom" },
            { word: "calme", category: "adjectif" }
        ]
    },
    {
        text: "Cette talentueuse musicienne joue merveilleusement du piano ancien.",
        words: [
            { word: "Cette", category: "determinant" },
            { word: "talentueuse", category: "adjectif" },
            { word: "musicienne", category: "nom" },
            { word: "joue", category: "verbe" },
            { word: "merveilleusement", category: "adverbe" },
            { word: "du", category: "determinant" },
            { word: "piano", category: "nom" },
            { word: "ancien", category: "adjectif" }
        ]
    },
    {
        text: "Les petits poissons colorés nagent joyeusement dans l'aquarium propre.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "petits", category: "adjectif" },
            { word: "poissons", category: "nom" },
            { word: "colorés", category: "adjectif" },
            { word: "nagent", category: "verbe" },
            { word: "joyeusement", category: "adverbe" },
            { word: "dans", category: "determinant" },
            { word: "l'aquarium", category: "nom" },
            { word: "propre", category: "adjectif" }
        ]
    },
    {
        text: "Un épais brouillard gris couvre mystérieusement la ville endormie.",
        words: [
            { word: "Un", category: "determinant" },
            { word: "épais", category: "adjectif" },
            { word: "brouillard", category: "nom" },
            { word: "gris", category: "adjectif" },
            { word: "couvre", category: "verbe" },
            { word: "mystérieusement", category: "adverbe" },
            { word: "la", category: "determinant" },
            { word: "ville", category: "nom" },
            { word: "endormie", category: "adjectif" }
        ]
    },
    {
        text: "Leurs beaux jardins fleuris attirent régulièrement les abeilles travailleuses.",
        words: [
            { word: "Leurs", category: "determinant" },
            { word: "beaux", category: "adjectif" },
            { word: "jardins", category: "nom" },
            { word: "fleuris", category: "adjectif" },
            { word: "attirent", category: "verbe" },
            { word: "régulièrement", category: "adverbe" },
            { word: "les", category: "determinant" },
            { word: "abeilles", category: "nom" },
            { word: "travailleuses", category: "adjectif" }
        ]
    },
    {
        text: "Le célèbre chef cuisinier prépare soigneusement son plat signature.",
        words: [
            { word: "Le", category: "determinant" },
            { word: "célèbre", category: "adjectif" },
            { word: "chef", category: "nom" },
            { word: "cuisinier", category: "adjectif" },
            { word: "prépare", category: "verbe" },
            { word: "soigneusement", category: "adverbe" },
            { word: "son", category: "determinant" },
            { word: "plat", category: "nom" },
            { word: "signature", category: "adjectif" }
        ]
    },
    {
        text: "Cette ancienne bibliothèque contient précieusement des livres rares et fragiles.",
        words: [
            { word: "Cette", category: "determinant" },
            { word: "ancienne", category: "adjectif" },
            { word: "bibliothèque", category: "nom" },
            { word: "contient", category: "verbe" },
            { word: "précieusement", category: "adverbe" },
            { word: "des", category: "determinant" },
            { word: "livres", category: "nom" },
            { word: "rares", category: "adjectif" },
            { word: "et", category: "determinant" },
            { word: "fragiles", category: "adjectif" }
        ]
    },
    {
        text: "Les courageuses pompières combattent efficacement l'incendie dangereux.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "courageuses", category: "adjectif" },
            { word: "pompières", category: "nom" },
            { word: "combattent", category: "verbe" },
            { word: "efficacement", category: "adverbe" },
            { word: "l'incendie", category: "nom" },
            { word: "dangereux", category: "adjectif" }
        ]
    },
    {
        text: "Son nouveau roman captivant raconte brillamment une histoire fantastique.",
        words: [
            { word: "Son", category: "determinant" },
            { word: "nouveau", category: "adjectif" },
            { word: "roman", category: "nom" },
            { word: "captivant", category: "adjectif" },
            { word: "raconte", category: "verbe" },
            { word: "brillamment", category: "adverbe" },
            { word: "une", category: "determinant" },
            { word: "histoire", category: "nom" },
            { word: "fantastique", category: "adjectif" }
        ]
    },
    {
        text: "Les rapides guépards tachetés courent majestueusement dans la savane africaine.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "rapides", category: "adjectif" },
            { word: "guépards", category: "nom" },
            { word: "tachetés", category: "adjectif" },
            { word: "courent", category: "verbe" },
            { word: "majestueusement", category: "adverbe" },
            { word: "dans", category: "determinant" },
            { word: "la", category: "determinant" },
            { word: "savane", category: "nom" },
            { word: "africaine", category: "adjectif" }
        ]
    },
    {
        text: "Cette puissante locomotive avance inexorablement sur les rails brillants.",
        words: [
            { word: "Cette", category: "determinant" },
            { word: "puissante", category: "adjectif" },
            { word: "locomotive", category: "nom" },
            { word: "avance", category: "verbe" },
            { word: "inexorablement", category: "adverbe" },
            { word: "sur", category: "determinant" },
            { word: "les", category: "determinant" },
            { word: "rails", category: "nom" },
            { word: "brillants", category: "adjectif" }
        ]
    },
    {
        text: "Mes fidèles amis m'écrivent régulièrement des messages réconfortants.",
        words: [
            { word: "Mes", category: "determinant" },
            { word: "fidèles", category: "adjectif" },
            { word: "amis", category: "nom" },
            { word: "m'écrivent", category: "verbe" },
            { word: "régulièrement", category: "adverbe" },
            { word: "des", category: "determinant" },
            { word: "messages", category: "nom" },
            { word: "réconfortants", category: "adjectif" }
        ]
    },
    {
        text: "La belle princesse danse élégamment avec le prince charmant.",
        words: [
            { word: "La", category: "determinant" },
            { word: "belle", category: "adjectif" },
            { word: "princesse", category: "nom" },
            { word: "danse", category: "verbe" },
            { word: "élégamment", category: "adverbe" },
            { word: "avec", category: "determinant" },
            { word: "le", category: "determinant" },
            { word: "prince", category: "nom" },
            { word: "charmant", category: "adjectif" }
        ]
    },
    {
        text: "Les énormes vagues tumultueuses frappent violemment les falaises escarpées.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "énormes", category: "adjectif" },
            { word: "vagues", category: "nom" },
            { word: "tumultueuses", category: "adjectif" },
            { word: "frappent", category: "verbe" },
            { word: "violemment", category: "adverbe" },
            { word: "les", category: "determinant" },
            { word: "falaises", category: "nom" },
            { word: "escarpées", category: "adjectif" }
        ]
    },
    {
        text: "Ce talentueux artiste peint minutieusement des tableaux impressionnants.",
        words: [
            { word: "Ce", category: "determinant" },
            { word: "talentueux", category: "adjectif" },
            { word: "artiste", category: "nom" },
            { word: "peint", category: "verbe" },
            { word: "minutieusement", category: "adverbe" },
            { word: "des", category: "determinant" },
            { word: "tableaux", category: "nom" },
            { word: "impressionnants", category: "adjectif" }
        ]
    },
    {
        text: "Leurs vieilles traditions familiales perdurent fièrement à travers les générations.",
        words: [
            { word: "Leurs", category: "determinant" },
            { word: "vieilles", category: "adjectif" },
            { word: "traditions", category: "nom" },
            { word: "familiales", category: "adjectif" },
            { word: "perdurent", category: "verbe" },
            { word: "fièrement", category: "adverbe" },
            { word: "à", category: "determinant" },
            { word: "travers", category: "determinant" },
            { word: "les", category: "determinant" },
            { word: "générations", category: "nom" }
        ]
    },
    {
        text: "Un petit oiseau bleu chante mélodieusement dans la forêt silencieuse.",
        words: [
            { word: "Un", category: "determinant" },
            { word: "petit", category: "adjectif" },
            { word: "oiseau", category: "nom" },
            { word: "bleu", category: "adjectif" },
            { word: "chante", category: "verbe" },
            { word: "mélodieusement", category: "adverbe" },
            { word: "dans", category: "determinant" },
            { word: "la", category: "determinant" },
            { word: "forêt", category: "nom" },
            { word: "silencieuse", category: "adjectif" }
        ]
    },
    {
        text: "Ces délicieux gâteaux chocolatés attirent invariablement les enfants gourmands.",
        words: [
            { word: "Ces", category: "determinant" },
            { word: "délicieux", category: "adjectif" },
            { word: "gâteaux", category: "nom" },
            { word: "chocolatés", category: "adjectif" },
            { word: "attirent", category: "verbe" },
            { word: "invariablement", category: "adverbe" },
            { word: "les", category: "determinant" },
            { word: "enfants", category: "nom" },
            { word: "gourmands", category: "adjectif" }
        ]
    },
    {
        text: "Le vieux phare abandonné guide toujours les bateaux perdus.",
        words: [
            { word: "Le", category: "determinant" },
            { word: "vieux", category: "adjectif" },
            { word: "phare", category: "nom" },
            { word: "abandonné", category: "adjectif" },
            { word: "guide", category: "verbe" },
            { word: "toujours", category: "adverbe" },
            { word: "les", category: "determinant" },
            { word: "bateaux", category: "nom" },
            { word: "perdus", category: "adjectif" }
        ]
    },
    {
        text: "Ma grande sœur arrive bientôt avec ses nouveaux amis sympathiques.",
        words: [
            { word: "Ma", category: "determinant" },
            { word: "grande", category: "adjectif" },
            { word: "sœur", category: "nom" },
            { word: "arrive", category: "verbe" },
            { word: "bientôt", category: "adverbe" },
            { word: "avec", category: "determinant" },
            { word: "ses", category: "determinant" },
            { word: "nouveaux", category: "adjectif" },
            { word: "amis", category: "nom" },
            { word: "sympathiques", category: "adjectif" }
        ]
    },
    {
        text: "Ces brillants scientifiques étudient passionnément les mystères cosmiques.",
        words: [
            { word: "Ces", category: "determinant" },
            { word: "brillants", category: "adjectif" },
            { word: "scientifiques", category: "nom" },
            { word: "étudient", category: "verbe" },
            { word: "passionnément", category: "adverbe" },
            { word: "les", category: "determinant" },
            { word: "mystères", category: "nom" },
            { word: "cosmiques", category: "adjectif" }
        ]
    },
    {
        text: "Le rapide train express traverse prudemment les montagnes escarpées.",
        words: [
            { word: "Le", category: "determinant" },
            { word: "rapide", category: "adjectif" },
            { word: "train", category: "nom" },
            { word: "express", category: "adjectif" },
            { word: "traverse", category: "verbe" },
            { word: "prudemment", category: "adverbe" },
            { word: "les", category: "determinant" },
            { word: "montagnes", category: "nom" },
            { word: "escarpées", category: "adjectif" }
        ]
    },
    {
        text: "Cette magnifique robe rouge brille intensément sous les projecteurs puissants.",
        words: [
            { word: "Cette", category: "determinant" },
            { word: "magnifique", category: "adjectif" },
            { word: "robe", category: "nom" },
            { word: "rouge", category: "adjectif" },
            { word: "brille", category: "verbe" },
            { word: "intensément", category: "adverbe" },
            { word: "sous", category: "determinant" },
            { word: "les", category: "determinant" },
            { word: "projecteurs", category: "nom" },
            { word: "puissants", category: "adjectif" }
        ]
    },
    {
        text: "Les curieux touristes photographient frénétiquement les monuments historiques.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "curieux", category: "adjectif" },
            { word: "touristes", category: "nom" },
            { word: "photographient", category: "verbe" },
            { word: "frénétiquement", category: "adverbe" },
            { word: "les", category: "determinant" },
            { word: "monuments", category: "nom" },
            { word: "historiques", category: "adjectif" }
        ]
    },
    {
        text: "Mon gentil grand-père raconte patiemment des histoires passionnantes.",
        words: [
            { word: "Mon", category: "determinant" },
            { word: "gentil", category: "adjectif" },
            { word: "grand-père", category: "nom" },
            { word: "raconte", category: "verbe" },
            { word: "patiemment", category: "adverbe" },
            { word: "des", category: "determinant" },
            { word: "histoires", category: "nom" },
            { word: "passionnantes", category: "adjectif" }
        ]
    },
    {
        text: "Ces petits chatons joueurs grimpent adroitement sur les rideaux épais.",
        words: [
            { word: "Ces", category: "determinant" },
            { word: "petits", category: "adjectif" },
            { word: "chatons", category: "nom" },
            { word: "joueurs", category: "adjectif" },
            { word: "grimpent", category: "verbe" },
            { word: "adroitement", category: "adverbe" },
            { word: "sur", category: "determinant" },
            { word: "les", category: "determinant" },
            { word: "rideaux", category: "nom" },
            { word: "épais", category: "adjectif" }
        ]
    },
    {
        text: "La jolie fleuriste arrange soigneusement les bouquets colorés.",
        words: [
            { word: "La", category: "determinant" },
            { word: "jolie", category: "adjectif" },
            { word: "fleuriste", category: "nom" },
            { word: "arrange", category: "verbe" },
            { word: "soigneusement", category: "adverbe" },
            { word: "les", category: "determinant" },
            { word: "bouquets", category: "nom" },
            { word: "colorés", category: "adjectif" }
        ]
    },
    {
        text: "Ces grandes fenêtres propres laissent généreusement entrer la lumière naturelle.",
        words: [
            { word: "Ces", category: "determinant" },
            { word: "grandes", category: "adjectif" },
            { word: "fenêtres", category: "nom" },
            { word: "propres", category: "adjectif" },
            { word: "laissent", category: "verbe" },
            { word: "généreusement", category: "adverbe" },
            { word: "entrer", category: "verbe" },
            { word: "la", category: "determinant" },
            { word: "lumière", category: "nom" },
            { word: "naturelle", category: "adjectif" }
        ]
    },
    {
        text: "Le jeune pianiste talentueux joue merveilleusement cette mélodie complexe.",
        words: [
            { word: "Le", category: "determinant" },
            { word: "jeune", category: "adjectif" },
            { word: "pianiste", category: "nom" },
            { word: "talentueux", category: "adjectif" },
            { word: "joue", category: "verbe" },
            { word: "merveilleusement", category: "adverbe" },
            { word: "cette", category: "determinant" },
            { word: "mélodie", category: "nom" },
            { word: "complexe", category: "adjectif" }
        ]
    },
    {
        text: "Cette vieille voiture classique roule fièrement dans les rues bondées.",
        words: [
            { word: "Cette", category: "determinant" },
            { word: "vieille", category: "adjectif" },
            { word: "voiture", category: "nom" },
            { word: "classique", category: "adjectif" },
            { word: "roule", category: "verbe" },
            { word: "fièrement", category: "adverbe" },
            { word: "dans", category: "determinant" },
            { word: "les", category: "determinant" },
            { word: "rues", category: "nom" },
            { word: "bondées", category: "adjectif" }
        ]
    },
    {
        text: "Mes précieux bijoux familiaux brillent intensément sous la lumière dorée.",
        words: [
            { word: "Mes", category: "determinant" },
            { word: "précieux", category: "adjectif" },
            { word: "bijoux", category: "nom" },
            { word: "familiaux", category: "adjectif" },
            { word: "brillent", category: "verbe" },
            { word: "intensément", category: "adverbe" },
            { word: "sous", category: "determinant" },
            { word: "la", category: "determinant" },
            { word: "lumière", category: "nom" },
            { word: "dorée", category: "adjectif" }
        ]
    },
    {
        text: "Les joyeux enfants courent librement dans le parc verdoyant.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "joyeux", category: "adjectif" },
            { word: "enfants", category: "nom" },
            { word: "courent", category: "verbe" },
            { word: "librement", category: "adverbe" },
            { word: "dans", category: "determinant" },
            { word: "le", category: "determinant" },
            { word: "parc", category: "nom" },
            { word: "verdoyant", category: "adjectif" }
        ]
    },
    {
        text: "Cette délicate porcelaine chinoise trône fièrement dans la vitrine élégante.",
        words: [
            { word: "Cette", category: "determinant" },
            { word: "délicate", category: "adjectif" },
            { word: "porcelaine", category: "nom" },
            { word: "chinoise", category: "adjectif" },
            { word: "trône", category: "verbe" },
            { word: "fièrement", category: "adverbe" },
            { word: "dans", category: "determinant" },
            { word: "la", category: "determinant" },
            { word: "vitrine", category: "nom" },
            { word: "élégante", category: "adjectif" }
        ]
    },
    {
        text: "Les imposantes montagnes enneigées dominent majestueusement la vallée fertile.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "imposantes", category: "adjectif" },
            { word: "montagnes", category: "nom" },
            { word: "enneigées", category: "adjectif" },
            { word: "dominent", category: "verbe" },
            { word: "majestueusement", category: "adverbe" },
            { word: "la", category: "determinant" },
            { word: "vallée", category: "nom" },
            { word: "fertile", category: "adjectif" }
        ]
    },
    {
        text: "Notre gentille voisine cuisine délicieusement des plats traditionnels.",
        words: [
            { word: "Notre", category: "determinant" },
            { word: "gentille", category: "adjectif" },
            { word: "voisine", category: "nom" },
            { word: "cuisine", category: "verbe" },
            { word: "délicieusement", category: "adverbe" },
            { word: "des", category: "determinant" },
            { word: "plats", category: "nom" },
            { word: "traditionnels", category: "adjectif" }
        ]
    },
    {
        text: "Les savants chercheurs examinent minutieusement leurs récentes découvertes scientifiques.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "savants", category: "adjectif" },
            { word: "chercheurs", category: "nom" },
            { word: "examinent", category: "verbe" },
            { word: "minutieusement", category: "adverbe" },
            { word: "leurs", category: "determinant" },
            { word: "récentes", category: "adjectif" },
            { word: "découvertes", category: "nom" },
            { word: "scientifiques", category: "adjectif" }
        ]
    },
    {
        text: "Ce robuste camion rouge transporte efficacement les marchandises lourdes.",
        words: [
            { word: "Ce", category: "determinant" },
            { word: "robuste", category: "adjectif" },
            { word: "camion", category: "nom" },
            { word: "rouge", category: "adjectif" },
            { word: "transporte", category: "verbe" },
            { word: "efficacement", category: "adverbe" },
            { word: "les", category: "determinant" },
            { word: "marchandises", category: "nom" },
            { word: "lourdes", category: "adjectif" }
        ]
    },
    {
        text: "Les élégants danseurs tournent gracieusement sur la scène illuminée.",
        words: [
            { word: "Les", category: "determinant" },
            { word: "élégants", category: "adjectif" },
            { word: "danseurs", category: "nom" },
            { word: "tournent", category: "verbe" },
            { word: "gracieusement", category: "adverbe" },
            { word: "sur", category: "determinant" },
            { word: "la", category: "determinant" },
            { word: "scène", category: "nom" },
            { word: "illuminée", category: "adjectif" }
        ]
    }
];

// Fonction d'initialisation (OBLIGATOIRE)
function initGame() {
    console.log('Initialisation du mini-jeu Bombe Grammaticale');
    
    // 1. Récupérer les références aux éléments DOM
    phraseDisplay = document.getElementById('phrase-display');
    bombImage = document.getElementById('bomb-image');
    timerValue = document.getElementById('timer-value');
    progressValue = document.getElementById('progress-value');
    categoriesContainer = document.getElementById('categories-container');
    explosionEffect = document.getElementById('explosion-effect');
    
    // 2. Configurer l'état initial du jeu
    // Récupérer la difficulté depuis le template si disponible, sinon utiliser la valeur par défaut
    if (window.GameTemplate && window.GameTemplate.gameState && window.GameTemplate.gameState.difficulty) {
        currentDifficulty = parseInt(window.GameTemplate.gameState.difficulty);
    }
    
    console.log('Niveau de difficulté:', currentDifficulty);
    
    // 3. Initialiser d'autres composants si nécessaire
    setupCategoriesDisplay();
    
    // 4. Démarrer le jeu automatiquement
    startGame();
}

// Configurer l'affichage des catégories en bas de l'écran
function setupCategoriesDisplay() {
    categoriesContainer.innerHTML = '';
    
    // Déterminer quelles catégories afficher selon le niveau de difficulté
    let categoriesToShow = [];
    
    if (currentDifficulty === 3) {
        // Niveau 3: toutes les catégories
        categoriesToShow = categories;
    } else {
        // Niveaux 1 et 2: la catégorie sera déterminée par la phrase choisie
        // On les ajoute toutes et on masquera celles qui ne sont pas nécessaires
        categoriesToShow = categories;
    }
    
    // Créer les éléments pour chaque catégorie
    categoriesToShow.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.dataset.category = category.id;
        
        const categoryImage = document.createElement('img');
        categoryImage.src = category.image;
        categoryImage.alt = category.name;
        categoryImage.className = 'category-image';
        
        const categoryLabel = document.createElement('div');
        categoryLabel.className = 'category-label';
        categoryLabel.textContent = category.name;
        
        categoryItem.appendChild(categoryImage);
        categoryItem.appendChild(categoryLabel);
        
        // Ajouter l'écouteur d'événement pour sélectionner cette catégorie
        categoryItem.addEventListener('click', () => {
            selectCategory(category.id);
        });
        
        categoriesContainer.appendChild(categoryItem);
    });
    
    // Par défaut, masquer toutes les catégories sauf celle choisie pour les niveaux 1 et 2
    if (currentDifficulty !== 3) {
        hideAllCategoriesExcept(null);
    }
}

// Masquer toutes les catégories sauf celle spécifiée
function hideAllCategoriesExcept(categoryId) {
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryItems.forEach(item => {
        if (categoryId === null || item.dataset.category !== categoryId) {
            item.style.display = 'none';
        } else {
            item.style.display = 'flex';
        }
    });
}

// Sélectionner une catégorie grammaticale
function selectCategory(categoryId) {
    // Si nous sommes déjà en train de traiter une réponse, ignorer
    if (!gameActive) return;
    
    // Désélectionner la catégorie précédente s'il y en a une
    if (selectedCategory) {
        const prevCategoryItem = document.querySelector(`.category-item[data-category="${selectedCategory}"]`);
        if (prevCategoryItem) prevCategoryItem.classList.remove('active');
    }
    
    // Sélectionner la nouvelle catégorie
    selectedCategory = categoryId;
    const categoryItem = document.querySelector(`.category-item[data-category="${categoryId}"]`);
    
    // Mettre en évidence la catégorie sélectionnée
    if (categoryItem) {
        categoryItem.classList.add('active');
        
        // Réduire les autres catégories
        document.querySelectorAll('.category-item').forEach(item => {
            if (item !== categoryItem) {
                item.classList.add('inactive');
                item.classList.remove('active');
            } else {
                item.classList.remove('inactive');
            }
        });
    }
}

// Fonction de démarrage du jeu
function startGame() {
    // Réinitialiser le jeu
    currentScore = 0;
    currentRound = 0;
    totalTimeSpent = 0;
    gameStartTime = Date.now();
    gameActive = true;
    
    // Réinitialiser les indexes utilisés
    usedIndexesLevel1 = [];
    usedIndexesLevel2 = [];
    
    // Mettre à jour l'affichage
    updatetopbar_score(currentScore);
    updateProgress();
    
    // Définir la durée du minuteur selon le niveau
    timeRemaining = (currentDifficulty === 3) ? 90 : 30;
    
    // Charger l'image de la bombe selon le niveau
    bombImage.src = bombImages[currentDifficulty - 1] || bombImages[0];
    
    // Commencer le premier tour
    startNextRound();
}

// Démarrer le tour suivant
function startNextRound() {
    // Vérifier si nous avons atteint la fin du jeu
    if (currentRound >= 10) {
        endGameWithResults();
        return;
    }
    
    // Incrémenter le compteur de tours
    currentRound++;
    updateProgress();
    
    // Réinitialiser les variables du tour
    selectedCategory = null;
    selectedWords = [];
    correctWords = [];
    allWordsDone = false;
    
    // Réinitialiser l'affichage des catégories
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active', 'inactive');
    });
    
    // Sélectionner une phrase aléatoire non utilisée
    currentPhrase = getRandomPhrase(currentDifficulty);
    
    // Niveau 1: choisir une catégorie et un mot aléatoire
    if (currentDifficulty === 1) {
        // Déterminer les mots de la phrase par catégorie
        const wordsByCategory = {};
        currentPhrase.words.forEach(word => {
            if (!wordsByCategory[word.category]) {
                wordsByCategory[word.category] = [];
            }
            wordsByCategory[word.category].push(word.word);
        });
        
        // Filtrer les catégories qui ont au moins un mot
        const availableCategories = Object.keys(wordsByCategory).filter(
            category => wordsByCategory[category].length > 0
        );
        
        // Choisir une catégorie aléatoire
        const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        
        // Définir la catégorie active et les mots attendus
        selectedCategory = randomCategory;
        correctWords = [wordsByCategory[randomCategory][0]]; // Prendre le premier mot de cette catégorie
        
        // Afficher uniquement cette catégorie
        hideAllCategoriesExcept(randomCategory);
        
    // Niveau 2: choisir une catégorie où il y a au moins un mot
    } else if (currentDifficulty === 2) {
        // Déterminer les mots de la phrase par catégorie
        const wordsByCategory = {};
        currentPhrase.words.forEach(word => {
            if (!wordsByCategory[word.category]) {
                wordsByCategory[word.category] = [];
            }
            wordsByCategory[word.category].push(word.word);
        });
        
        // Filtrer les catégories qui ont au moins un mot
        const availableCategories = Object.keys(wordsByCategory).filter(
            category => wordsByCategory[category].length > 0
        );
        
        // Choisir une catégorie aléatoire
        const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        
        // Définir la catégorie active et les mots attendus
        selectedCategory = randomCategory;
        correctWords = wordsByCategory[randomCategory]; // Tous les mots de cette catégorie
        
        // Afficher uniquement cette catégorie
        hideAllCategoriesExcept(randomCategory);
        
    // Niveau 3: toutes les catégories sont disponibles
    } else if (currentDifficulty === 3) {
        // Afficher toutes les catégories
        document.querySelectorAll('.category-item').forEach(item => {
            item.style.display = 'flex';
        });
        
        // Pour le niveau 3, on ne définit pas de mots corrects spécifiques
        // car l'utilisateur doit attribuer une catégorie à chaque mot
    }
    
    // Afficher la phrase
    displayPhrase();
    
    // Démarrer le minuteur
    startTimer();
}

// Afficher la phrase avec des balises cliquables pour chaque mot
function displayPhrase() {
    phraseDisplay.innerHTML = '';
    
    currentPhrase.words.forEach(wordObj => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        wordSpan.textContent = wordObj.word;
        wordSpan.dataset.word = wordObj.word;
        wordSpan.dataset.category = wordObj.category;
        
        // Ajouter l'écouteur d'événement pour sélectionner ce mot
        wordSpan.addEventListener('click', () => {
            if (gameActive && selectedCategory) {
                selectWord(wordSpan);
            }
        });
        
        phraseDisplay.appendChild(wordSpan);
    });
}

// Sélectionner un mot
function selectWord(wordElement) {
    const word = wordElement.dataset.word;
    const actualCategory = wordElement.dataset.category;
    
    // Vérifier si le mot a déjà été sélectionné
    if (selectedWords.includes(word)) {
        return;
    }
    
    // Ajouter l'image de la catégorie sur le mot
    const categoryImage = document.createElement('img');
    categoryImage.src = categories.find(cat => cat.id === selectedCategory)?.image || '';
    categoryImage.className = 'word-category';
    wordElement.appendChild(categoryImage);
    
    // Marquer le mot comme sélectionné
    wordElement.classList.add('selected');
    selectedWords.push(word);
    
    // Niveau 3: vérifier si la catégorie choisie correspond à la catégorie réelle du mot
    if (currentDifficulty === 3) {
        // Vérifier si la réponse est correcte
        if (selectedCategory === actualCategory) {
            // Réponse correcte
            showResultOnWord(wordElement, true);
            
            // Ajouter des points
            currentScore += 10;
            updatetopbar_score(currentScore);
            
            // Vérifier si tous les mots ont été catégorisés
            if (selectedWords.length === currentPhrase.words.length) {
                allWordsDone = true;
                // Réinitialiser le timer
                clearInterval(timer);
                // Passer au tour suivant
                setTimeout(startNextRound, 1000);
            }
        } else {
            // Réponse incorrecte
            showResultOnWord(wordElement, false);
            showExplosionEffect();
            
            // Perdre des points (sans descendre en dessous de 0)
            currentScore = Math.max(0, currentScore - 5);
            updatetopbar_score(currentScore);
            
            // Attendre 3 secondes puis passer au tour suivant
            clearInterval(timer);
            setTimeout(startNextRound, 3000);
        }
    } else {
        // Niveaux 1 et 2
        // Vérifier si le mot est dans la liste des mots corrects
        if (correctWords.includes(word)) {
            // Réponse correcte
            showResultOnWord(wordElement, true);
            
            if (currentDifficulty === 1 || selectedWords.length === correctWords.length) {
                // Ajouter des points
                currentScore += currentDifficulty === 1 ? 10 : 20;
                updatetopbar_score(currentScore);
                
                // Réinitialiser le timer
                clearInterval(timer);
                
                // Passer au tour suivant
                setTimeout(startNextRound, 1000);
            }
        } else {
            // Réponse incorrecte
            showResultOnWord(wordElement, false);
            showExplosionEffect();
            
            // Perdre des points (sans descendre en dessous de 0)
            currentScore = Math.max(0, currentScore - 5);
            updatetopbar_score(currentScore);
            
            // Réinitialiser le timer et attendre 3 secondes
            clearInterval(timer);
            
            // Passer au tour suivant après 3 secondes
            setTimeout(startNextRound, 3000);
        }
    }
}

// Afficher un symbole de réussite ou d'échec sur le mot
function showResultOnWord(wordElement, isSuccess) {
    const resultElement = document.createElement('div');
    resultElement.className = isSuccess ? 'word-result' : 'word-result error';
    resultElement.textContent = isSuccess ? '✓' : '✗';
    wordElement.appendChild(resultElement);
}

// Démarrer le minuteur
function startTimer() {
    // Réinitialiser le minuteur
    clearInterval(timer);
    
    // Définir la durée du minuteur selon le niveau
    timeRemaining = (currentDifficulty === 3) ? 45 : 30;
    updateTimerDisplay();
    
    // Démarrer le décompte
    timer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        // Vérifier si le temps est écoulé
        if (timeRemaining <= 0) {
            clearInterval(timer);
            // Temps écoulé, échec
            showExplosionEffect();
            // Perdre des points (sans descendre en dessous de 0)
            currentScore = Math.max(0, currentScore - 10);
            updatetopbar_score(currentScore);
            
            // Passer au tour suivant après 3 secondes
            setTimeout(startNextRound, 3000);
        }
    }, 1000);
}

// Mettre à jour l'affichage du minuteur
function updateTimerDisplay() {
    timerValue.textContent = timeRemaining;
    
    // Changer la couleur du timer en fonction du temps restant
    if (timeRemaining <= 5) {
        timerValue.style.color = '#ff0000'; // Rouge
    } else if (timeRemaining <= 10) {
        timerValue.style.color = '#ff8800'; // Orange
    } else {
        timerValue.style.color = '#000000'; // Noir
    }
}

// Fonction historique remplacée par updatetopbar_score
// Gardée pour compatibilité avec le code existant
function updateScore() {
    updatetopbar_score(currentScore);
}

// Mettre à jour l'affichage de la progression
function updateProgress() {
    progressValue.textContent = currentRound;
}

// Afficher l'effet d'explosion
function showExplosionEffect() {
    explosionEffect.style.opacity = '1';
    setTimeout(() => {
        explosionEffect.style.opacity = '0';
    }, 200);
}

// Fonction pour terminer le jeu (OBLIGATOIRE)
function endGameWithResults() {
    // 1. Arrêter les timers ou animations en cours
    clearInterval(timer);
    gameActive = false;
    
    // 2. Calculer le score final et le temps écoulé
    const tempsEcoule = Math.ceil((Date.now() - gameStartTime) / 1000);
    
    // 3. Appeler la fonction endGame du template
    if (window.GameEnd) {
        window.GameEnd.endGame({
            score: currentScore,
            maxScore: 100,
            timeSpent: tempsEcoule
        }, resetGame);
    } else {
        console.log('API GameEnd non disponible, mode test activé');
    }
}

// Fonction de réinitialisation du jeu (OBLIGATOIRE)
function resetGame() {
    // Réinitialiser les variables du jeu
    currentScore = 0;
    currentRound = 0;
    selectedCategory = null;
    selectedWords = [];
    correctWords = [];
    allWordsDone = false;
    
    // Mettre à jour l'affichage
    updatetopbar_score(currentScore);
    updateProgress();
    
    // Redémarrer le jeu
    startGame();
}
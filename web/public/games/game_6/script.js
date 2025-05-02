
// Variables du jeu
let score = 0;
let currentRound = 1;
let totalRounds = 5;
let pairsPerRound = 5;
let currentPairs = [];
let selectedWord = null;
let connections = [];
let gameStartTime;
let correctConnections = 0;
let totalConnections = 0;

// Éléments DOM
let gameBoard;
let leftColumn;
let rightColumn;
let connectionsLayer;

// Base de données de 300 paires de mots apparentés
const wordPairs = [
    ["dent", "dentiste"],
    ["tricot", "tricoter"],
    ["parfum", "parfumé"],
    ["long", "longueur"],
    ["jardin", "jardinage"],
    ["cuisine", "cuisinier"],
    ["boulanger", "boulangerie"],
    ["pâtissier", "pâtisserie"],
    ["plombier", "plomberie"],
    ["électricien", "électricité"],
    ["peintre", "peinture"],
    ["musicien", "musique"],
    ["danse", "danser"],
    ["chant", "chanter"],
    ["nager", "natation"],
    ["courir", "course"],
    ["sauter", "saut"],
    ["lancer", "lanceur"],
    ["jouer", "joueur"],
    ["rire", "rieur"],
    ["pleurer", "pleureur"],
    ["crier", "crieur"],
    ["parler", "parleur"],
    ["écouter", "écouteur"],
    ["regarder", "regard"],
    ["toucher", "touche"],
    ["sentir", "sentiment"],
    ["goûter", "goût"],
    ["boire", "boisson"],
    ["manger", "mangeur"],
    ["dormir", "dormeur"],
    ["rêver", "rêveur"],
    ["penser", "penseur"],
    ["réfléchir", "réflexion"],
    ["imaginer", "imagination"],
    ["créer", "créateur"],
    ["inventer", "inventeur"],
    ["découvrir", "découvreur"],
    ["explorer", "explorateur"],
    ["voyager", "voyageur"],
    ["naviguer", "navigateur"],
    ["piloter", "pilote"],
    ["conduire", "conducteur"],
    ["marcher", "marcheur"],
    ["grimper", "grimpeur"],
    ["skier", "skieur"],
    ["patiner", "patineur"],
    ["ramer", "rameur"],
    ["pêcher", "pêcheur"],
    ["chasser", "chasseur"],
    ["cultiver", "cultivateur"],
    ["récolter", "récolteur"],
    ["semer", "semeur"],
    ["planter", "planteur"],
    ["arroser", "arroseur"],
    ["fleurir", "fleur"],
    ["fructifier", "fruit"],
    ["grandir", "grandeur"],
    ["vieillir", "vieillesse"],
    ["naître", "naissance"],
    ["mourir", "mort"],
    ["vivre", "vie"],
    ["aimer", "amour"],
    ["adorer", "adoration"],
    ["respecter", "respect"],
    ["honorer", "honneur"],
    ["féliciter", "félicitation"],
    ["remercier", "remerciement"],
    ["excuser", "excuse"],
    ["pardonner", "pardon"],
    ["juger", "jugement"],
    ["condamner", "condamnation"],
    ["innocenter", "innocence"],
    ["accuser", "accusation"],
    ["défendre", "défense"],
    ["attaquer", "attaque"],
    ["protéger", "protection"],
    ["sauver", "sauveur"],
    ["secourir", "secours"],
    ["aider", "aide"],
    ["assister", "assistance"],
    ["soutenir", "soutien"],
    ["encourager", "encouragement"],
    ["motiver", "motivation"],
    ["inspirer", "inspiration"],
    ["influencer", "influence"],
    ["diriger", "direction"],
    ["guider", "guide"],
    ["mener", "meneur"],
    ["suivre", "suiveur"],
    ["accompagner", "accompagnateur"],
    ["enseigner", "enseignant"],
    ["apprendre", "apprentissage"],
    ["étudier", "étude"],
    ["analyser", "analyse"],
    ["synthétiser", "synthèse"],
    ["comprendre", "compréhension"],
    ["expliquer", "explication"],
    ["démontrer", "démonstration"],
    ["prouver", "preuve"],
    ["vérifier", "vérification"],
    ["valider", "validation"],
    ["certifier", "certification"],
    ["attester", "attestation"],
    ["confirmer", "confirmation"],
    ["affirmer", "affirmation"],
    ["contredire", "contradiction"],
    ["objecter", "objection"],
    ["argumenter", "argumentation"],
    ["débattre", "débat"],
    ["discuter", "discussion"],
    ["dialoguer", "dialogue"],
    ["communiquer", "communication"],
    ["informer", "information"],
    ["annoncer", "annonce"],
    ["publier", "publication"],
    ["diffuser", "diffusion"],
    ["émettre", "émission"],
    ["recevoir", "réception"],
    ["capter", "capteur"],
    ["enregistrer", "enregistrement"],
    ["stocker", "stockage"],
    ["conserver", "conservation"],
    ["préserver", "préservation"],
    ["protéger", "protection"],
    ["renforcer", "renforcement"],
    ["consolider", "consolidation"],
    ["stabiliser", "stabilisation"],
    ["équilibrer", "équilibre"],
    ["harmoniser", "harmonie"],
    ["coordonner", "coordination"],
    ["organiser", "organisation"],
    ["planifier", "planification"],
    ["programmer", "programmation"],
    ["coder", "code"],
    ["développer", "développement"],
    ["concevoir", "conception"],
    ["dessiner", "dessin"],
    ["peindre", "peinture"],
    ["sculpter", "sculpture"],
    ["modeler", "modelage"],
    ["façonner", "façonnage"],
    ["former", "formation"],
    ["déformer", "déformation"],
    ["transformer", "transformation"],
    ["modifier", "modification"],
    ["changer", "changement"],
    ["évoluer", "évolution"],
    ["progresser", "progression"],
    ["avancer", "avancement"],
    ["reculer", "recul"],
    ["stagner", "stagnation"],
    ["régresser", "régression"],
    ["décliner", "déclin"],
    ["chuter", "chute"],
    ["tomber", "tombée"],
    ["rebondir", "rebond"],
    ["remonter", "remontée"],
    ["atteindre", "atteinte"],
    ["parvenir", "parvenue"],
    ["réussir", "réussite"],
    ["échouer", "échec"],
    ["gagner", "gain"],
    ["perdre", "perte"],
    ["profiter", "profit"],
    ["bénéficier", "bénéfice"],
    ["avantager", "avantage"],
    ["désavantager", "désavantage"],
    ["nuire", "nuisance"],
    ["endommager", "dommage"],
    ["détruire", "destruction"],
    ["ravager", "ravage"],
    ["dévaster", "dévastation"],
    ["anéantir", "anéantissement"],
    ["extinctionner", "extinction"],
    ["disparaître", "disparition"],
    ["apparaître", "apparition"],
    ["surgir", "surgissement"],
    ["émerger", "émergence"],
    ["naître", "naissance"],
    ["développer", "développement"],
    ["croître", "croissance"],
    ["fleurir", "floraison"],
    ["fructifier", "fructification"],
    ["mûrir", "maturation"],
    ["récolter", "récolte"],
    ["cueillir", "cueillette"],
    ["ramasser", "ramassage"],
    ["collecter", "collection"],
    ["rassembler", "rassemblement"],
    ["réunir", "réunion"],
    ["unir", "union"],
    ["allier", "alliance"],
    ["associer", "association"],
    ["collaborer", "collaboration"],
    ["coopérer", "coopération"],
    ["participer", "participation"],
    ["contribuer", "contribution"],
    ["ajouter", "ajout"],
    ["soustraire", "soustraction"],
    ["multiplier", "multiplication"],
    ["diviser", "division"],
    ["calculer", "calcul"],
    ["compter", "compte"],
    ["mesurer", "mesure"],
    ["peser", "pesée"],
    ["évaluer", "évaluation"],
    ["estimer", "estimation"],
    ["approximer", "approximation"],
    ["préciser", "précision"],
    ["détailler", "détail"],
    ["généraliser", "généralisation"],
    ["spécialiser", "spécialisation"],
    ["focaliser", "focalisation"],
    ["concentrer", "concentration"],
    ["disperser", "dispersion"],
    ["diffuser", "diffusion"],
    ["propager", "propagation"],
    ["répandre", "répandue"],
    ["contaminer", "contamination"],
    ["polluer", "pollution"],
    ["purifier", "purification"],
    ["nettoyer", "nettoyage"],
    ["laver", "lavage"],
    ["rincer", "rinçage"],
    ["sécher", "séchage"],
    ["humidifier", "humidification"],
    ["mouiller", "mouillage"],
    ["tremper", "trempage"],
    ["imbiber", "imbibation"],
    ["saturer", "saturation"],
    ["remplir", "remplissage"],
    ["vider", "vidage"],
    ["évacuer", "évacuation"],
    ["drainer", "drainage"],
    ["filtrer", "filtration"],
    ["tamiser", "tamisage"],
    ["trier", "triage"],
    ["sélectionner", "sélection"],
    ["choisir", "choix"],
    ["élire", "élection"],
    ["nommer", "nomination"],
    ["désigner", "désignation"],
    ["indiquer", "indication"],
    ["signaler", "signalement"],
    ["marquer", "marquage"],
    ["étiqueter", "étiquetage"],
    ["catégoriser", "catégorisation"],
    ["classer", "classement"],
    ["ranger", "rangement"],
    ["ordonner", "ordonnancement"],
    ["aligner", "alignement"],
    ["centrer", "centrage"],
    ["fonder", "fondation"],
    ["bâtir", "bâtiment"],
    ["construire", "construction"],
    ["ériger", "érection"],
    ["monter", "montage"],
    ["assembler", "assemblage"],
    ["joindre", "jonction"],
    ["connecter", "connexion"],
    ["lier", "liaison"],
    ["attacher", "attachement"],
    ["fixer", "fixation"],
    ["sceller", "scellement"],
    ["souder", "soudure"],
    ["coller", "collage"],
    ["adhérer", "adhésion"],
    ["agglutiner", "agglutination"],
    ["fusionner", "fusion"],
    ["mélanger", "mélange"],
    ["combiner", "combinaison"],
    ["associer", "association"],
    ["dissocier", "dissociation"],
    ["séparer", "séparation"],
    ["diviser", "division"],
    ["fractionner", "fractionnement"],
    ["découper", "découpage"],
    ["trancher", "tranchage"],
    ["cisailler", "cisaillement"],
    ["déchirer", "déchirure"],
    ["rompre", "rupture"],
    ["briser", "brisure"],
    ["casser", "cassure"],
    ["fragmenter", "fragmentation"]
];

// Fonction d'initialisation (OBLIGATOIRE)
function initGame() {
    console.log('Initialisation du mini-jeu de connexion de mots');
    
    // 1. Récupérer les références aux éléments DOM
    gameBoard = document.getElementById('game-board');
    leftColumn = document.getElementById('left-column');
    rightColumn = document.getElementById('right-column');
    connectionsLayer = document.getElementById('connections-layer');
    
    // 2. Configurer l'état initial du jeu
    score = 0;
    currentRound = 1;
    correctConnections = 0;
    totalConnections = 0;
    
    // 3. Préparer le premier tour
    startGame();
}

// Fonction de démarrage du jeu
function startGame() {
    gameStartTime = Date.now();
    setupRound();
}

// Fonction pour configurer un tour
function setupRound() {
    // Vider les colonnes et les connexions
    leftColumn.innerHTML = '';
    rightColumn.innerHTML = '';
    connectionsLayer.innerHTML = '';
    connections = [];
    selectedWord = null;
    
    // Sélectionner les paires pour ce tour
    const shuffledPairs = [...wordPairs]
        .sort(() => Math.random() - 0.5)
        .slice(0, pairsPerRound);
    
    // Mélanger les mots pour les deux colonnes
    const leftWords = [];
    const rightWords = [];
    
    shuffledPairs.forEach((pair, index) => {
        if (index % 2 === 0) {
            leftWords.push({ word: pair[0], pairIndex: index });
            rightWords.push({ word: pair[1], pairIndex: index });
        } else {
            leftWords.push({ word: pair[1], pairIndex: index });
            rightWords.push({ word: pair[0], pairIndex: index });
        }
    });
    
    // Mélanger l'ordre d'affichage
    currentPairs = shuffledPairs;
    const shuffledLeftWords = [...leftWords].sort(() => Math.random() - 0.5);
    const shuffledRightWords = [...rightWords].sort(() => Math.random() - 0.5);
    
    // Créer les éléments visuels pour chaque colonne
    shuffledLeftWords.forEach((item, index) => {
        const wordElement = createWordElement(item.word, 'left', index, item.pairIndex);
        leftColumn.appendChild(wordElement);
    });
    
    shuffledRightWords.forEach((item, index) => {
        const wordElement = createWordElement(item.word, 'right', index, item.pairIndex);
        rightColumn.appendChild(wordElement);
    });
    
    totalConnections = 0;
}

// Fonction pour créer un élément de mot
function createWordElement(word, side, index, pairIndex) {
    const wordContainer = document.createElement('div');
    wordContainer.className = 'word-chip';
    wordContainer.dataset.word = word;
    wordContainer.dataset.side = side;
    wordContainer.dataset.index = index;
    wordContainer.dataset.pairIndex = pairIndex;
    
    const chipImage = document.createElement('img');
    chipImage.src = side === 'left' ? '/assets/images/chip_left.webp' : '/assets/images/chip_right.webp';
    chipImage.alt = 'Chip';
    
    const wordText = document.createElement('div');
    wordText.className = 'word-text';
    wordText.textContent = word;
    
    wordContainer.appendChild(chipImage);
    wordContainer.appendChild(wordText);
    
    // Ajouter l'écouteur d'événement pour la sélection
    wordContainer.addEventListener('click', handleWordSelection);
    
    return wordContainer;
}

// Gérer la sélection d'un mot
function handleWordSelection(event) {
    const wordElement = event.currentTarget;
    const word = wordElement.dataset.word;
    const side = wordElement.dataset.side;
    const index = parseInt(wordElement.dataset.index);
    const pairIndex = parseInt(wordElement.dataset.pairIndex);
    
    // Si c'est le premier mot sélectionné
    if (!selectedWord) {
        selectedWord = {
            element: wordElement,
            word: word,
            side: side,
            index: index,
            pairIndex: pairIndex
        };
        wordElement.classList.add('selected');
        return;
    }
    
    // Si c'est le même mot ou un mot du même côté, ignorer
    if (selectedWord.element === wordElement || selectedWord.side === side) {
        selectedWord.element.classList.remove('selected');
        selectedWord = null;
        return;
    }
    
    // Vérifier si c'est une paire correcte
    if (selectedWord.pairIndex === pairIndex) {
        // Paire correcte
        createConnection(selectedWord, { element: wordElement, side, index }, true);
        score += 4;
        correctConnections++;
    } else {
        // Paire incorrecte
        createConnection(selectedWord, { element: wordElement, side, index }, false);
        score = Math.max(0, score - 5); // Empêcher score négatif
    }
    
    // Mettre à jour la barre de score du template
    if (typeof updatetopbar_score === 'function') {
        updatetopbar_score(score);
    }
    
    totalConnections++;
    
    // Réinitialiser la sélection
    selectedWord.element.classList.remove('selected');
    selectedWord = null;
    
    // Vérifier si le tour est terminé
    if (correctConnections === pairsPerRound) {
        setTimeout(() => {
            if (currentRound < totalRounds) {
                currentRound++;
                correctConnections = 0;
                setupRound();
            } else {
                // Fin du jeu
                endGameWithResults();
            }
        }, 1000);
    }
}

// Créer une connexion visuelle entre deux mots
function createConnection(start, end, isCorrect) {
    // Obtenir les rectangles exacts des images à l'intérieur des containers
    const startChipImg = start.element.querySelector('img');
    const endChipImg = end.element.querySelector('img');
    
    const startImgRect = startChipImg.getBoundingClientRect();
    const endImgRect = endChipImg.getBoundingClientRect();
    const boardRect = gameBoard.getBoundingClientRect();
    
    // Points d'accroche sur les côtés des chips, en utilisant les dimensions précises des images
    let startX, startY, endX, endY;
    
    if (start.side === 'left') {
        // Pour le mot de gauche, le point d'accroche est à droite de l'image
        startX = startImgRect.right - boardRect.left;
        startY = startImgRect.top - boardRect.top + startImgRect.height / 2;
        
        // Pour le mot de droite, le point d'accroche est à gauche de l'image
        endX = endImgRect.left - boardRect.left;
        endY = endImgRect.top - boardRect.top + endImgRect.height / 2;
    } else {
        // Pour le mot de droite, le point d'accroche est à gauche de l'image
        startX = startImgRect.left - boardRect.left;
        startY = startImgRect.top - boardRect.top + startImgRect.height / 2;
        
        // Pour le mot de gauche, le point d'accroche est à droite de l'image
        endX = endImgRect.right - boardRect.left;
        endY = endImgRect.top - boardRect.top + endImgRect.height / 2;
    }
    
    // Créer la ligne SVG
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);
    
    if (isCorrect) {
        line.classList.add('connection-correct');
        connectionsLayer.appendChild(line);
        connections.push({ line, isCorrect });
    } else {
        line.classList.add('connection-incorrect');
        connectionsLayer.appendChild(line);
        
        // Supprimer la ligne incorrecte après 1 seconde
        setTimeout(() => {
            connectionsLayer.removeChild(line);
        }, 1000);
    }
}

// Fonction vide car l'affichage du score est géré par le template

// Fonction pour terminer le jeu (OBLIGATOIRE)
function endGameWithResults() {
    // 1. Arrêter les timers ou animations en cours
    
    // 2. Calculer le score final et le temps écoulé
    const tempsEcoule = Math.ceil((Date.now() - gameStartTime) / 1000);
    const scoreMaximum = totalRounds * pairsPerRound * 4;
    
    // 3. Appeler la fonction endGame du template
    window.GameEnd.endGame({
        score: score,
        maxScore: scoreMaximum,
        timeSpent: tempsEcoule
    }, resetGame);
}

// Fonction de réinitialisation du jeu (OBLIGATOIRE)
function resetGame() {
    // Réinitialiser tous les éléments du jeu
    score = 0;
    currentRound = 1;
    correctConnections = 0;
    totalConnections = 0;
    
    // Mettre à jour le score dans le template
    if (typeof updatetopbar_score === 'function') {
        updatetopbar_score(score);
    }
    
    // Préparer un nouveau jeu
    startGame();
}
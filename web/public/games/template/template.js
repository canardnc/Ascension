/**
 * Template principal pour les mini-jeux Ascension
 * Ce fichier gère la séquence d'initialisation et la logique commune à tous les mini-jeux
 */

// Configuration globale du template
const TemplateConfig = {
    // Clé pour le stockage du token d'authentification
    tokenKey: 'token',
    
    // URLs de base
    baseUrl: '/games/',
    apiUrl: '/api/',
    
    // Durée de transition entre les dialogues (ms)
    dialogueTransitionTime: 500,
    
    // Délai d'affichage des messages d'erreur (ms)
    errorDisplayTime: 5000
};

// État du jeu
const GameState = {
    // Données du jeu actuel
    gameId: 0,
    difficulty: 1,
    available: false,
    cost: 0,
    currentEnergy: 0,
    
    // État de l'interface
    dialogueIndex: 0,
    dialogueTexts: [],
    isDialogueActive: false,
    isGameLoaded: false,
    
    // Chemin de base pour les ressources du jeu
    get gamePath() {
        return `${TemplateConfig.baseUrl}game_${this.gameId}/`;
    },
    
    // NOUVEAU: Chemin spécifique à la difficulté
    get difficultyPath() {
        return `${this.gamePath}difficulty_${this.difficulty}/`;
    }
};

// Éléments DOM
const DOM = {
    // Conteneurs principaux
    backgroundContainer: document.getElementById('background-container'),
    gameContainer: document.getElementById('game-container'),
    minigameContainer: document.getElementById('minigame-container'),
    loadingOverlay: document.getElementById('loading-overlay'),
    
    // Éléments d'erreur
    errorModal: document.getElementById('error-modal'),
    errorTitle: document.getElementById('error-title'),
    errorMessage: document.getElementById('error-message'),
    quitButton: document.getElementById('quit-button'),
    
    // Éléments du professeur et dialogue
    teacherContainer: document.getElementById('teacher-container'),
    dialogueBubble: document.getElementById('dialogue-bubble'),
    dialogueText: document.getElementById('dialogue-text'),
    dialogueContinue: document.getElementById('dialogue-continue'),
    
    // Template de données
    gameData: document.getElementById('game-data')
};

/**
 * Vérifie si une ressource existe et renvoie son chemin
 * @param {string} basePath - Chemin de base à vérifier d'abord
 * @param {string} difficultyPath - Chemin spécifique à la difficulté à vérifier ensuite
 * @param {string} filename - Nom du fichier à vérifier
 * @returns {Promise<string|null>} - Chemin de la ressource trouvée ou null
 */
async function getResourcePath(basePath, difficultyPath, filename) {
    // D'abord essayer dans le répertoire de difficulté
    try {
        const difficultyUrl = `${difficultyPath}${filename}`;
        const response = await fetch(difficultyUrl, { method: 'HEAD' });
        if (response.ok) {
            console.log(`Ressource trouvée dans le répertoire de difficulté: ${difficultyUrl}`);
            return difficultyUrl;
        }
    } catch (error) {
        console.log(`Ressource non trouvée dans le répertoire de difficulté: ${difficultyPath}${filename}`);
    }
    
    // Ensuite essayer dans le répertoire de base
    try {
        const baseUrl = `${basePath}${filename}`;
        const response = await fetch(baseUrl, { method: 'HEAD' });
        if (response.ok) {
            console.log(`Ressource trouvée dans le répertoire de base: ${baseUrl}`);
            return baseUrl;
        }
    } catch (error) {
        console.log(`Ressource non trouvée dans le répertoire de base: ${basePath}${filename}`);
    }
    
    // Si rien n'est trouvé
    console.log(`Ressource non trouvée: ${filename}`);
    return null;
}

function showGameContainerAndLoad() {
    // Rendre le conteneur visible avec animation
    DOM.gameContainer.classList.add('visible');
    
    // Attendre la fin de l'animation du conteneur (800ms définie dans le CSS)
    setTimeout(() => {
        console.log('Conteneur de jeu visible, chargement du mini-jeu');
        loadMinigame();
    }, 800);
}

/**
 * Fonction d'initialisation principale
 */
async function initTemplate() {
    try {
        console.log('Initialisation du template...');
        
        // 1. Vérifier l'authentification
        if (!checkAuth()) {
            return;
        }
        
        // 2. Extraire les paramètres de l'URL
        const params = new URLSearchParams(window.location.search);
        GameState.gameId = parseInt(params.get('game_id') || '1');
        GameState.difficulty = parseInt(params.get('difficulty') || '1');
        
        // Validation des paramètres
        if (isNaN(GameState.gameId) || GameState.gameId < 0) {
            showError('Erreur', 'Identifiant de jeu invalide');
            return;
        }
        
        console.log(`Jeu #${GameState.gameId}, Difficulté: ${GameState.difficulty}`);
        
        // 3. Vérifier la disponibilité et l'énergie
        const gameStatus = await checkGameAvailability();
        if (!gameStatus) {
            return;
        }
        
        // 4. Charger l'arrière-plan du jeu
        await loadBackground();
        
        // 5. Charger les ressources du jeu (teacher, dialogues)
        await loadGameResources();
        
        // 6. S'assurer que le conteneur de jeu est masqué au départ
DOM.gameContainer.classList.remove('visible');

        // 7. Démarrer la séquence de dialogue si disponible
        if (GameState.dialogueTexts.length > 0) {
            startDialogueSequence();
        } else {
            // Pas de dialogues, charger directement le jeu
            loadMinigame();
        }
        
        // 8. Masquer l'écran de chargement
        hideLoadingScreen();
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showError('Erreur', 'Une erreur est survenue lors du chargement du jeu');
    }
}

/**
 * Vérifie la disponibilité et l'énergie pour le jeu actuel
 * @returns {Promise<boolean>} Vrai si le jeu est disponible et l'énergie suffisante
 */
async function checkGameAvailability() {
    try {
        // Récupérer les données du mini-jeu et l'énergie du joueur
        const response = await fetchWithAuth(`${TemplateConfig.apiUrl}minigame/status?game_id=${GameState.gameId}&difficulty=${GameState.difficulty}`);
        
        if (!response) {
            showError('Erreur', 'Impossible de récupérer les informations du jeu');
            return false;
        }
        
        GameState.available = response.available;
        GameState.cost = response.cost;
        GameState.currentEnergy = response.currentEnergy;
        
        // Si le jeu n'est pas disponible pour ce joueur
        if (!GameState.available) {
            showError('Accès limité', 'Vous n\'avez pas accès à ce mini-jeu');
            return false;
        }
        
        // Si le joueur n'a pas assez d'énergie
        if (GameState.currentEnergy < GameState.cost) {
            showError('Énergie insuffisante', `Vous n'avez pas assez d'énergie pour jouer à ce mini-jeu (${GameState.currentEnergy}/${GameState.cost})`);
            return false;
        }
        
        // Mettre à jour les données du jeu dans le template
        updateGameData();
        
        console.log('Vérification réussie: jeu disponible et énergie suffisante');
        return true;
        
    } catch (error) {
        console.error('Erreur lors de la vérification de la disponibilité:', error);
        showError('Erreur', 'Impossible de vérifier la disponibilité du jeu');
        return false;
    }
}

/**
 * Charge l'arrière-plan spécifique au jeu / difficulté
 */
async function loadBackground() {
    try {
        // Essayer de trouver l'arrière-plan dans le répertoire de difficulté ou de base
        const backgroundUrl = await getResourcePath(
            GameState.gamePath,
            GameState.difficultyPath,
            'background.webp'
        );
        
        if (backgroundUrl) {
            // Charger l'arrière-plan spécifique trouvé
            DOM.backgroundContainer.style.backgroundImage = `url('${backgroundUrl}')`;
            console.log(`Arrière-plan chargé: ${backgroundUrl}`);
        } else {
            // Utiliser un arrière-plan par défaut
            DOM.backgroundContainer.style.backgroundImage = 'url("/assets/images/background/default.jpg")';
            console.log('Utilisation de l\'arrière-plan par défaut');
        }
    } catch (error) {
        console.error('Erreur lors du chargement de l\'arrière-plan:', error);
        // Continuer malgré l'erreur, l'arrière-plan n'est pas essentiel
    }
}

/**
 * Charge toutes les ressources nécessaires pour le jeu
 */
async function loadGameResources() {
    try {
        console.log('Chargement des ressources du jeu...');
        
        // Essayer de charger l'image du personnage/professeur
        try {
            // Vérifier dans le répertoire de difficulté puis dans le répertoire de base
            const teacherUrl = await getResourcePath(
                GameState.gamePath,
                GameState.difficultyPath,
                'teacher.webp'
            );
            
            if (teacherUrl) {
                // Créer l'élément d'image
                const teacherImage = document.createElement('img');
                teacherImage.src = teacherUrl;
                teacherImage.alt = 'Professeur';
                
                // Ajouter au conteneur et afficher
                DOM.teacherContainer.appendChild(teacherImage);
                DOM.teacherContainer.classList.add('active');
                
                console.log('Image du professeur chargée');
            } else {
                console.log('Aucune image de professeur trouvée');
            }
        } catch (e) {
            console.log('Erreur lors du chargement de l\'image du professeur:', e);
        }
        
        // Charger les textes de dialogue
        GameState.dialogueTexts = await loadDialogueTexts();
        console.log(`${GameState.dialogueTexts.length} dialogues chargés`);
        
    } catch (error) {
        console.error('Erreur lors du chargement des ressources:', error);
        // Continuer malgré l'erreur, les ressources ne sont pas essentielles
    }
}

/**
 * Charge les textes de dialogue depuis les fichiers text_X.txt
 * @returns {Promise<string[]>} Liste des textes de dialogue
 */
async function loadDialogueTexts() {
    const texts = [];
    let index = 1;
    let continueLoading = true;
    
    while (continueLoading) {
        try {
            // Construction des chemins possibles
            const baseTextPath = `${GameState.gamePath}text_${index}.txt`;
            const difficultyTextPath = `${GameState.difficultyPath}text_${index}.txt`;
            
            // Essayer d'abord le chemin de difficulté
            let textExists = false;
            let textPath = '';
            
            try {
                const response = await fetch(difficultyTextPath, { method: 'HEAD' });
                if (response.ok) {
                    textExists = true;
                    textPath = difficultyTextPath;
                    console.log(`Texte trouvé dans le répertoire de difficulté: text_${index}.txt`);
                }
            } catch (e) {
                // Ignorer l'erreur et essayer le chemin de base
            }
            
            // Si pas trouvé dans le répertoire de difficulté, essayer le répertoire de base
            if (!textExists) {
                try {
                    const response = await fetch(baseTextPath, { method: 'HEAD' });
                    if (response.ok) {
                        textExists = true;
                        textPath = baseTextPath;
                        console.log(`Texte trouvé dans le répertoire de base: text_${index}.txt`);
                    }
                } catch (e) {
                    // Ignorer l'erreur, le texte n'existe pas
                }
            }
            
            if (textExists) {
                const response = await fetch(textPath);
                const text = await response.text();
                texts.push(text);
                index++;
            } else {
                continueLoading = false;
            }
        } catch (error) {
            console.log(`Fin des textes de dialogue à l'index ${index}`);
            continueLoading = false;
        }
    }
    
    return texts;
}

/**
 * Démarre la séquence de dialogue
 */
function startDialogueSequence() {
    GameState.dialogueIndex = 0;
    GameState.isDialogueActive = true;
    
    // Remplacer loadTextBubbleImage() par createSvgBubble()
    createSvgBubble();
    
    showNextDialogue();
    
    // Ajouter un écouteur d'événement pour passer au dialogue suivant
    document.addEventListener('click', handleDialogueClick);
}

// Fonction pour créer la bulle SVG
function createSvgBubble() {
    // Supprimer toute bulle existante d'abord
    const existingBubbleSvg = DOM.dialogueBubble.querySelector('svg');
    if (existingBubbleSvg) {
        existingBubbleSvg.remove();
    }
    
    // Supprimer l'image de fond s'il y en a une
    DOM.dialogueBubble.style.backgroundImage = 'none';
    
    // Créer l'élément SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('class', 'dialogue-bubble-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('viewBox', '0 0 100 100');
    
    // Créer le path pour la bulle avec des coins très arrondis
    // mais conservant une pointe angulaire
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('d', 'M 15,5 H 85 Q 100,5 100,20 V 65 Q 100,80 85,80 H 80 L 85,95 L 70,80 H 15 Q 0,80 0,65 V 20 Q 0,5 15,5 Z');
    path.setAttribute('fill', 'rgba(255, 255, 255, 0.9)');
    path.setAttribute('stroke', '#4a6ee0');
    path.setAttribute('stroke-width', '2');
    
    // Ajouter le path au SVG
    svg.appendChild(path);
    
    // Ajouter le SVG à la bulle de dialogue
    DOM.dialogueBubble.prepend(svg);
}

// Fonction pour ajuster la taille de la bulle au contenu
function adjustBubbleSize() {
    // Calculer la hauteur nécessaire pour le contenu
    const textHeight = DOM.dialogueText.scrollHeight;
    const continueHeight = DOM.dialogueContinue.scrollHeight;
    const contentHeight = textHeight + continueHeight + 40; // 40px pour le padding
    
    // Définir la hauteur minimale (150px par défaut)
    const minHeight = 150;
    const height = Math.max(minHeight, contentHeight);
    
    // Appliquer la hauteur à la bulle
    DOM.dialogueBubble.style.height = `${height}px`;
}

// Fonction modifiée pour afficher le dialogue suivant
function showNextDialogue() {
    if (GameState.dialogueIndex >= GameState.dialogueTexts.length) {
        endDialogueSequence();
        return;
    }
    
    const text = GameState.dialogueTexts[GameState.dialogueIndex];
    DOM.dialogueText.textContent = text;
    
    // Créer la bulle SVG
    createSvgBubble();
    
    // Afficher la bulle
    DOM.dialogueBubble.classList.remove('hidden');
    
    // Laisser le DOM se mettre à jour
    setTimeout(() => {
        // Ajuster la taille de la bulle au contenu
        adjustBubbleSize();
        
        // Après ajustement, rendre la bulle visible avec animation
        DOM.dialogueBubble.classList.add('active');
    }, 10);
}

/**
 * Gestionnaire de clic pour passer au dialogue suivant
 */
function handleDialogueClick() {
    if (!GameState.isDialogueActive) return;
    
    // Masquer le dialogue actuel
    DOM.dialogueBubble.classList.remove('active');
    
    // Attendre la fin de la transition
    setTimeout(() => {
        GameState.dialogueIndex++;
        
        if (GameState.dialogueIndex < GameState.dialogueTexts.length) {
            showNextDialogue();
        } else {
            endDialogueSequence();
        }
    }, TemplateConfig.dialogueTransitionTime);
}

/**
 * Termine la séquence de dialogue et charge le mini-jeu
 */
function endDialogueSequence() {
    GameState.isDialogueActive = false;
    DOM.dialogueBubble.classList.add('hidden');
    
    // Supprimer l'écouteur d'événement
    document.removeEventListener('click', handleDialogueClick);
    
    // Au lieu de charger directement le mini-jeu, on effectue la transition du professeur
    transitionTeacherAndLoadGame();
}

function transitionTeacherAndLoadGame() {
    console.log('Transition du professeur avant chargement du jeu...');
    
    // Vérifier si l'élément du professeur existe
    const hasTeacher = DOM.teacherContainer && DOM.teacherContainer.querySelector('img');
    
    if (hasTeacher) {
        // Ajouter la classe pour minimiser le professeur avec animation
        DOM.teacherContainer.classList.add('minimized');
        
        // Attendre la fin de la transition du professeur (800ms définie dans le CSS)
        setTimeout(() => {
            console.log('Transition du professeur terminée, affichage du conteneur de jeu');
            showGameContainerAndLoad();
        }, 800);
    } else {
        // Pas de professeur, passer directement à l'affichage du conteneur
        showGameContainerAndLoad();
    }
}

/**
 * Charge le contenu du mini-jeu
 */
async function loadMinigame() {
    try {
        console.log('Chargement du mini-jeu...');
        
        // Essayer d'abord de charger le mini-jeu depuis le répertoire de difficulté
        let response;
        let html;
        let fromDifficultyFolder = false;
        
        try {
            response = await fetch(`${GameState.difficultyPath}index.html`);
            if (response.ok) {
                html = await response.text();
                fromDifficultyFolder = true;
                console.log(`Mini-jeu chargé depuis le répertoire de difficulté: ${GameState.difficultyPath}index.html`);
            }
        } catch (error) {
            console.log('Mini-jeu non trouvé dans le répertoire de difficulté, tentative dans le répertoire de base...');
        }
        
        // Si pas trouvé dans le répertoire de difficulté, essayer le répertoire de base
        if (!fromDifficultyFolder) {
            response = await fetch(`${GameState.gamePath}index.html`);
            html = await response.text();
            console.log(`Mini-jeu chargé depuis le répertoire de base: ${GameState.gamePath}index.html`);
        }
        
        // Injecter le HTML dans le conteneur
        DOM.minigameContainer.innerHTML = html;
        DOM.minigameContainer.style.display = 'block';
        
        // Déduire l'énergie (cette opération est simulée ici, normalement gérée par le serveur)
        console.log(`Déduction de ${GameState.cost} points d'énergie`);
        
        // Marquer le jeu comme chargé
        GameState.isGameLoaded = true;
        
        console.log('Mini-jeu chargé avec succès');
        
        // Charger le script JavaScript approprié
        await loadGameScript(fromDifficultyFolder);
        
    } catch (error) {
        console.error('Erreur lors du chargement du mini-jeu:', error);
        showError('Erreur', 'Impossible de charger le contenu du mini-jeu');
    }
}

/**
 * Charge le script JavaScript du mini-jeu
 * @param {boolean} fromDifficultyFolder - Indique si le HTML provient du dossier de difficulté
 */
async function loadGameScript(fromDifficultyFolder) {
    try {
        // Chemin du script basé sur le dossier d'où provient le HTML
        const scriptPath = fromDifficultyFolder 
            ? `${GameState.difficultyPath}script.js` 
            : `${GameState.gamePath}script.js`;
        
        console.log(`Chargement du script: ${scriptPath}`);
        
        // Créer un élément script
        const script = document.createElement('script');
        script.src = scriptPath;
        
        // Promesse pour attendre le chargement du script
        const scriptLoaded = new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });
        
        // Ajouter le script au document
        document.body.appendChild(script);
        
        // Attendre le chargement
        await scriptLoaded;
        
        console.log('Script chargé avec succès');
        
        // Appeler la fonction d'initialisation du jeu si elle existe
        if (typeof initGame === 'function') {
            console.log('Initialisation du jeu...');
            initGame();
        } else {
            console.warn("Fonction initGame non trouvée dans le script du jeu");
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement du script du jeu:', error);
        showError('Erreur', 'Impossible de charger le script du mini-jeu');
    }
}

/**
 * Vérifie si une ressource existe
 * @param {string} url - URL de la ressource à vérifier
 * @returns {Promise<boolean>} Vrai si la ressource existe
 */
async function resourceExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Affiche un message d'erreur et le bouton pour quitter
 * @param {string} title - Titre de l'erreur
 * @param {string} message - Message d'erreur
 */
function showError(title, message) {
    DOM.errorTitle.textContent = title;
    DOM.errorMessage.textContent = message;
    DOM.errorModal.classList.add('active');
    
    // Masquer l'écran de chargement
    hideLoadingScreen();
}

/**
 * Masque l'écran de chargement
 */
function hideLoadingScreen() {
    DOM.loadingOverlay.classList.add('hidden');
    
    // Supprimer complètement après la transition
    setTimeout(() => {
        DOM.loadingOverlay.style.display = 'none';
    }, 500);
}

/**
 * Met à jour les données du jeu dans le template
 */
function updateGameData() {
    const gameDataJson = {
        gameId: GameState.gameId,
        difficulty: GameState.difficulty,
        available: GameState.available,
        cost: GameState.cost,
        currentEnergy: GameState.currentEnergy,
        categoryType: 'strength' // ← AJOUT IMPORTANT

    };

    // Si l’élément existe déjà, on le met à jour
    if (DOM.gameData) {
        DOM.gameData.textContent = JSON.stringify(gameDataJson, null, 2);
    } else {
        // Sinon on le crée manuellement
        const script = document.createElement('script');
        script.id = 'game-data';
        script.type = 'application/json';
        script.textContent = JSON.stringify(gameDataJson, null, 2);
        document.body.appendChild(script);
    }
}


/**
 * Vérifie si l'utilisateur est authentifié
 * @returns {boolean} Vrai si l'utilisateur est authentifié
 */
function checkAuth() {
    const token = localStorage.getItem(TemplateConfig.tokenKey);
    if (!token) {
        console.error('Utilisateur non authentifié');
        window.location.href = '/';
        return false;
    }
    return true;
}

/**
 * Fonction utilitaire pour retourner à la page d'entraînement
 */
function exitGame() {
    // Rediriger vers la page d'entraînement (force par défaut)
    window.location.href = `/training.html?type=strength`;
}

// Écouteurs d'événements
document.addEventListener('DOMContentLoaded', () => {
    // Bouton pour quitter le jeu
    DOM.quitButton.addEventListener('click', exitGame);
    
    // Lancer l'initialisation
    initTemplate();
});

// Exposer certaines fonctions pour les mini-jeux
window.GameTemplate = {
    exitGame,
    gameState: GameState,
    config: TemplateConfig
};
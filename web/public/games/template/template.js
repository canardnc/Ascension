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
        
        // 6. Démarrer la séquence de dialogue si disponible
        if (GameState.dialogueTexts.length > 0) {
            startDialogueSequence();
        } else {
            // Pas de dialogues, charger directement le jeu
            loadMinigame();
        }
        
        // 7. Masquer l'écran de chargement
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
 * Charge l'arrière-plan spécifique au jeu
 */
async function loadBackground() {
    try {
        // Vérifier si le jeu a un arrière-plan personnalisé
        const backgroundExists = await resourceExists(`${GameState.gamePath}background.webp`);
        
        if (backgroundExists) {
            // Charger l'arrière-plan spécifique au jeu
            DOM.backgroundContainer.style.backgroundImage = `url('${GameState.gamePath}background.webp')`;
            console.log(`Arrière-plan spécifique chargé: ${GameState.gamePath}background.webp`);
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
            const teacherExists = await resourceExists(`${GameState.gamePath}teacher.webp`);
            
            if (teacherExists) {
                // Créer l'élément d'image
                const teacherImage = document.createElement('img');
                teacherImage.src = `${GameState.gamePath}teacher.webp`;
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
            const textExists = await resourceExists(`${GameState.gamePath}text_${index}.txt`);
            
            if (textExists) {
                const response = await fetch(`${GameState.gamePath}text_${index}.txt`);
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
    
    // Charger l'image de bulle de texte
    loadTextBubbleImage();
    
    showNextDialogue();
    
    // Ajouter un écouteur d'événement pour passer au dialogue suivant
    document.addEventListener('click', handleDialogueClick);
}

/**
 * Charge l'image de la bulle de texte
 */
async function loadTextBubbleImage() {
    try {
        const textBubbleExists = await resourceExists(`${GameState.gamePath}text.webp`);
        
        if (textBubbleExists) {
            // Créer l'élément d'image de bulle de texte
            DOM.dialogueBubble.style.backgroundImage = `url('${GameState.gamePath}text.webp')`;
            console.log('Image de bulle de texte chargée');
        } else {
            // Utiliser l'image par défaut
            console.log('Utilisation de l\'image de bulle par défaut');
        }
    } catch (error) {
        console.error('Erreur lors du chargement de l\'image de bulle:', error);
    }
}

/**
 * Affiche le dialogue suivant dans la séquence
 */
function showNextDialogue() {
    if (GameState.dialogueIndex >= GameState.dialogueTexts.length) {
        endDialogueSequence();
        return;
    }
    
    const text = GameState.dialogueTexts[GameState.dialogueIndex];
    DOM.dialogueText.textContent = text;
    DOM.dialogueBubble.classList.remove('hidden');
    DOM.dialogueBubble.classList.add('active');
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
    
    // Charger le mini-jeu
    loadMinigame();
}

/**
 * Charge le contenu du mini-jeu
 */
async function loadMinigame() {
    try {
        console.log('Chargement du mini-jeu...');
        
        // Charger le contenu HTML du mini-jeu
        const response = await fetch(`${GameState.gamePath}index.html`);
        const html = await response.text();
        
        // Injecter le HTML dans le conteneur
        DOM.minigameContainer.innerHTML = html;
        DOM.minigameContainer.style.display = 'block';
        
        // Déduire l'énergie (cette opération est simulée ici, normalement gérée par le serveur)
        console.log(`Déduction de ${GameState.cost} points d'énergie`);
        
        // Marquer le jeu comme chargé
        GameState.isGameLoaded = true;
        
        console.log('Mini-jeu chargé avec succès');
        
        // Lancer tout script d'initialisation spécifique au mini-jeu
        if (typeof initGame === 'function') {
            initGame();
        }
    } catch (error) {
        console.error('Erreur lors du chargement du mini-jeu:', error);
        showError('Erreur', 'Impossible de charger le contenu du mini-jeu');
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
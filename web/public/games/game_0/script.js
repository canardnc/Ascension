// Variables du jeu
let timer = 10;
let timerInterval = null;
let isGameRunning = false;
let gameScore = 0;
let gameStartTime = 0;

// Éléments DOM
let timerDisplay;
let startButton;
let resetButton;
let statusMessage;

// Fonction d'initialisation du jeu
function initGame() {
    console.log('Initialisation du mini-jeu exemple');
    
    // Récupérer les éléments DOM
    timerDisplay = document.getElementById('timer');
    startButton = document.getElementById('start-button');
    resetButton = document.getElementById('reset-button');
    statusMessage = document.getElementById('status-message');
    
    // Vérifier que les éléments ont été trouvés
    if (!timerDisplay || !startButton || !resetButton || !statusMessage) {
        console.error("Impossible de trouver tous les éléments DOM nécessaires");
        return;
    }
    
    // Afficher des informations de débogage
    console.log('window.GameEnd disponible?', !!window.GameEnd);
    if (window.GameEnd) {
        console.log('window.GameEnd.endGame disponible?', typeof window.GameEnd.endGame === 'function');
    }
    
    // Écouteurs d'événements
    startButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetGame);
    
    // Afficher le statut initial
    statusMessage.textContent = "Prêt à commencer !";
    
    console.log('Mini-jeu exemple initialisé avec succès');
}

// Fonction pour démarrer le jeu
function startGame() {
    console.log('Démarrage du jeu...');
    
    if (isGameRunning) {
        console.log('Le jeu est déjà en cours');
        return;
    }
    
    // Réinitialiser les valeurs
    timer = 10;
    gameScore = 0;
    gameStartTime = Date.now();
    isGameRunning = true;
    
    // Mettre à jour l'interface
    timerDisplay.textContent = timer;
    startButton.disabled = true;
    resetButton.disabled = false;
    statusMessage.textContent = "Jeu en cours...";
    
    // Démarrer le compte à rebours
    timerInterval = setInterval(updateTimer, 1000);
    
    console.log('Compte à rebours démarré');
}

// Fonction pour mettre à jour le compte à rebours
function updateTimer() {
    timer--;
    timerDisplay.textContent = timer;
    
    console.log(`Temps restant: ${timer} secondes`);
    
    if (timer <= 0) {
        endGameWithResults();
    }
}

// Fonction pour terminer le jeu et afficher les résultats
function endGameWithResults() {
    console.log('Fin du jeu! Tentative d\'affichage de l\'écran de fin');
    
    // Arrêter le timer
    clearInterval(timerInterval);
    isGameRunning = false;
    
    // Calculer le temps écoulé
    const timeSpent = Math.ceil((Date.now() - gameStartTime) / 1000);
    
    // Calculer un score fictif (pour l'exemple)
    gameScore = 100;
    
    // Afficher le message final
    statusMessage.textContent = "Jeu terminé !";
    
    // Mettre à jour l'interface
    startButton.disabled = false;
    
    console.log(`Score final: ${gameScore}, Temps: ${timeSpent}s`);
    
    // Utiliser la fonction de fin de jeu du template
    try {
        if (window.GameEnd && typeof window.GameEnd.endGame === 'function') {
            console.log('Appel de window.GameEnd.endGame');
            
            window.GameEnd.endGame({
                score: gameScore,             // Score obtenu
                maxScore: 100,                // Score maximum possible
                timeSpent: timeSpent          // Temps passé en secondes
            }, resetGame);
            
            console.log('Appel de window.GameEnd.endGame terminé');
        } else {
            // Solution alternative si GameEnd n'est pas disponible
            console.error("GameEnd non disponible, tentative de solution alternative");
            
            // Essayer d'accéder à l'objet via le template
            if (window.GameTemplate && window.GameTemplate.config) {
                console.log('Tentative via window.parent');
                
                // Essayer d'utiliser showEndgameScreen directement
                if (typeof window.showEndgameScreen === 'function') {
                    window.showEndgameScreen(
                        gameScore,
                        100,
                        'strength',
                        resetGame,
                        {
                            minigameId: 0,
                            difficultyLevel: 1,
                            timeSpent: timeSpent
                        }
                    );
                }
            }
        }
    } catch (error) {
        console.error("Erreur lors de l'appel à endGame:", error);
        
        // Afficher l'erreur dans le DOM pour le débogage
        statusMessage.textContent = "Erreur: " + error.message;
    }
}

// Fonction pour réinitialiser le jeu
function resetGame() {
    console.log('Réinitialisation du jeu');
    
    // Arrêter le timer si en cours
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Réinitialiser les valeurs
    timer = 10;
    isGameRunning = false;
    
    // Mettre à jour l'interface
    timerDisplay.textContent = timer;
    startButton.disabled = false;
    resetButton.disabled = true;
    statusMessage.textContent = "Jeu réinitialisé. Prêt à recommencer !";
}
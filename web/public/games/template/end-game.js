/**
 * Gestion de la fin du jeu pour tous les mini-jeux
 * Ce fichier définit les fonctions pour terminer un mini-jeu et envoyer les résultats au serveur
 */

/**
 * Termine le mini-jeu et envoie les résultats au serveur
 * @param {Object} gameData - Données du jeu à envoyer
 * @param {number} gameData.score - Score obtenu dans le jeu
 * @param {number} gameData.maxScore - Score maximum possible
 * @param {number} gameData.timeSpent - Temps passé en secondes
 * @param {Function} resetGameFunction - Fonction pour réinitialiser le jeu
 */
function endGame(gameData, resetGameFunction) {
    if (!gameData || typeof gameData !== 'object') {
        console.error('Les données de jeu sont requises pour terminer le jeu');
        return;
    }
    
    // Récupérer les données du jeu depuis le template
    const templateData = getGameData();
    
    // Valider les données requises
    if (
        !templateData ||
        typeof templateData.gameId !== 'number' ||
        typeof templateData.difficulty !== 'number'
    ) {
        console.error('Données du template invalides');
        return;
    }
    
    // Récupérer la catégorie du jeu
    const categoryType = templateData.categoryType || 'strength';
    
    // Créer l'objet de données complet
    const completeGameData = {
        minigameId: templateData.gameId,
        difficultyLevel: templateData.difficulty,
        score: gameData.score || 0,
        timeSpent: gameData.timeSpent || 0
    };
    
    // Valider les données
    if (completeGameData.score < 0) {
        console.error('Le score ne peut pas être négatif');
        completeGameData.score = 0;
    }
    
    if (completeGameData.timeSpent <= 0) {
        console.warn('Le temps passé doit être positif, utilisation de la valeur par défaut (10 secondes)');
        completeGameData.timeSpent = 10;
    }
    
    // Appeler la fonction standard de fin de jeu du minigame-utils.js
    showEndgameScreen(
        completeGameData.score,              // Score obtenu
        gameData.maxScore || 100,            // Score maximum possible
        categoryType,                        // Catégorie du mini-jeu
        resetGameFunction || defaultReset,   // Fonction pour réinitialiser le jeu
        completeGameData                     // Données complètes à envoyer
    );
    
    console.log('Jeu terminé avec les données:', completeGameData);
}

/**
 * Fonction de réinitialisation par défaut si aucune n'est fournie
 */
function defaultReset() {
    console.log('Réinitialisation du jeu (fonction par défaut)');
    window.location.reload();
}

/**
 * Récupère les données du jeu depuis le template
 * @returns {Object} Données du jeu
 */
function getGameData() {
    try {
        // Essayer de trouver le script dans le parent (template)
        const gameDataElement =
            document.getElementById('game-data') ||
            window.parent?.document.getElementById('game-data');

        if (!gameDataElement) {
            console.error('Élément game-data non trouvé dans le DOM');
            return null;
        }

        const data = JSON.parse(gameDataElement.textContent);
        console.log('📦 Données du template récupérées :', data);
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des données du jeu:', error);
        return null;
    }
}

/**
 * Calcule le score en pourcentage
 * @param {number} score - Score obtenu
 * @param {number} maxScore - Score maximum possible
 * @returns {number} Pourcentage (0-100)
 */
function calculatePercentage(score, maxScore) {
    if (!maxScore || maxScore <= 0) return 0;
    return Math.min(100, Math.max(0, (score / maxScore) * 100));
}



async function loadMinigame() {
    try {
        console.log('Chargement du mini-jeu...');
        
        // Charger le contenu HTML du mini-jeu
        const response = await fetch(`${GameState.gamePath}index.html`);
        const html = await response.text();
        
        // Injecter le HTML dans le conteneur
        DOM.minigameContainer.innerHTML = html;
        DOM.minigameContainer.style.display = 'block';
        
        // Charger dynamiquement le script du jeu
        console.log(`Chargement du script: ${GameState.gamePath}script.js`);
        
        // Créer un élément script et le configurer
        const script = document.createElement('script');
        script.src = `${GameState.gamePath}script.js`;
        
        // Définir le callback onload
        script.onload = () => {
            console.log('Script chargé avec succès');
            
            // Appeler la fonction d'initialisation du jeu si elle existe
            if (typeof initGame === 'function') {
                console.log('Initialisation du jeu...');
                initGame();
            } else {
                console.error("Fonction initGame non trouvée dans le script du jeu");
            }
        };
        
        // Gérer les erreurs de chargement
        script.onerror = (error) => {
            console.error('Erreur lors du chargement du script:', error);
            showError('Erreur', 'Impossible de charger le script du mini-jeu');
        };
        
        // Ajouter le script au document
        document.body.appendChild(script);
        
        // Déduire l'énergie (cette opération est simulée ici, normalement gérée par le serveur)
        console.log(`Déduction de ${GameState.cost} points d'énergie`);
        
        // Marquer le jeu comme chargé
        GameState.isGameLoaded = true;
        
        console.log('Mini-jeu chargé avec succès');
        
    } catch (error) {
        console.error('Erreur lors du chargement du mini-jeu:', error);
        showError('Erreur', 'Impossible de charger le contenu du mini-jeu');
    }
}

function calculateStars(percentage) {
    if (percentage >= 95) return 3;
    if (percentage >= 66) return 2;
    if (percentage >= 30) return 1;
    return 0;
}

// Exposer les fonctions globalement
window.GameEnd = {
    endGame,
    calculatePercentage,
    calculateStars
};
/**
 * Gestion de la fin du jeu pour tous les mini-jeux
 * Ce fichier définit les fonctions pour terminer un mini-jeu et envoyer les résultats au serveur
 */

/**
 * Enregistre la fin d'une session de jeu
 * @param {number} sessionId - ID de la session à terminer
 * @param {number} score - Score final obtenu
 * @param {number} timeSpent - Temps passé en secondes
 * @returns {Promise} Promise résolue si l'opération réussit
 */
async function endGameSession(sessionId, score, timeSpent) {
    if (!sessionId) {
        console.warn('Aucun ID de session disponible pour la fin du jeu');
        return Promise.resolve();
    }
    
    try {
        const response = await fetchWithAuth('/api/minigame/end-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: sessionId,
                score: score,
                duration: timeSpent
            })
        });
        
        if (response && response.success) {
            console.log(`Session de jeu ${sessionId} terminée avec succès`);
            return Promise.resolve();
        } else {
            console.error('Erreur lors de la fin de la session:', response);
            return Promise.reject(new Error('Erreur lors de la fin de la session'));
        }
    } catch (error) {
        console.error('Erreur lors de l\'appel à end-session:', error);
        return Promise.reject(error);
    }
}

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
        timeSpent: gameData.timeSpent || 0,
        sessionId: templateData.sessionId || null
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
    
    // Enregistrer la fin de la session si un ID est disponible
    if (completeGameData.sessionId) {
        endGameSession(completeGameData.sessionId, completeGameData.score, completeGameData.timeSpent)
            .then(() => {
                // Appeler la fonction standard de fin de jeu du minigame-utils.js
                showEndgameScreen(
                    completeGameData.score,              // Score obtenu
                    gameData.maxScore || 100,            // Score maximum possible
                    categoryType,                        // Catégorie du mini-jeu
                    resetGameFunction || defaultReset,   // Fonction pour réinitialiser le jeu
                    completeGameData                     // Données complètes à envoyer
                );
            })
            .catch(error => {
                console.error('Erreur lors de la fin de session:', error);
                // Continuer quand même avec l'écran de fin
                showEndgameScreen(
                    completeGameData.score,
                    gameData.maxScore || 100,
                    categoryType,
                    resetGameFunction || defaultReset,
                    completeGameData
                );
            });
    } else {
        // Pas d'ID de session, afficher directement l'écran de fin
        showEndgameScreen(
            completeGameData.score,
            gameData.maxScore || 100,
            categoryType,
            resetGameFunction || defaultReset,
            completeGameData
        );
    }
    
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
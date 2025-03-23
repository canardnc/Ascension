/**
 * Utilitaires communs pour tous les mini-jeux
 */

/**
 * Enregistre les résultats d'un mini-jeu et met à jour les statistiques du joueur
 * 
 * @param {Object} results - Les données du résultat
 * @param {number} results.minigameId - ID du mini-jeu
 * @param {number} results.difficultyLevel - Niveau de difficulté (1, 2, 3, etc.)
 * @param {number} results.score - Score obtenu
 * @param {number} results.timeSpent - Temps passé en secondes
 * @returns {Promise} - Promesse résolue avec les données de résultat
 */
async function saveMinigameResults(results) {
    // Récupérer le token d'authentification
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Erreur d'authentification: aucun token trouvé");
        throw new Error("Vous devez être connecté pour enregistrer vos résultats");
    }

    try {
        // Convertir le temps passé de secondes en minutes pour la base de données
        const timeSpentMinutes = Math.ceil(results.timeSpent / 60);
        
        // Appeler l'API pour enregistrer les résultats
        const response = await fetch('/api/minigame/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                minigameId: results.minigameId,
                difficultyLevel: results.difficultyLevel,
                score: results.score,
                timeSpent: timeSpentMinutes
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Erreur lors de l'enregistrement des résultats");
        }

        const data = await response.json();
        
        // Stocker les résultats pour l'animation après redirection
        if (data.success) {
            localStorage.setItem('lastMinigameResults', JSON.stringify({
                minigameId: results.minigameId,
                difficultyLevel: results.difficultyLevel,
                scoreBefore: data.scoreBefore,
                scoreAfter: data.scoreAfter,
                newStars: data.newStars
            }));
        }
        
        return data;
    } catch (error) {
        console.error("Erreur lors de l'enregistrement des résultats:", error);
        throw error;
    }
}

/**
 * Affiche l'écran de fin de jeu commun à tous les mini-jeux
 * 
 * @param {number} score - Score obtenu
 * @param {number} maxScore - Score maximum possible
 * @param {string} categoryType - Type de catégorie ('strength', 'endurance', 'recovery', 'agility')
 * @param {Function} resetGameFunction - Fonction pour réinitialiser le jeu
 * @param {Object} gameData - Données du jeu
 * @param {number} gameData.minigameId - ID du mini-jeu
 * @param {number} gameData.difficultyLevel - Niveau de difficulté
 * @param {number} gameData.timeSpent - Temps passé en secondes
 */
function showEndgameScreen(score, maxScore, categoryType, resetGameFunction, gameData) {
    // Calculer le pourcentage de réussite
    const percentage = (score / maxScore) * 100;
    
    // Déterminer le nombre d'étoiles (0-3)
    let stars = 0;
    if (percentage >= 95) {
        stars = 3;
    } else if (percentage >= 66) {
        stars = 2;
    } else if (percentage >= 30) {
        stars = 1;
    }
    
    // Déterminer le message selon le nombre d'étoiles
    let message = '';
    switch (stars) {
        case 3:
            message = 'Parfait ! Tu as maîtrisé cet exercice !';
            break;
        case 2:
            message = 'Excellent travail ! Continue comme ça !';
            break;
        case 1:
            message = 'Bon début ! Continue à t\'entraîner !';
            break;
        default:
            message = 'Continue à pratiquer, tu t\'amélioreras !';
    }
    
    // Créer un conteneur modal s'il n'existe pas déjà
    let modalContainer = document.getElementById('endgame-modal-container');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'endgame-modal-container';
        document.body.appendChild(modalContainer);
    }
    
    // Appliquer les styles CSS au conteneur modal
    const modalStyle = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    modalContainer.style.cssText = modalStyle;
    
    // Créer le contenu HTML du modal
    modalContainer.innerHTML = `
        <div style="background-color: #1f1f3a; border-radius: 15px; padding: 20px; text-align: center; max-width: 500px; width: 90%;">
            <h2 style="font-size: 24px; margin-bottom: 10px; color: white;">${stars === 3 ? '🎉 Bravo ! 🎉' : 'Terminé !'}</h2>
            <p style="font-size: 16px; margin-bottom: 20px; color: #ccc;">${message}</p>
            
            <div style="display: flex; justify-content: center; margin: 20px 0;">
                ${Array(3).fill().map((_, i) => 
                    `<div style="font-size: 40px; color: ${i < stars ? 'gold' : '#444'}; margin: 0 10px;">★</div>`
                ).join('')}
            </div>
            
            <div style="font-size: 20px; margin: 15px 0; color: white;">
                Score: <span style="font-weight: bold; color: #6542fe;">${score}</span> / ${maxScore}
            </div>
            
            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 30px;">
                <button id="endgame-retry-btn" style="background: linear-gradient(45deg, #6542fe, #a16bff); border: none; color: white; padding: 10px 25px; border-radius: 25px; font-size: 16px; cursor: pointer;">Rejouer</button>
                <button id="endgame-exit-btn" style="background: rgba(255, 255, 255, 0.2); border: none; color: white; padding: 10px 25px; border-radius: 25px; font-size: 16px; cursor: pointer;">Quitter</button>
            </div>
        </div>
    `;
    
    // Enregistrer les résultats dans la base de données
    saveMinigameResults({
        minigameId: gameData.minigameId,
        difficultyLevel: gameData.difficultyLevel,
        score: score,
        timeSpent: gameData.timeSpent
    }).catch(error => {
        console.error("Erreur lors de l'enregistrement des résultats:", error);
    });
    
    // Ajouter les gestionnaires d'événements pour les boutons
    document.getElementById('endgame-retry-btn').addEventListener('click', function() {
        modalContainer.remove();
        if (typeof resetGameFunction === 'function') {
            resetGameFunction();
        }
    });
    
    document.getElementById('endgame-exit-btn').addEventListener('click', function() {
        window.location.href = `/training.html?type=${categoryType}`;
    });
}

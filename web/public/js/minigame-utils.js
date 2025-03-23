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
function saveMinigameResults(results) {
    return new Promise((resolve, reject) => {
        // Récupérer le token d'authentification
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("Erreur d'authentification: aucun token trouvé");
            reject(new Error("Vous devez être connecté pour enregistrer vos résultats"));
            return;
        }

        // Appeler l'API pour enregistrer les résultats
        fetch('/api/minigame/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                minigameId: results.minigameId,
                difficultyLevel: results.difficultyLevel,
                score: results.score,
                timeSpent: results.timeSpent
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || "Erreur lors de l'enregistrement des résultats");
                });
            }
            return response.json();
        })
        .then(data => {
            // Stocker les résultats pour l'animation après redirection
            if (data.success) {
                try {
                    localStorage.setItem('lastMinigameResults', JSON.stringify({
                        minigameId: results.minigameId,
                        difficultyLevel: results.difficultyLevel,
                        scoreBefore: data.scoreBefore,
                        scoreAfter: data.scoreAfter,
                        newStars: data.newStars
                    }));
                } catch (error) {
                    console.warn("Impossible de stocker les résultats dans localStorage:", error);
                }
            }
            
            // Résoudre la promesse avec les données
            resolve(data);
        })
        .catch(error => {
            console.error("Erreur lors de l'enregistrement des résultats:", error);
            reject(error);
        });
    });
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
    // D'abord, enregistrer les résultats dans la base de données
    try {
        // Créer une fonction globale temporaire pour le gestionnaire de clic
        window.endGameRetry = function() {
            document.getElementById('endgame-modal-container').remove();
            if (typeof resetGameFunction === 'function') {
                resetGameFunction();
            }
        };
        
        window.endGameExit = function() {
            window.location.href = `/training.html?type=${categoryType}`;
        };
        
        // Enregistrer les résultats de façon asynchrone sans bloquer
        const savePromise = fetch('/api/minigame/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                minigameId: gameData.minigameId,
                difficultyLevel: gameData.difficultyLevel,
                score: score,
                timeSpent: gameData.timeSpent
            })
        });
        
        // Gérer les erreurs silencieusement
        savePromise.catch(error => {
            console.error("Erreur lors de l'enregistrement des résultats:", error);
        });
    } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
    }
    
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
    
    // Supprimer l'ancien modal s'il existe
    const oldModal = document.getElementById('endgame-modal-container');
    if (oldModal) {
        oldModal.remove();
    }
    
    // Créer un nouveau conteneur modal
    const modalContainer = document.createElement('div');
    modalContainer.id = 'endgame-modal-container';
    
    // Générer les étoiles avec des images
    const starsHTML = Array(3).fill().map((_, i) => {
        const isActive = i < stars;
        return `<img 
            src="/assets/images/star.png" 
            alt="Étoile" 
            style="
                width: 48px; 
                height: 48px; 
                filter: ${isActive ? 'brightness(1) drop-shadow(0 0 5px rgba(255, 215, 0, 0.8))' : 'brightness(0.3) grayscale(1)'};
                transition: transform 0.3s ease;
                ${isActive ? 'animation: star-pop 0.5s ease-out;' : ''}
            "
        >`;
    }).join('');
    
    // Définir le HTML du modal
    modalContainer.innerHTML = `
        <style>
            #endgame-modal-container {
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
                font-family: 'Comic Neue', 'Nunito', 'Arial', sans-serif;
            }
            
            @keyframes star-pop {
                0% { transform: scale(0.5); opacity: 0.5; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            .frame-container {
                background-image: url('/assets/images/endgame_frame.png');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                width: 90%;
                max-width: 500px;
                aspect-ratio: 1 / 1.2;
                padding: 30px;
                text-align: center;
                position: relative;
            }
            
            .content-container {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 25%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding-top: 5%;
            }
            
            .buttons-container {
                position: absolute;
                bottom: 13%;
                left: 0;
                right: 0;
                display: flex;
                justify-content: center;
                gap: 30px;
                z-index: 10000;
            }
            
            .button-image {
                width: 90px;
                height: auto;
                cursor: pointer;
                transition: transform 0.3s ease;
            }
            
            .button-image:hover {
                transform: scale(1.1);
            }
        </style>
        
        <div class="frame-container">
            <!-- Conteneur pour centrer le contenu principal -->
            <div class="content-container">
                <div style="width: 80%;">
                    <h2 style="font-size: 1.8rem; color: #ffffff; text-shadow: 0 0 10px rgba(101, 66, 254, 0.8); margin-bottom: 10px;">
                        ${stars === 3 ? '🎉 Bravo ! 🎉' : 'Partie terminée !'}
                    </h2>
                    
                    <div style="display: flex; justify-content: center; gap: 15px; margin: 10px 0;">
                        ${starsHTML}
                    </div>
                    
                    <div style="font-size: 1.3rem; color: #ffffff; margin: 15px 0;">
                        Ton score est de <span style="font-weight: bold;">${score}</span> / ${maxScore}
                    </div>
                    
                    <div style="font-size: 1.1rem; color: #ffffff; margin: 10px 0;">
                        ${message}
                    </div>
                </div>
            </div>
            
            <!-- Boutons de fin fixés en bas -->
            <div class="buttons-container">
                <img src="/assets/images/replay.png" alt="Rejouer" class="button-image" onclick="window.endGameRetry()">
                <img src="/assets/images/quit.png" alt="Quitter" class="button-image" onclick="window.endGameExit()">
            </div>
        </div>
    `;
    
    // Ajouter le modal au document
    document.body.appendChild(modalContainer);
    
    // Essayer de charger la police Comic Neue
    try {
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
    } catch (error) {
        console.warn("Impossible de charger la police:", error);
    }
}
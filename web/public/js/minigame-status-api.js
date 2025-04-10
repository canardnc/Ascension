/**
 * API de statut pour les mini-jeux
 * Ce fichier est à ajouter au répertoire 'internal/api/handlers' de votre serveur
 */

const db = require('../../db');
const middleware = require('../middleware');

/**
 * Récupère le statut d'un mini-jeu pour un utilisateur
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 */
function getMinigameStatus(req, res) {
    // Récupérer l'ID utilisateur depuis le contexte
    const userId = req.context.value("userId");

    // Récupérer les paramètres de requête
    const gameId = parseInt(req.query.game_id);
    const difficultyLevel = parseInt(req.query.difficulty);

    if (isNaN(gameId) || gameId <= 0 || isNaN(difficultyLevel) || difficultyLevel <= 0) {
        middleware.RespondWithError(res, 400, "Paramètres invalides");
        return;
    }

    // Vérifier si le mini-jeu est disponible
    db.DB.QueryRow(`
        SELECT mp.available, mp.cost, pe.current_energy
        FROM minigames_progress mp
        JOIN player_energy pe ON mp.user_id = pe.user_id
        WHERE mp.user_id = $1 AND mp.minigame_id = $2 AND mp.difficulty_level = $3
    `, [userId, gameId, difficultyLevel])
    .then(result => {
        if (!result) {
            middleware.RespondWithError(res, 404, "Mini-jeu non trouvé");
            return;
        }

        const response = {
            available: result.available,
            cost: result.cost,
            currentEnergy: result.current_energy
        };

        middleware.RespondWithJSON(res, 200, response);
    })
    .catch(error => {
        console.error("Erreur lors de la récupération du statut du mini-jeu:", error);
        middleware.RespondWithError(res, 500, "Erreur lors de la récupération du statut du mini-jeu");
    });
}

module.exports = {
    getMinigameStatus
};

/**
 * IMPORTANT: Ajoutez également la route suivante dans votre fichier routes.go :
 * 
 * mux.HandleFunc("/api/minigame/status", func(w http.ResponseWriter, r *http.Request) {
 *     if r.Method == http.MethodGet {
 *         middleware.JWTAuth(handlers.GetMinigameStatus)(w, r)
 *     } else {
 *         http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
 *     }
 * });
 */
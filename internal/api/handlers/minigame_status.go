package handlers

import (
	"net/http"
	"strconv"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db"
)

// GetMinigameStatus récupère le statut d'un mini-jeu pour l'utilisateur courant
// Vérifie si le mini-jeu est disponible et si l'utilisateur a assez d'énergie
func GetMinigameStatus(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userId := r.Context().Value("userId").(int)

	// Récupérer les paramètres de requête
	gameIDStr := r.URL.Query().Get("game_id")
	difficultyStr := r.URL.Query().Get("difficulty")

	// Valider les paramètres
	gameID, err := strconv.Atoi(gameIDStr)
	if err != nil || gameID < 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID de mini-jeu invalide")
		return
	}

	difficulty, err := strconv.Atoi(difficultyStr)
	if err != nil || difficulty <= 0 || difficulty > 3 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Niveau de difficulté invalide")
		return
	}

	// Requête pour récupérer la disponibilité du mini-jeu et l'énergie du joueur
	query := `
		SELECT mp.available, mp.cost, pe.current_energy
		FROM minigames_progress mp
		LEFT JOIN player_energy pe ON mp.user_id = pe.user_id
		WHERE mp.user_id = $1 AND mp.minigame_id = $2 AND mp.difficulty_level = $3
	`

	// Exécuter la requête
	var available bool
	var cost, currentEnergy int
	err = db.DB.QueryRow(query, userId, gameID, difficulty).Scan(&available, &cost, &currentEnergy)

	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des informations du mini-jeu")
		return
	}

	// Créer la réponse
	response := map[string]interface{}{
		"available":     available,
		"cost":          cost,
		"currentEnergy": currentEnergy,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

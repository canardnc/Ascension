package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db"
)

// MinigameMetadataResponse représente les métadonnées d'un mini-jeu
type MinigameMetadataResponse struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

// GetMinigameMetadata récupère les métadonnées d'un mini-jeu
func GetMinigameMetadata(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID du mini-jeu depuis les paramètres de requête
	minigameIDStr := r.URL.Query().Get("id")
	minigameID, err := strconv.Atoi(minigameIDStr)
	if err != nil || minigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID de mini-jeu invalide")
		return
	}

	// Construire la requête SQL
	query := `
		SELECT title, description
		FROM minigames
		WHERE minigame_id = $1
	`

	// Exécuter la requête
	var metadata MinigameMetadataResponse
	err = db.DB.QueryRow(query, minigameID).Scan(&metadata.Title, &metadata.Description)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, 
			fmt.Sprintf("Erreur lors de la récupération des métadonnées du mini-jeu: %v", err))
		return
	}

	// Envoyer la réponse
	middleware.RespondWithJSON(w, http.StatusOK, metadata)
}

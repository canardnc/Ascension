package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db"
)

type MinigameMetadataResponse struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

func GetMinigameMetadata(w http.ResponseWriter, r *http.Request) {
	minigameIDStr := r.URL.Query().Get("id")
	minigameID, err := strconv.Atoi(minigameIDStr)
	if err != nil || minigameID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "ID de mini-jeu invalide")
		return
	}

	query := `
		SELECT title, description
		FROM minigames
		WHERE minigame_id = $1
	`

	var metadata MinigameMetadataResponse
	err = db.DB.QueryRow(query, minigameID).Scan(&metadata.Title, &metadata.Description)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, fmt.Sprintf("Erreur lors de la récupération des métadonnées du mini-jeu: %v", err))
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, metadata)
}

package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db/models"
)

// ScoreRequest représente une demande d'enregistrement de score
type ScoreRequest struct {
	Score    int `json:"score"`
	Duration int `json:"duration"`
}

// ScoreResponse représente la réponse à une demande d'enregistrement de score
type ScoreResponse struct {
	Success   bool `json:"success"`
	IsNewBest bool `json:"isNewBest"`
}

// SaveScore enregistre un nouveau score
func SaveScore(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userId := r.Context().Value("userId").(int)

	var request ScoreRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	if request.Score <= 0 || request.Duration <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Score et durée doivent être positifs")
		return
	}

	score := models.Score{
		UserID:   userId,
		Score:    request.Score,
		Duration: request.Duration,
	}

	if err := score.Create(); err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'enregistrement du score")
		return
	}

	isNewBest, err := score.IsNewBestScore()
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification du score")
		return
	}

	response := ScoreResponse{
		Success:   true,
		IsNewBest: isNewBest,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// GetScores récupère les meilleurs scores d'un utilisateur
func GetScores(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userId := r.Context().Value("userId").(int)

	// Récupérer le paramètre de limite
	limitParam := r.URL.Query().Get("limit")
	limit := 10 // Valeur par défaut

	if limitParam != "" {
		var err error
		limit, err = strconv.Atoi(limitParam)
		if err != nil || limit <= 0 {
			limit = 10
		}
	}

	scores, err := models.GetScoresByUserID(userId, limit)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des scores")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, scores)
}

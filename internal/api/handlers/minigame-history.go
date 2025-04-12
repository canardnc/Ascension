package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db"
	"github.com/canardnc/Ascension/internal/db/models"
)

// StartSessionRequest représente la demande pour débuter une session de jeu
type StartSessionRequest struct {
	MinigameID      int `json:"minigameId"`
	DifficultyLevel int `json:"difficultyLevel"`
}

// StartSessionResponse représente la réponse à une demande de début de session
type StartSessionResponse struct {
	Success   bool `json:"success"`
	SessionID int  `json:"sessionId"`
}

// EndSessionRequest représente la demande pour terminer une session de jeu
type EndSessionRequest struct {
	SessionID int `json:"sessionId"`
	Score     int `json:"score"`
	Duration  int `json:"duration"`
}

// EndSessionResponse représente la réponse à une demande de fin de session
type EndSessionResponse struct {
	Success bool `json:"success"`
}

// StartMinigameSession démarre une nouvelle session de jeu
func StartMinigameSession(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userID := r.Context().Value("userId").(int)

	var request StartSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	if request.MinigameID <= 0 || request.DifficultyLevel <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Paramètres invalides")
		return
	}

	// Créer une nouvelle entrée dans l'historique
	session, err := models.StartMinigameSession(userID, request.MinigameID, request.DifficultyLevel)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la création de la session")
		return
	}

	response := StartSessionResponse{
		Success:   true,
		SessionID: session.ID,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// EndMinigameSession termine une session de jeu existante
func EndMinigameSession(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte (pour vérification)
	userID := r.Context().Value("userId").(int)

	var request EndSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	if request.SessionID <= 0 || request.Score < 0 || request.Duration <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Paramètres invalides")
		return
	}

	// Vérifier que la session appartient bien à l'utilisateur (sécurité)
	// Cette vérification est importante pour éviter la manipulation des sessions d'autres utilisateurs
	var sessionUserID int
	query := "SELECT user_id FROM minigames_history WHERE id = $1"
	err := db.DB.QueryRow(query, request.SessionID).Scan(&sessionUserID)
	if err != nil {
		middleware.RespondWithError(w, http.StatusNotFound, "Session non trouvée")
		return
	}

	if sessionUserID != userID {
		middleware.RespondWithError(w, http.StatusForbidden, "Cette session ne vous appartient pas")
		return
	}

	// Mettre à jour la session avec les résultats
	err = models.EndMinigameSession(request.SessionID, request.Score, request.Duration)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour de la session")
		return
	}

	response := EndSessionResponse{
		Success: true,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// GetMinigameHistory récupère l'historique des parties pour un utilisateur
func GetMinigameHistory(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userID := r.Context().Value("userId").(int)

	// Récupérer le paramètre de limite
	limitParam := r.URL.Query().Get("limit")
	limit := 20 // Valeur par défaut

	if limitParam != "" {
		var err error
		limit, err = strconv.Atoi(limitParam)
		if err != nil || limit <= 0 {
			limit = 20
		}
	}

	// Récupérer l'historique
	history, err := models.GetMinigameHistory(userID, limit)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération de l'historique")
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, history)
}

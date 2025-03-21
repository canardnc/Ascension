package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db/models"
)

// MinigameResponse représente un mini-jeu dans la réponse API
type MinigameResponse struct {
	ID              int                       `json:"id"`
	Name            string                    `json:"name"`
	Description     string                    `json:"description"`
	Icon            string                    `json:"icon"`
	DifficultyLevels []MinigameDifficultyLevel `json:"difficultyLevels"`
}

// MinigameDifficultyLevel représente un niveau de difficulté d'un mini-jeu
type MinigameDifficultyLevel struct {
	Level        int       `json:"level"`
	Description  string    `json:"description"`
	Difficulty   int       `json:"difficulty"`
	Points       int       `json:"points"`
	Stars        int       `json:"stars"`
	Progress     float64   `json:"progress"`
	LastPlayed   string    `json:"lastPlayed,omitempty"`
	TotalPlayed  int       `json:"totalPlayed"`
}

// MinigameCompletionRequest représente une demande d'enregistrement de mini-jeu complété
type MinigameCompletionRequest struct {
	MinigameID      int `json:"minigameId"`
	DifficultyLevel int `json:"difficultyLevel"`
	Score           int `json:"score"`
	TimeSpent       int `json:"timeSpent"` // en secondes
}

// MinigameCompletionResponse représente la réponse à une demande d'enregistrement de mini-jeu
type MinigameCompletionResponse struct {
	Success     bool   `json:"success"`
	ScoreBefore int    `json:"scoreBefore"`
	ScoreAfter  int    `json:"scoreAfter"`
	NewStars    int    `json:"newStars"`
	Message     string `json:"message,omitempty"`
}

// GetMinigames récupère tous les mini-jeux disponibles pour un joueur dans une catégorie
func GetMinigames(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userID := r.Context().Value("userId").(int)

	// Récupérer la catégorie depuis les paramètres
	categoryIDStr := r.URL.Query().Get("category")
	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil || categoryID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Catégorie invalide")
		return
	}

	// Récupérer les mini-jeux disponibles
	progressList, err := models.GetMinigamesByCategory(userID, categoryID)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des mini-jeux")
		return
	}

	// Organiser les mini-jeux par ID
	minigamesMap := make(map[int]*MinigameResponse)

	for _, progress := range progressList {
		// Si c'est la première fois qu'on voit ce mini-jeu, récupérer ses métadonnées
		if _, exists := minigamesMap[progress.MinigameID]; !exists {
			metadata, err := models.GetMinigameMetadata(progress.MinigameID)
			if err != nil {
				// Ignorer ce mini-jeu si on ne peut pas récupérer ses métadonnées
				continue
			}

			minigamesMap[progress.MinigameID] = &MinigameResponse{
				ID:              progress.MinigameID,
				Name:            metadata.Name,
				Description:     metadata.Description,
				Icon:            metadata.Icon,
				DifficultyLevels: []MinigameDifficultyLevel{},
			}
		}

		// Récupérer la description du niveau de difficulté
		metadata, _ := models.GetMinigameMetadata(progress.MinigameID)
		var levelDescription string
		var difficultyValue int

		if metadata != nil {
			levelKey := strconv.Itoa(progress.DifficultyLevel)
			if level, exists := metadata.DifficultyLevels[levelKey]; exists {
				levelDescription = level.Description
				difficultyValue = level.Difficulty
			}
		}

		// Calculer les étoiles et la progression
		stars := models.CalculateStars(progress.Points)
		progressPercentage := models.CalculateProgressPercentage(progress.Points)

		// Formater la date de dernière partie
		lastPlayed := ""
		if !progress.LastPlayed.IsZero() {
			lastPlayed = progress.LastPlayed.Format("02/01/2006 15:04")
		}

		// Ajouter le niveau de difficulté
		level := MinigameDifficultyLevel{
			Level:       progress.DifficultyLevel,
			Description: levelDescription,
			Difficulty:  difficultyValue,
			Points:      progress.Points,
			Stars:       stars,
			Progress:    progressPercentage,
			LastPlayed:  lastPlayed,
			TotalPlayed: progress.TotalPlayed,
		}

		minigamesMap[progress.MinigameID].DifficultyLevels = append(
			minigamesMap[progress.MinigameID].DifficultyLevels,
			level,
		)
	}

	// Convertir la map en slice
	var response []MinigameResponse
	for _, minigame := range minigamesMap {
		response = append(response, *minigame)
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// CompleteMinigame enregistre un mini-jeu complété
func CompleteMinigame(w http.ResponseWriter, r *http.Request) {
	// Récupérer l'ID utilisateur depuis le contexte
	userID := r.Context().Value("userId").(int)

	var request MinigameCompletionRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Données invalides")
		return
	}

	if request.MinigameID <= 0 || request.DifficultyLevel <= 0 || request.Score < 0 || request.TimeSpent <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Paramètres invalides")
		return
	}

	// Récupérer la progression actuelle
	progress, err := models.GetMinigameProgress(userID, request.MinigameID, request.DifficultyLevel)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération de la progression")
		return
	}

	// Calculer les scores et les étoiles
	scoreBefore := progress.Points
	scoreAfter := scoreBefore + request.Score
	
	starsBefore := models.CalculateStars(scoreBefore)
	starsAfter := models.CalculateStars(scoreAfter)
	newStars := starsAfter - starsBefore

	// Mettre à jour la progression
	err = models.UpdateMinigameProgress(
		userID,
		request.MinigameID,
		request.DifficultyLevel,
		scoreAfter,
		request.TimeSpent,
	)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour de la progression")
		return
	}

	// Préparer le message
	message := "Félicitations ! Vous avez gagné " + strconv.Itoa(request.Score) + " points."
	if newStars > 0 {
		message += " Vous avez également gagné " + strconv.Itoa(newStars) + " nouvelle(s) étoile(s) !"
	}

	response := MinigameCompletionResponse{
		Success:     true,
		ScoreBefore: scoreBefore,
		ScoreAfter:  scoreAfter,
		NewStars:    newStars,
		Message:     message,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

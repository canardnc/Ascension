package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/db"
	"github.com/canardnc/Ascension/internal/db/models"
)

type MinigameResponse struct {
	ID               int                       `json:"id"`
	Name             string                    `json:"name"`
	Description      string                    `json:"description"`
	DifficultyLevels []MinigameDifficultyLevel `json:"difficultyLevels"`
}

type MinigameDifficultyLevel struct {
	Level       int     `json:"level"`
	Description string  `json:"description"`
	Difficulty  int     `json:"difficulty"`
	Points      int     `json:"points"`
	Stars       int     `json:"stars"`
	Progress    float64 `json:"progress"`
	LastPlayed  string  `json:"lastPlayed,omitempty"`
	TotalPlayed int     `json:"totalPlayed"`
}

type MinigameCompletionRequest struct {
	MinigameID      int `json:"minigameId"`
	DifficultyLevel int `json:"difficultyLevel"`
	Score           int `json:"score"`
	TimeSpent       int `json:"timeSpent"`
}

type MinigameCompletionResponse struct {
	Success     bool   `json:"success"`
	ScoreBefore int    `json:"scoreBefore"`
	ScoreAfter  int    `json:"scoreAfter"`
	NewStars    int    `json:"newStars"`
	Message     string `json:"message,omitempty"`
}

func GetMinigames(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userId").(int)
	categoryIDStr := r.URL.Query().Get("category")
	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil || categoryID <= 0 {
		middleware.RespondWithError(w, http.StatusBadRequest, "Catégorie invalide")
		return
	}

	progressList, err := models.GetMinigamesByCategory(userID, categoryID)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la récupération des mini-jeux")
		return
	}

	minigamesMap := make(map[int]*MinigameResponse)
	for _, progress := range progressList {
		if _, exists := minigamesMap[progress.MinigameID]; !exists {
			var name, description string
			query := `
				SELECT title, description
				FROM minigames
				WHERE minigame_id = $1
			`
			err := db.DB.QueryRow(query, progress.MinigameID).Scan(&name, &description)
			if err != nil {
				continue
			}
			minigamesMap[progress.MinigameID] = &MinigameResponse{
				ID:               progress.MinigameID,
				Name:             name,
				Description:      description,
				DifficultyLevels: []MinigameDifficultyLevel{},
			}
		}

		levelDescription := "Niveau " + strconv.Itoa(progress.DifficultyLevel)
		difficultyValue := progress.DifficultyLevel
		stars := models.CalculateStars(progress.Points)
		progressPercentage := models.CalculateProgressPercentage(progress.Points)
		lastPlayed := ""
		if !progress.LastPlayed.IsZero() {
			lastPlayed = progress.LastPlayed.Format("02/01/2006 15:04")
		}

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
		minigamesMap[progress.MinigameID].DifficultyLevels = append(minigamesMap[progress.MinigameID].DifficultyLevels, level)
	}

	var response []MinigameResponse
	for _, minigame := range minigamesMap {
		response = append(response, *minigame)
	}
	if response == nil {
		response = []MinigameResponse{}
	}
	middleware.RespondWithJSON(w, http.StatusOK, response)
}

func CompleteMinigame(w http.ResponseWriter, r *http.Request) {
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

	scoreBefore, scoreAfter, err := UpdateMinigameProgressWithScore(
		userID,
		request.MinigameID,
		request.DifficultyLevel,
		request.Score,
		request.TimeSpent,
	)
	if err != nil {
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la mise à jour de la progression")
		return
	}

	starsBefore := models.CalculateStars(scoreBefore)
	starsAfter := models.CalculateStars(scoreAfter)
	newStars := starsAfter - starsBefore

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

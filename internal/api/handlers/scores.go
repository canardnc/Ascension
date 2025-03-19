package handlers

import (
	"net/http"
	"strconv"

	"github.com/canardnc/Ascension/internal/db/models"
	"github.com/gin-gonic/gin"
)

// ScoreRequest représente une demande d'enregistrement de score
type ScoreRequest struct {
	Score    int `json:"score" binding:"required"`
	Duration int `json:"duration" binding:"required"`
}

// ScoreResponse représente la réponse à une demande d'enregistrement de score
type ScoreResponse struct {
	Success   bool `json:"success"`
	IsNewBest bool `json:"isNewBest"`
}

// SaveScore enregistre un nouveau score
func SaveScore(c *gin.Context) {
	userId := c.GetInt("userId")
	
	var request ScoreRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides"})
		return
	}
	
	score := models.Score{
		UserID:   userId,
		Score:    request.Score,
		Duration: request.Duration,
	}
	
	if err := score.Create(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de l'enregistrement du score"})
		return
	}
	
	isNewBest, err := score.IsNewBestScore()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la vérification du score"})
		return
	}
	
	c.JSON(http.StatusOK, ScoreResponse{
		Success:   true,
		IsNewBest: isNewBest,
	})
}

// GetScores récupère les meilleurs scores d'un utilisateur
func GetScores(c *gin.Context) {
	userId := c.GetInt("userId")
	
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	
	scores, err := models.GetScoresByUserID(userId, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des scores"})
		return
	}
	
	c.JSON(http.StatusOK, scores)
}

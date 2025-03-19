package handlers

import (
	"net/http"

	"github.com/canardnc/Ascension/internal/db/models"
	"github.com/gin-gonic/gin"
)

// UserUpdateRequest représente une demande de mise à jour du profil utilisateur
type UserUpdateRequest struct {
	HeroName string `json:"heroName" binding:"required"`
}

// UserResponse représente les informations de l'utilisateur renvoyées à l'API
type UserResponse struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	HeroName  string `json:"heroName,omitempty"`
	BestScore int    `json:"bestScore"`
}

// GetUserInfo récupère les informations de l'utilisateur courant
func GetUserInfo(c *gin.Context) {
	userId := c.GetInt("userId")
	
	user, err := models.GetUserByID(userId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des informations utilisateur"})
		return
	}
	
	bestScore, err := user.GetBestScore()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération du meilleur score"})
		return
	}
	
	c.JSON(http.StatusOK, UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		HeroName:  user.HeroName,
		BestScore: bestScore,
	})
}

// UpdateUser met à jour les informations de l'utilisateur
func UpdateUser(c *gin.Context) {
	userId := c.GetInt("userId")
	
	var request UserUpdateRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides"})
		return
	}
	
	user, err := models.GetUserByID(userId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des informations utilisateur"})
		return
	}
	
	user.HeroName = request.HeroName
	
	if err := user.Update(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la mise à jour du profil"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"success": true})
}

package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/canardnc/Ascension/internal/db/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
)

// Clé secrète pour signer les tokens JWT (à remplacer par une valeur sécurisée en production)
const jwtSecret = "ascension_secret_key"

// Durée de validité des tokens (3 jours)
const tokenDuration = 72 * time.Hour

// AuthRequest représente une demande d'authentification
type AuthRequest struct {
	Username string `json:"username" binding:"required"`
}

// AuthResponse représente la réponse à une demande d'authentification
type AuthResponse struct {
	Token     string `json:"token"`
	IsNewUser bool   `json:"isNewUser"`
}

// SimpleAuth authentifie un utilisateur avec un pseudo simple
func SimpleAuth(c *gin.Context) {
	var request AuthRequest
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pseudo requis"})
		return
	}
	
	// Vérifier si l'utilisateur existe
	user, err := models.GetUserByUsername(request.Username)
	isNewUser := false
	
	if err == sql.ErrNoRows {
		// Créer un nouvel utilisateur
		user = &models.User{
			Username: request.Username,
		}
		
		if err := user.Create(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la création du compte"})
			return
		}
		
		isNewUser = true
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la vérification du compte"})
		return
	}
	
	// Générer un token JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"username": user.Username,
		"exp": time.Now().Add(tokenDuration).Unix(),
	})
	
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur de génération du token"})
		return
	}
	
	c.JSON(http.StatusOK, AuthResponse{
		Token: tokenString,
		IsNewUser: isNewUser,
	})
}

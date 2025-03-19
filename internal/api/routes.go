package api

import (
	"github.com/canardnc/Ascension/internal/api/handlers"
	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/gin-gonic/gin"
)

// SetupRoutes configure les routes de l'API
func SetupRoutes(router *gin.Engine) {
	// Routes publiques
	router.POST("/api/auth/simple", handlers.SimpleAuth)
	
	// Routes authentifiées
	api := router.Group("/api")
	api.Use(middleware.JWTAuth())
	{
		// Utilisateur
		api.GET("/user", handlers.GetUserInfo)
		api.PUT("/user", handlers.UpdateUser)
		
		// Scores
		api.POST("/scores", handlers.SaveScore)
		api.GET("/scores", handlers.GetScores)
		
		// Configurations du jeu
		api.GET("/game/config/:type", handlers.GetGameConfig)
	}
}

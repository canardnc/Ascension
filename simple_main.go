package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// Créer un routeur Gin
	router := gin.Default()

	// Route simple de test
	router.POST("/api/auth/simple", func(c *gin.Context) {
		var request struct {
			Username string `json:"username" binding:"required"`
		}

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Pseudo requis"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token": "token_test_pour_" + request.Username,
			"isNewUser": true,
		})
	})

	// Démarrer le serveur
	fmt.Println("Serveur Ascension simplifié démarré sur http://localhost:8080")
	log.Fatal(router.Run(":8080"))
}

package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/canardnc/Ascension/internal/config"
	"github.com/canardnc/Ascension/internal/db"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
)

func main() {
	// Charger la configuration
	cfg, err := config.LoadConfig("configs/server.yaml")
	if err != nil {
		log.Fatalf("Erreur lors du chargement de la configuration: %v", err)
	}

	// Initialiser la connexion à la base de données
	if err := db.Initialize(cfg.Database); err != nil {
		log.Fatalf("Erreur lors de l'initialisation de la base de données: %v", err)
	}

	// Définir le mode Gin (développement ou production)
	if cfg.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Créer un routeur Gin
	router := gin.Default()

	// Groupe API
	api := router.Group("/api")
	{
		api.POST("/auth/simple", func(c *gin.Context) {
			var request struct {
				Username string `json:"username" binding:"required"`
			}

			if err := c.ShouldBindJSON(&request); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Pseudo requis"})
				return
			}

			// Générer un token JWT
			token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
				"username": request.Username,
				"exp":      time.Now().Add(time.Hour * 72).Unix(),
			})

			tokenString, err := token.SignedString([]byte("ascension_secret_key"))
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur de génération du token"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"token":     tokenString,
				"isNewUser": true,
			})
		})

		api.GET("/user", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"id":        1,
				"username":  "utilisateur_test",
				"heroName":  "Héros Test",
				"bestScore": 0,
			})
		})
	}

	// Fichiers statiques
	router.StaticFile("/", "./web/public/index.html")
	router.StaticFile("/game.html", "./web/public/game.html")
	router.StaticFile("/manifest.json", "./web/public/manifest.json")
	router.StaticFile("/sw.js", "./web/public/sw.js")

	// Dossiers statiques
	router.Static("/css", "./web/public/css")
	router.Static("/js", "./web/public/js")
	router.Static("/icons", "./web/public/icons")

	// Handler pour les fichiers non trouvés
	router.NoRoute(func(c *gin.Context) {
		// Si c'est une requête API, retourner 404 JSON
		if len(c.Request.URL.Path) >= 5 && c.Request.URL.Path[:5] == "/api/" {
			c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found"})
			return
		}

		// Sinon, servir index.html pour le routing côté client
		c.File("./web/public/index.html")
	})

	// Démarrer le serveur
	fmt.Println("Serveur Ascension démarré sur http://localhost:8080")
	log.Fatal(router.Run(":8080"))
}

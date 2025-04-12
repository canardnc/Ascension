package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/canardnc/Ascension/internal/api"
	"github.com/canardnc/Ascension/internal/config"
	"github.com/canardnc/Ascension/internal/db"
)

// Rendre la configuration accessible globalement
var appConfig *config.Config

func main() {
	// logs
	logFile, err := os.OpenFile("application.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("Erreur lors de l'ouverture du fichier de log: %v", err)
	}
	defer logFile.Close()

	log.Printf("Debut du log")
	// Pour avoir les logs à la fois dans un fichier et sur la console:
	log.SetOutput(io.MultiWriter(logFile, os.Stdout))

	// Définir le chemin du fichier de configuration
	configPath := "configs/server.yaml"
	if os.Getenv("CONFIG_PATH") != "" {
		configPath = os.Getenv("CONFIG_PATH")
	}

	// Charger la configuration
	var configErr error
	appConfig, configErr = config.LoadConfig(configPath)
	if configErr != nil {
		log.Printf("Avertissement: Impossible de charger le fichier de configuration: %v", configErr)
		log.Printf("Tentative d'utilisation des variables d'environnement")

		// Créer une configuration minimale à partir des variables d'environnement
		appConfig = &config.Config{
			Database: config.DatabaseConfig{
				Host:     getEnvOrDefault("DB_HOST", "localhost"),
				Port:     getEnvAsIntOrDefault("DB_PORT", 5432),
				Name:     getEnvOrDefault("DB_NAME", "ascension_db"),
				User:     getEnvOrDefault("DB_USER", "postgres"),
				Password: getEnvOrDefault("DB_PASSWORD", ""),
			},
			Server: config.ServerConfig{
				Port:        getEnvAsIntOrDefault("SERVER_PORT", 8080),
				Environment: getEnvOrDefault("ENVIRONMENT", "development"),
			},
			Security: config.SecurityConfig{
				JWTSecret: getEnvOrDefault("JWT_SECRET", ""),
			},
		}
	}

	// Vérifier que la clé JWT est définie
	if appConfig.Security.JWTSecret == "" {
		log.Println("AVERTISSEMENT: Aucune clé JWT définie. Utilisation d'une clé par défaut pour le développement.")
		log.Println("Ne PAS utiliser cette configuration en production!")
	}

	// Initialiser la connexion à la base de données
	if err := db.Initialize(appConfig.Database); err != nil {
		log.Fatalf("Erreur lors de l'initialisation de la base de données: %v", err)
	}
	defer db.Close()

	// Après l'initialisation de la base de données
	log.Printf("Tentative de connexion à la BD: %s@%s:%d/%s",
		appConfig.Database.User, appConfig.Database.Host, appConfig.Database.Port, appConfig.Database.Name)

	// Effectuer un ping pour vérifier la connexion
	if err := db.DB.Ping(); err != nil {
		log.Fatalf("Erreur de connexion à la BD: %v", err)
	} else {
		log.Println("Connexion à la BD établie avec succès!")
	}

	// Créer un mux pour gérer les routes
	mux := http.NewServeMux()

	// Configurer les routes
	api.SetupRoutes(mux)

	// Middleware pour le logging des requêtes
	handler := requestLogger(mux)

	// Démarrer le serveur
	port := appConfig.Server.Port
	fmt.Printf("Serveur Ascension démarré sur http://localhost:%d\n", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), handler))
}

// Middleware pour le logging des requêtes
func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

// Fonction utilitaire pour récupérer une variable d'environnement avec valeur par défaut
func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// Fonction utilitaire pour récupérer une variable d'environnement entière avec valeur par défaut
func getEnvAsIntOrDefault(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}

	value := 0
	_, err := fmt.Sscanf(valueStr, "%d", &value)
	if err != nil {
		log.Printf("Erreur lors de la conversion de %s en entier: %v. Utilisation de la valeur par défaut %d", key, err, defaultValue)
		return defaultValue
	}

	return value
}

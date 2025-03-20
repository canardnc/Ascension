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

	// Charger la configuration
	cfg, err := config.LoadConfig("configs/server.yaml")
	if err != nil {
		log.Fatalf("Erreur lors du chargement de la configuration: %v", err)
	}

	// Initialiser la connexion à la base de données
	if err := db.Initialize(cfg.Database); err != nil {
		log.Fatalf("Erreur lors de l'initialisation de la base de données: %v", err)
	}
	defer db.Close()

	// Après l'initialisation de la base de données
	log.Printf("Tentative de connexion à la BD: %s@%s:%d/%s",
		cfg.Database.User, cfg.Database.Host, cfg.Database.Port, cfg.Database.Name)

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
	port := cfg.Server.Port
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

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/canardnc/Ascension/internal/config"
	"github.com/canardnc/Ascension/internal/db"
	"github.com/canardnc/Ascension/internal/db/models"
	"github.com/golang-jwt/jwt"
)

const jwtSecret = "ascension_secret_key"
const tokenDuration = 72 * time.Hour

func main() {
	// logs
	logFile, err := os.OpenFile("application.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("Erreur lors de l'ouverture du fichier de log: %v", err)
	}
	defer logFile.Close()

	log.SetOutput(logFile)

	log.Printf("Debut du log")
	// Ou pour avoir les logs à la fois dans un fichier et sur la console:
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

	// Vérifier que l'utilisateur peut lire la table users
	var count int
	err = db.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		log.Fatalf("Erreur lors de la lecture de la table users: %v", err)
	} else {
		log.Printf("Lecture de la table users réussie, %d utilisateurs trouvés", count)
	}

	// Créer un mux pour gérer les routes
	mux := http.NewServeMux()

	// API Routes
	mux.HandleFunc("POST /api/auth/simple", handleSimpleAuth)
	mux.HandleFunc("GET /api/user", withAuth(handleGetUser))
	mux.HandleFunc("PUT /api/user", withAuth(handleUpdateUser))
	mux.HandleFunc("POST /api/scores", withAuth(handleSaveScore))

	// Fichiers statiques
	mux.HandleFunc("GET /", serveFile("./web/public/index.html"))
	mux.HandleFunc("GET /game.html", serveFile("./web/public/game.html"))
	mux.HandleFunc("GET /manifest.json", serveFile("./web/public/manifest.json"))
	mux.HandleFunc("GET /sw.js", serveFile("./web/public/sw.js"))

	// Servir les dossiers statiques
	mux.Handle("GET /icons/", http.StripPrefix("/icons/", http.FileServer(http.Dir("./web/public/icons"))))

	// Démarrer le serveur
	port := 8080
	fmt.Printf("Serveur Ascension démarré sur http://localhost:%d\n", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), requestLogger(mux)))
}

// Middleware pour le logging des requêtes
func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

// Middleware d'authentification
func withAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Authentification requise", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Token invalide", http.StatusUnauthorized)
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		userId := int(claims["user_id"].(float64))

		// Passer l'ID utilisateur dans le contexte
		ctx := r.Context()
		ctx = context.WithValue(ctx, "userId", userId)
		next(w, r.WithContext(ctx))
	}
}

// Handler pour l'authentification simple
func handleSimpleAuth(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Username string `json:"username"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Pseudo requis", http.StatusBadRequest)
		return
	}

	if request.Username == "" {
		http.Error(w, "Pseudo ne peut pas être vide", http.StatusBadRequest)
		return
	}

	log.Printf("Handling simple auth for user %s", request.Username)
	// Vérifier si l'utilisateur existe
	user, err := models.GetUserByUsername(request.Username)
	isNewUser := false

	if err != nil {
		log.Printf("User n'existe pas")
		// Utilisateur n'existe pas, on le crée
		user = &models.User{
			Username: request.Username,
		}

		if err := user.Create(); err != nil {
			log.Printf("Erreur lors de la création du compte : %v", err)
			http.Error(w, "Erreur lors de la création du compte", http.StatusInternalServerError)
			return
		}

		isNewUser = true
	}

	// Générer un token JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(tokenDuration).Unix(),
	})

	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		http.Error(w, "Erreur de génération du token", http.StatusInternalServerError)
		return
	}

	// Préparer et envoyer la réponse
	response := map[string]interface{}{
		"token":     tokenString,
		"isNewUser": isNewUser,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Handler pour récupérer les informations utilisateur
func handleGetUser(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value("userId").(int)

	user, err := models.GetUserByID(userId)
	if err != nil {
		http.Error(w, "Erreur lors de la récupération des informations utilisateur", http.StatusInternalServerError)
		return
	}

	bestScore, err := user.GetBestScore()
	if err != nil {
		http.Error(w, "Erreur lors de la récupération du meilleur score", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"id":        user.ID,
		"username":  user.Username,
		"heroName":  user.HeroName,
		"bestScore": bestScore,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Handler pour mettre à jour le nom du héros
func handleUpdateUser(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value("userId").(int)

	var request struct {
		HeroName string `json:"heroName"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Nom de héros requis", http.StatusBadRequest)
		return
	}

	if request.HeroName == "" {
		http.Error(w, "Nom de héros ne peut pas être vide", http.StatusBadRequest)
		return
	}

	user, err := models.GetUserByID(userId)
	if err != nil {
		http.Error(w, "Erreur lors de la récupération des informations utilisateur", http.StatusInternalServerError)
		return
	}

	user.HeroName = request.HeroName

	if err := user.Update(); err != nil {
		http.Error(w, "Erreur lors de la mise à jour du profil", http.StatusInternalServerError)
		return
	}

	response := map[string]bool{"success": true}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Handler pour enregistrer un score
func handleSaveScore(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value("userId").(int)

	var request struct {
		Score    int `json:"score"`
		Duration int `json:"duration"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Données invalides", http.StatusBadRequest)
		return
	}

	score := models.Score{
		UserID:   userId,
		Score:    request.Score,
		Duration: request.Duration,
	}

	if err := score.Create(); err != nil {
		http.Error(w, "Erreur lors de l'enregistrement du score", http.StatusInternalServerError)
		return
	}

	isNewBest, err := score.IsNewBestScore()
	if err != nil {
		http.Error(w, "Erreur lors de la vérification du score", http.StatusInternalServerError)
		return
	}

	response := map[string]bool{
		"success":   true,
		"isNewBest": isNewBest,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Helper pour servir des fichiers statiques
func serveFile(filename string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, filename)
	}
}

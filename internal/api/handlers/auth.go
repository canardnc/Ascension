package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/config"
	"github.com/canardnc/Ascension/internal/db"
	"github.com/canardnc/Ascension/internal/db/models"
	"github.com/canardnc/Ascension/internal/email"
	"github.com/golang-jwt/jwt"
)

// Configuration du JWT (à stocker dans un fichier de configuration)
const (
	tokenDuration = 72 * time.Hour // 3 jours
)

// emailService est le service d'envoi d'email global
var emailService *email.Service

// InitEmailService initialise le service d'email
func InitEmailService(config email.Config) {
	emailService = email.NewService(config)
}

// AuthResponse représente la réponse à une demande d'authentification
type AuthResponse struct {
	Token     string `json:"token"`
	IsNewUser bool   `json:"isNewUser"`
	NeedSetup bool   `json:"needSetup"`
	Username  string `json:"username"`
	Email     string `json:"email"`
}

// generateToken génère un token JWT pour un utilisateur
func generateToken(user *models.UserAuth) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"email":    user.Email,
		"admin":    user.Admin,
		"teacher":  user.Teacher,
		"parent":   user.Parent,
		"exp":      time.Now().Add(tokenDuration).Unix(),
	})

	return token.SignedString(config.GetJWTSecret())
}

// Register inscrit un nouvel utilisateur
func Register(w http.ResponseWriter, r *http.Request) {
	// Décoder le corps de la requête
	var request models.UserRegistration
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Requête invalide")
		return
	}

	// Valider les données d'inscription
	if request.Username == "" || request.Email == "" || request.Password == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Tous les champs sont obligatoires")
		return
	}

	if request.Password != request.ConfirmPassword {
		middleware.RespondWithError(w, http.StatusBadRequest, "Les mots de passe ne correspondent pas")
		return
	}

	// Créer le compte utilisateur
	user, err := models.RegisterUser(request, emailService)
	if err != nil {
		switch err {
		case models.ErrUsernameTaken:
			middleware.RespondWithError(w, http.StatusConflict, "Ce nom d'utilisateur est déjà utilisé")
		case models.ErrEmailTaken:
			middleware.RespondWithError(w, http.StatusConflict, "Cet email est déjà utilisé")
		default:
			log.Printf("Erreur lors de l'inscription: %v", err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de l'inscription")
		}
		return
	}

	// Générer le token JWT
	tokenString, err := generateToken(user)
	if err != nil {
		log.Printf("Erreur lors de la génération du token: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur de génération du token")
		return
	}

	// Renvoyer la réponse
	response := AuthResponse{
		Token:     tokenString,
		IsNewUser: true,
		NeedSetup: true,
		Username:  user.Username,
		Email:     user.Email,
	}

	middleware.RespondWithJSON(w, http.StatusCreated, response)
}

// Login authentifie un utilisateur
func Login(w http.ResponseWriter, r *http.Request) {
	// Décoder le corps de la requête
	var request models.UserLogin
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Requête invalide")
		return
	}

	// Valider les données de connexion
	if request.Username == "" || request.Password == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Nom d'utilisateur et mot de passe requis")
		return
	}

	// Authentifier l'utilisateur
	user, err := models.LoginUser(request)
	if err != nil {
		switch err {
		case models.ErrInvalidCredentials:
			middleware.RespondWithError(w, http.StatusUnauthorized, "Identifiants invalides")
		case models.ErrUserNotActive:
			middleware.RespondWithError(w, http.StatusForbidden, "Compte non activé. Veuillez vérifier votre email.")
		default:
			log.Printf("Erreur lors de la connexion: %v", err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la connexion")
		}
		return
	}

	// Générer le token JWT
	tokenString, err := generateToken(user)
	if err != nil {
		log.Printf("Erreur lors de la génération du token: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur de génération du token")
		return
	}

	// Vérifier si l'utilisateur a besoin de finaliser son profil
	needSetup := user.HeroName == ""

	// Renvoyer la réponse
	response := AuthResponse{
		Token:     tokenString,
		IsNewUser: false,
		NeedSetup: needSetup,
		Username:  user.Username,
		Email:     user.Email,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
}

// VerifyEmail vérifie le code de vérification d'email
func VerifyEmail(w http.ResponseWriter, r *http.Request) {
	// Ajouter des logs pour le débogage
	log.Printf("Tentative de vérification d'email avec code: %s", r.URL.Query().Get("code"))

	// Récupérer le code depuis les paramètres de requête
	code := r.URL.Query().Get("code")
	if code == "" {
		log.Printf("ERREUR: Code de vérification manquant")
		middleware.RespondWithError(w, http.StatusBadRequest, "Code de vérification manquant")
		return
	}

	// Vérifier le code
	user, err := models.VerifyEmail(code)
	if err != nil {
		if err == models.ErrUserNotFound {
			log.Printf("ERREUR: Code de vérification invalide ou expiré: %v", err)
			middleware.RespondWithError(w, http.StatusNotFound, "Code de vérification invalide ou expiré")
		} else {
			log.Printf("ERREUR: Lors de la vérification de l'email: %v", err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la vérification")
		}
		return
	}

	log.Printf("Compte utilisateur activé avec succès: %s (ID: %d)", user.Username, user.ID)

	// Générer un token JWT pour l'utilisateur
	tokenString, err := generateToken(user)
	if err != nil {
		log.Printf("Erreur lors de la génération du token: %v", err)
		middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur de génération du token")
		return
	}

	// Déterminer si l'utilisateur a besoin de configurer son profil
	needSetup := user.HeroName == ""

	// Renvoyer la réponse
	response := AuthResponse{
		Token:     tokenString,
		IsNewUser: false,
		NeedSetup: needSetup,
		Username:  user.Username,
		Email:     user.Email,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
	log.Printf("Réponse de vérification envoyée avec succès pour l'utilisateur: %s", user.Username)
}

// RequestPasswordReset demande une réinitialisation de mot de passe
func RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	// Décoder le corps de la requête
	var request models.UserPasswordReset
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Requête invalide")
		return
	}

	// Valider l'email
	if request.Email == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Email requis")
		return
	}

	// Demander la réinitialisation
	err := models.RequestPasswordReset(request, emailService)
	if err != nil {
		log.Printf("Erreur lors de la demande de réinitialisation: %v", err)
		// Toujours renvoyer un succès pour ne pas révéler si l'email existe
	}

	// Renvoyer une réponse positive (même si l'email n'existe pas, pour des raisons de sécurité)
	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// ResetPassword réinitialise le mot de passe avec un code
func ResetPassword(w http.ResponseWriter, r *http.Request) {
	// Décoder le corps de la requête
	var request models.UserPasswordUpdate
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		middleware.RespondWithError(w, http.StatusBadRequest, "Requête invalide")
		return
	}

	// Valider les données
	if request.Code == "" || request.Password == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Code et mot de passe requis")
		return
	}

	if request.Password != request.ConfirmPassword {
		middleware.RespondWithError(w, http.StatusBadRequest, "Les mots de passe ne correspondent pas")
		return
	}

	// Réinitialiser le mot de passe
	err := models.UpdatePassword(request)
	if err != nil {
		if err == models.ErrUserNotFound {
			middleware.RespondWithError(w, http.StatusNotFound, "Code invalide ou expiré")
		} else {
			log.Printf("Erreur lors de la réinitialisation du mot de passe: %v", err)
			middleware.RespondWithError(w, http.StatusInternalServerError, "Erreur lors de la réinitialisation")
		}
		return
	}

	middleware.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// SimpleAuth (ancienne fonction conservée pour compatibilité)
func SimpleAuth(w http.ResponseWriter, r *http.Request) {
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

	// Avertissement de dépréciation (à enlever plus tard)
	log.Printf("AVERTISSEMENT: Utilisation de SimpleAuth (déprécié) pour %s", request.Username)

	// Trouver l'utilisateur ou en créer un nouveau
	user, err := models.GetUserByUsername(request.Username)
	isNewUser := false

	if err == models.ErrUserNotFound {
		// Créer un nouvel utilisateur temporaire (sera remplacé plus tard)
		tempUser := &models.UserAuth{
			Username: request.Username,
			Email:    request.Username + "@temporary.com",
			IsActive: true,
			Level:    1,
		}

		// Enregistrer dans la base de données
		query := `
			INSERT INTO users (username, email, is_active, level, created_at)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id, created_at
		`
		now := time.Now()

		err := db.DB.QueryRow(
			query, tempUser.Username, tempUser.Email, tempUser.IsActive, tempUser.Level, now,
		).Scan(&tempUser.ID, &tempUser.CreatedAt)

		if err != nil {
			http.Error(w, "Erreur lors de la création du compte", http.StatusInternalServerError)
			return
		}

		user = tempUser
		isNewUser = true
	} else if err != nil {
		http.Error(w, "Erreur lors de la vérification du compte", http.StatusInternalServerError)
		return
	}

	// Générer un token JWT
	tokenString, err := generateToken(user)
	if err != nil {
		http.Error(w, "Erreur de génération du token", http.StatusInternalServerError)
		return
	}

	response := AuthResponse{
		Token:     tokenString,
		IsNewUser: isNewUser,
		NeedSetup: user.HeroName == "",
		Username:  user.Username,
		Email:     user.Email,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

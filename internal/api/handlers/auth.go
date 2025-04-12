package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/canardnc/Ascension/internal/api/middleware"
	"github.com/canardnc/Ascension/internal/config"
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
	Email     string `json:"email"`
}

// generateToken génère un token JWT pour un utilisateur
func generateToken(user *models.UserAuth) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"admin":   user.Admin,
		"teacher": user.Teacher,
		"parent":  user.Parent,
		"exp":     time.Now().Add(tokenDuration).Unix(),
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
	if request.Email == "" || request.Password == "" {
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
	if request.Email == "" || request.Password == "" {
		middleware.RespondWithError(w, http.StatusBadRequest, "Email et mot de passe requis")
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

	log.Printf("Compte utilisateur activé avec succès: %s (ID: %d)", user.Email, user.ID)

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
		Email:     user.Email,
	}

	middleware.RespondWithJSON(w, http.StatusOK, response)
	log.Printf("Réponse de vérification envoyée avec succès pour l'utilisateur: %s", user.Email)
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

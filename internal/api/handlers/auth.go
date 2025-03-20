package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/canardnc/Ascension/internal/db/models"
	"github.com/golang-jwt/jwt"
)

// Clé secrète pour signer les tokens JWT (à remplacer par une valeur sécurisée en production)
const jwtSecret = "ascension_secret_key"

// Durée de validité des tokens (3 jours)
const tokenDuration = 72 * time.Hour

// AuthRequest représente une demande d'authentification
type AuthRequest struct {
	Username string `json:"username"`
}

// AuthResponse représente la réponse à une demande d'authentification
type AuthResponse struct {
	Token     string `json:"token"`
	IsNewUser bool   `json:"isNewUser"`
}

// SimpleAuth authentifie un utilisateur avec un pseudo simple
func SimpleAuth(w http.ResponseWriter, r *http.Request) {
	var request AuthRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Pseudo requis", http.StatusBadRequest)
		return
	}

	if request.Username == "" {
		http.Error(w, "Pseudo ne peut pas être vide", http.StatusBadRequest)
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
			http.Error(w, "Erreur lors de la création du compte", http.StatusInternalServerError)
			return
		}

		isNewUser = true
	} else if err != nil {
		http.Error(w, "Erreur lors de la vérification du compte", http.StatusInternalServerError)
		return
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

	response := AuthResponse{
		Token:     tokenString,
		IsNewUser: isNewUser,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

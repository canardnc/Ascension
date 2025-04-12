package middleware

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/canardnc/Ascension/internal/config"
	"github.com/canardnc/Ascension/internal/db/models"
	"github.com/golang-jwt/jwt"
)

// JWTAuth est un middleware pour valider les tokens JWT avec vérification d'activation
func JWTAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Récupérer le token du header Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			RespondWithError(w, http.StatusUnauthorized, "Authentification requise")
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Utiliser la clé secrète depuis la configuration
			return config.GetJWTSecret(), nil
		})

		if err != nil || !token.Valid {
			log.Printf("Token invalide ou erreur de parsing: %v", err)
			RespondWithError(w, http.StatusUnauthorized, "Token invalide")
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			RespondWithError(w, http.StatusUnauthorized, "Token invalide")
			return
		}

		// Extraire les claims du token
		userID := int(claims["user_id"].(float64))
		username, _ := claims["username"].(string)
		email, _ := claims["email"].(string)
		isAdmin, _ := claims["admin"].(bool)
		isTeacher, _ := claims["teacher"].(bool)
		isParent, _ := claims["parent"].(bool)

		// Vérifier que le compte est toujours actif (facultatif, mais recommandé pour la sécurité)
		user, err := models.GetUserByID(userID)
		if err != nil {
			if err == models.ErrUserNotFound {
				RespondWithError(w, http.StatusUnauthorized, "Compte utilisateur non trouvé")
			} else {
				log.Printf("Erreur lors de la vérification de l'utilisateur: %v", err)
				RespondWithError(w, http.StatusInternalServerError, "Erreur d'authentification")
			}
			return
		}

		// Vérifier si le compte est actif
		if !user.IsActive {
			RespondWithError(w, http.StatusForbidden, "Compte inactif. Veuillez vérifier votre email.")
			return
		}

		// Créer un contexte avec les informations utilisateur
		ctx := context.WithValue(r.Context(), "userId", userID)
		ctx = context.WithValue(ctx, "username", username)
		ctx = context.WithValue(ctx, "email", email)
		ctx = context.WithValue(ctx, "isAdmin", isAdmin)
		ctx = context.WithValue(ctx, "isTeacher", isTeacher)
		ctx = context.WithValue(ctx, "isParent", isParent)

		// Appeler le handler suivant avec le contexte mis à jour
		next(w, r.WithContext(ctx))
	}
}

// RequireAdmin est un middleware qui vérifie que l'utilisateur est administrateur
func RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return JWTAuth(func(w http.ResponseWriter, r *http.Request) {
		isAdmin, ok := r.Context().Value("isAdmin").(bool)
		if !ok || !isAdmin {
			RespondWithError(w, http.StatusForbidden, "Accès réservé aux administrateurs")
			return
		}
		next(w, r)
	})
}

// RequireTeacher est un middleware qui vérifie que l'utilisateur est enseignant
func RequireTeacher(next http.HandlerFunc) http.HandlerFunc {
	return JWTAuth(func(w http.ResponseWriter, r *http.Request) {
		isTeacher, ok := r.Context().Value("isTeacher").(bool)
		isAdmin, _ := r.Context().Value("isAdmin").(bool)

		if !ok || (!isTeacher && !isAdmin) {
			RespondWithError(w, http.StatusForbidden, "Accès réservé aux enseignants")
			return
		}
		next(w, r)
	})
}

// RequireParent est un middleware qui vérifie que l'utilisateur est parent
func RequireParent(next http.HandlerFunc) http.HandlerFunc {
	return JWTAuth(func(w http.ResponseWriter, r *http.Request) {
		isParent, ok := r.Context().Value("isParent").(bool)
		isAdmin, _ := r.Context().Value("isAdmin").(bool)

		if !ok || (!isParent && !isAdmin) {
			RespondWithError(w, http.StatusForbidden, "Accès réservé aux parents")
			return
		}
		next(w, r)
	})
}

// RespondWithJSON envoie une réponse JSON (existant, gardé pour référence)
func RespondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"Erreur d'encodage JSON"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

// RespondWithError envoie une réponse d'erreur au format JSON (existant, gardé pour référence)
func RespondWithError(w http.ResponseWriter, code int, message string) {
	RespondWithJSON(w, code, map[string]string{"error": message})
}

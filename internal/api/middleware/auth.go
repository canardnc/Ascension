package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt"
)

// JWTAuth est un middleware pour valider les tokens JWT
func JWTAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Récupérer le token du header Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, `{"error":"Authentification requise"}`, http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Utiliser la même clé secrète que celle utilisée pour générer le token
			return []byte("ascension_secret_key"), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, `{"error":"Token invalide"}`, http.StatusUnauthorized)
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		userId := int(claims["user_id"].(float64))

		// Stocker l'ID utilisateur dans le contexte
		ctx := context.WithValue(r.Context(), "userId", userId)

		// Appeler le handler suivant avec le contexte mis à jour
		next(w, r.WithContext(ctx))
	}
}

// RespondWithJSON envoie une réponse JSON
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

// RespondWithError envoie une réponse d'erreur au format JSON
func RespondWithError(w http.ResponseWriter, code int, message string) {
	RespondWithJSON(w, code, map[string]string{"error": message})
}

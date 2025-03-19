package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
)

// JWTAuth est un middleware pour valider les tokens JWT
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authentification requise"})
			return
		}
		
		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Utiliser la même clé secrète que celle utilisée pour générer le token
			return []byte("ascension_secret_key"), nil
		})
		
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token invalide"})
			return
		}
		
		claims := token.Claims.(jwt.MapClaims)
		userId := int(claims["user_id"].(float64))
		
		c.Set("userId", userId)
		c.Next()
	}
}

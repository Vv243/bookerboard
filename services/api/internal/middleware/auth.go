package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/vv243/bookerboard/api/internal/auth"
)

// RequireAuth validates the JWT on every protected route.
// Sets user claims the Gin context for handlers to read.
func RequireAuth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {

		// Extract token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "authorization header required",
			})
			c.Abort()
			return
		}

		// Header format: "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "authorization header format must be: Bearer <token>",
			})
			c.Abort()
			return
		}

		// Validate the token
		claims, err := auth.ValidateToken(parts[1], jwtSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": err.Error(),
			})
			c.Abort()
			return
		}

		// Store claims in context for handlers to read
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("userRole", claims.UserRole)

		c.Next()

	}
}

// RequireCreativeDirector blocs lead writers from
// creative director only routes.
func RequireCreativeDirector() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("userRole")
		if role != "creative_director" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "creative director access required",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

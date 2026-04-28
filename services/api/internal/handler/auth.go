package handler

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vv243/bookerboard/api/internal/auth"
	"github.com/vv243/bookerboard/api/internal/db"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles login requests.
type AuthHandler struct {
	userRepo  *db.UserRepository
	jwtSecret string
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(userRepo *db.UserRepository, jwtSecret string) *AuthHandler {
	return &AuthHandler{userRepo: userRepo, jwtSecret: jwtSecret}
}

// LoginRequest is the request body for POST /auth/login
type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login handles POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email and password required"})
		return
	}

	// Look up user by email
	user, err := h.userRepo.GetByEmail(req.Email)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "login failed"})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash), []byte(req.Password),
	); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	// Generate JWT
	token, err := auth.GenerateToken(user.ID, user.Email, user.UserRole, h.jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"email":    user.Email,
			"userRole": user.UserRole,
		},
	})
}
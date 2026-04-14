package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/vv243/bookerboard/api/config"
	"github.com/vv243/bookerboard/api/internal/handler"
	"github.com/vv243/bookerboard/api/internal/middleware"
)

func main() {
	// Load configuration from environment variables
	cfg := config.Load()

	// Create Gin router
	r := gin.Default()

	//Initialize handlers
	healthHandler := handler.NewHealthHandler()

	// -------------------------------------------------------------------------
	// Public routes — no auth required
	// -------------------------------------------------------------------------
	r.GET("/health", healthHandler.Check)

	// -------------------------------------------------------------------------
	// Protected routes — JWT required
	// -------------------------------------------------------------------------
	protected := r.Group("/api")
	protected.Use(middleware.RequireAuth(cfg.JWTSecret))
	{
		// Creative director only routes
		cd := protected.Group("")
		cd.Use(middleware.RequireCreativeDirector())
		{
			// Year overview, backstage scores
			// Placeholder for now
		}

		// Both roles
		protected.GET("/ping", func(c *gin.Context) {
			role, _ := c.Get("userRole")
			c.JSON(200, gin.H{
				"message": "authenticated",
				"role":    role,
			})
		})
	}

	// Start server
	log.Printf("BookerBoard API starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("failed to start the server: %v", err)
	}
}

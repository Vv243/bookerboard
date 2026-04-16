package main

import (
	"log"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/vv243/bookerboard/api/config"
	appdb "github.com/vv243/bookerboard/api/internal/db"
	"github.com/vv243/bookerboard/api/internal/handler"
	"github.com/vv243/bookerboard/api/internal/middleware"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to PostgresSQL
	database, err := appdb.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("failed to connect to database: %v", err)
	}
	defer database.Close()
	log.Println("connected to PostgreSQL")

	// Initialize repositories
	starRepo := appdb.NewStarRepository(database)
	backupRepo := appdb.NewBackupPlanRepository(database)

	// Initialize solver client
	solverClient := handler.NewSolverClient(cfg.SolverURL)

	// Initialize handlers
	healthHandler := handler.NewHealthHandler()
	injuryHandler := handler.NewInjuryHandler(starRepo, backupRepo, solverClient)

	// Create Gin router
	r := gin.Default()

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
		// Star endpoints
		stars := protected.Group("/stars")
		{
			stars.PATCH("/:id", injuryHandler.FlagInjury)
		}

		// Both roles - ping for testing auth
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

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

	// Connect to PostgreSQL
	database, err := appdb.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer database.Close()
	log.Println("connected to PostgreSQL")

	// Initialize repositories
	starRepo := appdb.NewStarRepository(database)
	backupRepo := appdb.NewBackupPlanRepository(database)
	userRepo := appdb.NewUserRepository(database)
	threadRepo := appdb.NewNarrativeThreadRepository(database)
	todoRepo := appdb.NewTodoRepository(database)
	overviewRepo := appdb.NewOverviewRepository(database)
	cardRepo := appdb.NewCardRepository(database)

	// Initialize solver client
	solverClient := handler.NewSolverClient(cfg.SolverURL)

	// Initialize handlers
	healthHandler := handler.NewHealthHandler()
	injuryHandler := handler.NewInjuryHandler(starRepo, backupRepo, solverClient)
	authHandler := handler.NewAuthHandler(userRepo, cfg.JWTSecret)
	starHandler := handler.NewStarHandler(starRepo)
	threadHandler := handler.NewNarrativeThreadHandler(threadRepo)
	todoHandler := handler.NewTodoHandler(todoRepo)
	overviewHandler := handler.NewOverviewHandler(overviewRepo)
	cardHandler := handler.NewCardHandler(cardRepo)

	// Create Gin router
	r := gin.Default()

	// -------------------------------------------------------------------------
	// Public routes — no auth required
	// -------------------------------------------------------------------------
	r.GET("/health", healthHandler.Check)
	r.POST("/api/auth/login", authHandler.Login)

	// -------------------------------------------------------------------------
	// Protected routes — JWT required
	// -------------------------------------------------------------------------
	protected := r.Group("/api")
	protected.Use(middleware.RequireAuth(cfg.JWTSecret))
	{
		// Thread endpoints
		protected.GET("/threads", threadHandler.List)
		protected.GET("/threads/:id", threadHandler.GetByID)
		protected.GET("/todos", todoHandler.List)
		protected.GET("/overview/stats", overviewHandler.GetStats)
		protected.GET("/overview/ples", overviewHandler.GetUpcomingPLEs)	
		protected.GET("/card", cardHandler.GetCard)
		protected.PATCH("/card/:event_id/reorder", cardHandler.Reorder)
		protected.DELETE("/card/segments/:segment_id", cardHandler.DeleteSegment)
		protected.POST("/card/:event_id/segments", cardHandler.AddSegment)

		// Star endpoints
		stars := protected.Group("/stars")
		{
			stars.GET("", starHandler.List)
			stars.PATCH("/:id", injuryHandler.FlagInjury)
		}

		// Both roles — ping for testing auth
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
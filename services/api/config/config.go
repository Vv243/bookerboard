package config

import (
	"os"
)

// Config holds all configuration values for the Go API.
// Values are loaded from environment variables so nothing
// sensitive is hardcoded.
type Config struct {
	DatabaseURL string
	JWTSecret   string
	SolverURL   string
	Port        string
}

// Load reads configuration from environment variables.
// Returns sensible defaults for local development.
func Load() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL",
			"postgres://bookerboard:bookerboard@postgres:5432/bookerboard?sslmode=disable"),
		JWTSecret: getEnv("JWT_SECRET", "bookerboard-dev-secret"),
		SolverURL: getEnv("SOLVER_URL", "http://localhost:8080"),
		Port:      getEnv("PORT", "8081"),
	}
}

// getEnv returns the value of an environment variable
// or a default value if the variable is not set.
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

package config

import (
	"os"
)

// Config holds all configuration for the order service
type Config struct {
	Port          string
	PostgreSQLURL string
	RedisURL      string
	Environment   string
}

// Load loads configuration from environment variables with defaults
func Load() *Config {
	return &Config{
		Port:          getEnv("PORT", "8080"),
		PostgreSQLURL: getEnv("POSTGRESQL_URL", "postgres://user:password@localhost:5432/orders?sslmode=disable"),
		RedisURL:      getEnv("REDIS_URL", "redis://localhost:6379"),
		Environment:   getEnv("ENVIRONMENT", "development"),
	}
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

package main

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-lambda-go/events"
)

func TestLocalRun(t *testing.T) {
	os.Setenv("DATABASE_URL",
		"postgres://bookerboard:bookerboard@postgres:5432/bookerboard?sslmode=disable")

	event := events.CloudWatchEvent{
		Time: time.Now(),
	}

	ctx := context.Background()
	if err := handler(ctx, event); err != nil {
		t.Fatalf("handler failed: %v", err)
	}
}

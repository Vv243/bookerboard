package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	fandb "github.com/vv243/bookerboard/fan-score/db"
	"github.com/vv243/bookerboard/fan-score/fetcher"
)

func handler(ctx context.Context, event events.CloudWatchEvent) error {
	log.Printf("fan score pipeline started — event time: %s", event.Time)

	// Load database URL from environment
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return fmt.Errorf("DATABASE_URL environment variable not set")
	}

	// Initialize database writer
	writer, err := fandb.NewFanScoreWriter(databaseURL)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer writer.Close()

	// Initialize fetchers
	redditFetcher := fetcher.NewRedditFetcher()
	trendsFetcher := fetcher.NewTrendsFetcher()

	// Get all stars from database
	stars, err := writer.GetAllStarIDs(ctx)
	if err != nil {
		return fmt.Errorf("failed to get stars: %w", err)
	}

	log.Printf("processing %d stars", len(stars))

	// Process each star
	successCount := 0
	errorCount := 0

	for starID, starName := range stars {

		// Fetch Reddit score
		redditResult, err := redditFetcher.Fetch(ctx, starName)
		if err != nil {
			log.Printf("reddit fetch failed for %s: %v", starName, err)
			errorCount++
		} else {
			if err := writer.WriteRedditScore(ctx, starID, redditResult); err != nil {
				log.Printf("reddit write failed for %s: %v", starName, err)
				errorCount++
			} else {
				log.Printf("reddit score written for %s — pro:%d anti:%d controversy:%d",
					starName, redditResult.ProScore,
					redditResult.AntiScore, redditResult.Controversy)
				successCount++
			}
		}

		// Fetch Google Trends score
		trendsResult, err := trendsFetcher.Fetch(ctx, starName)
		if err != nil {
			log.Printf("trends fetch failed for %s: %v", starName, err)
			errorCount++
		} else {
			if err := writer.WriteTrendsScore(ctx, starID, trendsResult); err != nil {
				log.Printf("trends write failed for %s: %v", starName, err)
				errorCount++
			} else {
				log.Printf("trends score written for %s — interest:%d",
					starName, trendsResult.InterestScore)
				successCount++
			}
		}
	}

	log.Printf("pipeline complete — %d succeeded, %d failed",
		successCount, errorCount)

	// Return error only if everything failed
	if successCount == 0 && errorCount > 0 {
		return fmt.Errorf("pipeline failed — all %d operations errored", errorCount)
	}

	return nil
}

func main() {
	lambda.Start(handler)
}

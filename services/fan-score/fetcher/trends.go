package fetcher

import (
	"context"
	"hash/fnv"
	"time"
)

// TrendsFetcher fetches search interest from Google Trends.
// Note: Google Trends has no official API. This implementation
// uses a deterministic simulation for local development.
// Replace with real Trends API call in production deployment.
type TrendsFetcher struct{}

// NewTrendsFetcher creates a new TrendsFetcher.
func NewTrendsFetcher() *TrendsFetcher {
	return &TrendsFetcher{}
}

// TrendsResult holds the search interest score for one star.
type TrendsResult struct {
	StarName      string
	InterestScore int // 0-100, Google Trends scale
}

// Fetch returns a search interest score for the given star.
// Uses a deterministic hash of the star name + current week
// to simulate realistic variance across weeks.
func (t *TrendsFetcher) Fetch(ctx context.Context, starName string) (*TrendsResult, error) {
	// Get current week number for variance
	_, week := time.Now().ISOWeek()

	// Hash star name + week to get deterministic but varying score
	h := fnv.New32a()
	h.Write([]byte(starName))
	h.Write([]byte{byte(week)})
	hash := h.Sum32()

	// Map hash to 40-90 range — realistic search interest range
	score := int(40 + (hash % 50))

	return &TrendsResult{
		StarName:      starName,
		InterestScore: score,
	}, nil
}

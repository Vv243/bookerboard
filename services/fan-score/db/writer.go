package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
	"github.com/vv243/bookerboard/fan-score/fetcher"
)

// FanScoreWriter writes fan scores to PostgreSQL.
type FanScoreWriter struct {
	db *sql.DB
}

// NewFanScoreWriter opens a PostgreSQL connection and returns a writer.
func NewFanScoreWriter(databaseURL string) (*FanScoreWriter, error) {
	database, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := database.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &FanScoreWriter{db: database}, nil
}

// Close closes the database connection.
func (w *FanScoreWriter) Close() {
	w.db.Close()
}

// WriteRedditScore writes a Reddit fan score row for the given star.
func (w *FanScoreWriter) WriteRedditScore(
	ctx context.Context,
	starID int64,
	result *fetcher.FanScoreResult,
) error {
	// Get Monday of current week as week_start
	weekStart := getMondayOfCurrentWeek()

	_, err := w.db.ExecContext(ctx, `
		INSERT INTO fan_score
			(star_id, week_start, pro_score, anti_score,
			 controversy, data_source, confidence)
		VALUES
			($1, $2, $3, $4, $5, 'reddit', 'high')
		ON CONFLICT ON CONSTRAINT one_score_per_star_per_week
		DO UPDATE SET
			pro_score   = EXCLUDED.pro_score,
			anti_score  = EXCLUDED.anti_score,
			controversy = EXCLUDED.controversy`,
		starID,
		weekStart,
		result.ProScore,
		result.AntiScore,
		result.Controversy,
	)
	if err != nil {
		return fmt.Errorf("failed to write reddit score for star %d: %w", starID, err)
	}

	return nil
}

// WriteTrendsScore writes a Google Trends score row for the given star.
func (w *FanScoreWriter) WriteTrendsScore(
	ctx context.Context,
	starID int64,
	result *fetcher.TrendsResult,
) error {
	weekStart := getMondayOfCurrentWeek()

	_, err := w.db.ExecContext(ctx, `
		INSERT INTO fan_score
			(star_id, week_start, pro_score, anti_score,
			 controversy, data_source, confidence)
		VALUES
			($1, $2, $3, 0, 0, 'google_trends', 'high')
		ON CONFLICT ON CONSTRAINT one_score_per_star_per_week
		DO UPDATE SET
			pro_score = EXCLUDED.pro_score`,
		starID,
		weekStart,
		result.InterestScore,
	)
	if err != nil {
		return fmt.Errorf("failed to write trends score for star %d: %w", starID, err)
	}

	return nil
}

// GetAllStarIDs returns all star IDs and names from the database.
func (w *FanScoreWriter) GetAllStarIDs(ctx context.Context) (map[int64]string, error) {
	rows, err := w.db.QueryContext(ctx,
		"SELECT id, name FROM star ORDER BY id")
	if err != nil {
		return nil, fmt.Errorf("failed to query stars: %w", err)
	}
	defer rows.Close()

	stars := make(map[int64]string)
	for rows.Next() {
		var id int64
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, fmt.Errorf("failed to scan star: %w", err)
		}
		stars[id] = name
	}

	return stars, nil
}

// getMondayOfCurrentWeek returns the date of Monday of the current week.
// All fan_score rows use Monday as week_start by convention.
func getMondayOfCurrentWeek() time.Time {
	now := time.Now().UTC()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7 // Sunday = 7 in ISO week
	}
	monday := now.AddDate(0, 0, -(weekday - 1))
	return time.Date(monday.Year(), monday.Month(), monday.Day(),
		0, 0, 0, 0, time.UTC)
}

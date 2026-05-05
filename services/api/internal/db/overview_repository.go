package db

import (
	"database/sql"
	"fmt"
)

// OverviewStats holds the four metric card values.
type OverviewStats struct {
	ActiveFeuds     int     `json:"activeFeuds"`
	InjuredStars    int     `json:"injuredStars"`
	PlesRemaining   int     `json:"plesRemaining"`
	AvgFanScore     float64 `json:"avgFanScore"`
}

// OverviewRepository computes year overview statistics.
type OverviewRepository struct {
	db *sql.DB
}

// NewOverviewRepository creates a new OverviewRepository.
func NewOverviewRepository(db *sql.DB) *OverviewRepository {
	return &OverviewRepository{db: db}
}

// GetStats returns the four metric card values.
func (r *OverviewRepository) GetStats() (*OverviewStats, error) {
	stats := &OverviewStats{}

	// Active feuds
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM narrative_thread
		WHERE status != 'abandoned'`).Scan(&stats.ActiveFeuds)
	if err != nil {
		return nil, fmt.Errorf("failed to count feuds: %w", err)
	}

	// Injured stars
	err = r.db.QueryRow(`
		SELECT COUNT(*) FROM star
		WHERE status = 'injured'`).Scan(&stats.InjuredStars)
	if err != nil {
		return nil, fmt.Errorf("failed to count injured: %w", err)
	}

	// PLEs remaining this year
	err = r.db.QueryRow(`
		SELECT COUNT(*) FROM ppv_event
		WHERE event_type = 'ple'
		AND event_date_start >= CURRENT_DATE`).Scan(&stats.PlesRemaining)
	if err != nil {
		return nil, fmt.Errorf("failed to count PLEs: %w", err)
	}

	// Average fan score from most recent week
	var avgScore sql.NullFloat64
	err = r.db.QueryRow(`
		SELECT AVG(pro_score)
		FROM fan_score
		WHERE week_start = (
			SELECT MAX(week_start) FROM fan_score
		)`).Scan(&avgScore)
	if err != nil {
		return nil, fmt.Errorf("failed to compute avg fan score: %w", err)
	}
	if avgScore.Valid {
		stats.AvgFanScore = avgScore.Float64
	}

	return stats, nil
}

// GetUpcomingPLEs returns the next 4 upcoming PLEs.
func (r *OverviewRepository) GetUpcomingPLEs() ([]map[string]interface{}, error) {
	rows, err := r.db.Query(`
		SELECT id, name, event_date_start, prestige_tier, location
		FROM ppv_event
		WHERE event_type IN ('ple', 'special')
		AND event_date_start >= CURRENT_DATE
		ORDER BY event_date_start
		LIMIT 4`)
	if err != nil {
		return nil, fmt.Errorf("failed to query PLEs: %w", err)
	}
	defer rows.Close()

	var events []map[string]interface{}
	for rows.Next() {
		var id int64
		var name, date, tier string
		var location sql.NullString

		if err := rows.Scan(&id, &name, &date, &tier, &location); err != nil {
			return nil, err
		}

		event := map[string]interface{}{
			"id":           id,
			"name":         name,
			"date":         date,
			"prestigeTier": tier,
			"location":     nil,
		}
		if location.Valid {
			event["location"] = location.String
		}
		events = append(events, event)
	}

	if events == nil {
		events = []map[string]interface{}{}
	}

	return events, nil
}
package db

import (
	"database/sql"
	"fmt"
)

// NarrativeThread is a simplified struct for the API response
type NarrativeThread struct {
	ID                  int64    `json:"id"`
	Name                string   `json:"name"`
	Brand               string   `json:"brand"`
	Status              string   `json:"status"`
	HeatTrajectory      string   `json:"heatTrajectory"`
	BuildWeeksTarget    int      `json:"buildWeeksTarget"`
	BuildWeeksCompleted int      `json:"buildWeeksCompleted"`
	LastSegmentDate     *string  `json:"lastSegmentDate"`
	TargetPleName       *string  `json:"targetPleName"`
	Stars               []string `json:"stars"`
}
// NarrativeThreadRepository handles DB operations for threads.
type NarrativeThreadRepository struct {
	db *sql.DB
}

// NewNarrativeThreadRepository creates a new repository.
func NewNarrativeThreadRepository(db *sql.DB) *NarrativeThreadRepository {
	return &NarrativeThreadRepository{db: db}
}

// GetAll returns all narrative threads with star names and target PLE.
func (r *NarrativeThreadRepository) GetAll() ([]NarrativeThread, error) {
	rows, err := r.db.Query(`
		SELECT
			nt.id, nt.name, nt.brand, nt.status, nt.heat_trajectory,
			nt.build_weeks_target, nt.build_weeks_completed,
			nt.last_segment_date,
			p.name AS ple_name
		FROM narrative_thread nt
		LEFT JOIN ppv_event p ON p.id = nt.target_ple_id
		ORDER BY nt.status, nt.name`)
	if err != nil {
		return nil, fmt.Errorf("failed to query threads: %w", err)
	}
	defer rows.Close()

	var threads []NarrativeThread
	for rows.Next() {
		var t NarrativeThread
		var lastSeg sql.NullString
		var pleName sql.NullString

		err := rows.Scan(
			&t.ID, &t.Name, &t.Brand, &t.Status, &t.HeatTrajectory,
			&t.BuildWeeksTarget, &t.BuildWeeksCompleted,
			&lastSeg, &pleName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan thread: %w", err)
		}

		if lastSeg.Valid {
			t.LastSegmentDate = &lastSeg.String
		}
		if pleName.Valid {
			t.TargetPleName = &pleName.String
		}

		// Fetch stars for this thread
		t.Stars, err = r.getStarsForThread(t.ID)
		if err != nil {
			return nil, err
		}

		threads = append(threads, t)
	}

	if threads == nil {
		threads = []NarrativeThread{}
	}

	return threads, nil
}

// GetByID returns a single thread by ID.
func (r *NarrativeThreadRepository) GetByID(id string) (*NarrativeThread, error) {
	var t NarrativeThread
	var lastSeg sql.NullString
	var pleName sql.NullString

	err := r.db.QueryRow(`
		SELECT
			nt.id, nt.name, nt.brand, nt.status, nt.heat_trajectory,
			nt.build_weeks_target, nt.build_weeks_completed,
			nt.last_segment_date,
			p.name AS ple_name
		FROM narrative_thread nt
		LEFT JOIN ppv_event p ON p.id = nt.target_ple_id
		WHERE nt.id = $1`, id,
	).Scan(
		&t.ID, &t.Name, &t.Brand, &t.Status, &t.HeatTrajectory,
		&t.BuildWeeksTarget, &t.BuildWeeksCompleted,
		&lastSeg, &pleName,
	)
	if err != nil {
		return nil, err
	}

	if lastSeg.Valid {
		t.LastSegmentDate = &lastSeg.String
	}
	if pleName.Valid {
		t.TargetPleName = &pleName.String
	}

	t.Stars, err = r.getStarsForThread(t.ID)
	if err != nil {
		return nil, err
	}

	return &t, nil
}

// getStarsForThread returns star names for a given thread.
func (r *NarrativeThreadRepository) getStarsForThread(threadID int64) ([]string, error) {
	rows, err := r.db.Query(`
		SELECT s.name
		FROM narrative_thread_star nts
		JOIN star s ON s.id = nts.star_id
		WHERE nts.narrative_thread_id = $1
		ORDER BY s.name`, threadID)
	if err != nil {
		return nil, fmt.Errorf("failed to query stars for thread: %w", err)
	}
	defer rows.Close()

	var stars []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		stars = append(stars, name)
	}

	if stars == nil {
		stars = []string{}
	}

	return stars, nil
}
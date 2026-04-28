package db

import (
	"database/sql"
	"fmt"

	"github.com/vv243/bookerboard/api/internal/model"
)

// StarRepository handles all database operations for stars.
type StarRepository struct {
	db *sql.DB
}

// NewStarRepository creates a new StarRepository.
func NewStarRepository(db *sql.DB) *StarRepository {
	return &StarRepository{db: db}
}

// GetByID returns a single star by ID.
func (r *StarRepository) GetByID(id int64) (*model.Star, error) {
	query := `
		SELECT id, name, brand, alignment, status, schedule_type,
		       workload_this_month, consecutive_appearances,
		       injury_risk, contracted_appearances_remaining
		FROM star
		WHERE id = $1`

	var star model.Star
	var injuryRisk sql.NullInt64
	var contractedLeft sql.NullInt64

	err := r.db.QueryRow(query, id).Scan(
		&star.ID,
		&star.Name,
		&star.Brand,
		&star.Alignment,
		&star.Status,
		&star.ScheduleType,
		&star.WorkloadThisMonth,
		&star.ConsecutiveAppearances,
		&injuryRisk,
		&contractedLeft,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("star not found: %d", id)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get star: %w", err)
	}

	if contractedLeft.Valid {
		val := int(contractedLeft.Int64)
		star.ContractedAppearancesLeft = &val
	}

	return &star, nil
}

// UpdateStatus sets a star's status and clears injury-related
// counters when they return to active.
func (r *StarRepository) UpdateStatus(id int64, status string) error {
	_, err := r.db.Exec(
		`UPDATE star
		 SET status = $1, updated_at = NOW()
		 WHERE id = $2`,
		status, id,
	)
	if err != nil {
		return fmt.Errorf("failed to update star status: %w", err)
	}
	return nil
}

// GetActiveByBrand returns all bookable stars for a given brand.
// Used to build the solver's availableStars payload.
func (r *StarRepository) GetActiveByBrand(brand string) ([]model.Star, error) {
	query := `
		SELECT id, name, brand, alignment, status, schedule_type,
		       workload_this_month, consecutive_appearances,
		       contracted_appearances_remaining
		FROM star
		WHERE brand = $1
		AND status = 'active'
		ORDER BY name`

	rows, err := r.db.Query(query, brand)
	if err != nil {
		return nil, fmt.Errorf("failed to query stars: %w", err)
	}
	defer rows.Close()

	var stars []model.Star
	for rows.Next() {
		var star model.Star
		var contractedLeft sql.NullInt64

		err := rows.Scan(
			&star.ID,
			&star.Name,
			&star.Brand,
			&star.Alignment,
			&star.Status,
			&star.ScheduleType,
			&star.WorkloadThisMonth,
			&star.ConsecutiveAppearances,
			&contractedLeft,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan star: %w", err)
		}

		if contractedLeft.Valid {
			val := int(contractedLeft.Int64)
			star.ContractedAppearancesLeft = &val
		}

		stars = append(stars, star)
	}

	return stars, nil
}

// GetAll returns all stars ordered by brand then name.
func (r *StarRepository) GetAll() ([]model.Star, error) {
	query := `
		SELECT id, name, brand, alignment, status, schedule_type,
		       workload_this_month, consecutive_appearances,
		       contracted_appearances_remaining
		FROM star
		ORDER BY brand, name`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query stars: %w", err)
	}
	defer rows.Close()

	var stars []model.Star
	for rows.Next() {
		var star model.Star
		var contractedLeft sql.NullInt64

		err := rows.Scan(
			&star.ID,
			&star.Name,
			&star.Brand,
			&star.Alignment,
			&star.Status,
			&star.ScheduleType,
			&star.WorkloadThisMonth,
			&star.ConsecutiveAppearances,
			&contractedLeft,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan star: %w", err)
		}

		if contractedLeft.Valid {
			val := int(contractedLeft.Int64)
			star.ContractedAppearancesLeft = &val
		}

		stars = append(stars, star)
	}

	return stars, nil
}
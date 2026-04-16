package db

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/vv243/bookerboard/api/internal/model"
)

// BackupPlanRepository handles database operations for backup plans.
type BackupPlanRepository struct {
	db *sql.DB
}

// NewBackupPlanRepository creates a new BackupPlanRepository.
func NewBackupPlanRepository(db *sql.DB) *BackupPlanRepository {
	return &BackupPlanRepository{db: db}
}

// SavePlans writes ranked backup plans to the database
// within a transaction - all plans saved or none.
func (r *BackupPlanRepository) SavePlans(
	solverRunID string,
	plans []model.BackupPlan,
) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	for _, plan := range plans {
		// Serialize modified segments and warnings to JSON
		segmentsJSON, err := json.Marshal(plan.ModifiedSegments)
		if err != nil {
			return fmt.Errorf("failed to serialize segments: %w", err)
		}

		warningsJSON, err := json.Marshal(plan.Warnings)
		if err != nil {
			return fmt.Errorf("failed to serialize warnings: %w", err)
		}

		_, err = tx.Exec(`
			INSERT INTO backup_plan
				(solver_run_id, rank, score, plan_json, reasoning, warnings)
			VALUES
				($1, $2, $3, $4, $5, $6)`,
			solverRunID,
			plan.Rank,
			plan.ConfidenceScore,
			segmentsJSON,
			plan.Reasoning,
			warningsJSON,
		)
		if err != nil {
			return fmt.Errorf("failed to insert backup plan: %w", err)
		}
	}

	return tx.Commit()
}

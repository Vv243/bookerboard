package db

import (
	"database/sql"
	"fmt"
)

// TodoItem represents one item in the todo list.
type TodoItem struct {
	ID      string `json:"id"`
	Tier    string `json:"tier"`    // blocker, warning, decision
	Message string `json:"message"`
	StarID  *int64 `json:"starId,omitempty"`
	ThreadID *int64 `json:"threadId,omitempty"`
}

// TodoRepository computes todo items from rule checks.
type TodoRepository struct {
	db *sql.DB
}

// NewTodoRepository creates a new TodoRepository.
func NewTodoRepository(db *sql.DB) *TodoRepository {
	return &TodoRepository{db: db}
}

// Compute runs all rule checks and returns sorted todo items.
// Blockers first, then warnings, then decisions (if includeDecisions is true).
func (r *TodoRepository) Compute(includeDecisions bool) ([]TodoItem, error) {
	var todos []TodoItem

	blockers, err := r.computeBlockers()
	if err != nil {
		return nil, fmt.Errorf("failed to compute blockers: %w", err)
	}
	todos = append(todos, blockers...)

	warnings, err := r.computeWarnings()
	if err != nil {
		return nil, fmt.Errorf("failed to compute warnings: %w", err)
	}
	todos = append(todos, warnings...)

	if includeDecisions {
		decisions, err := r.computeDecisions()
		if err != nil {
			return nil, fmt.Errorf("failed to compute decisions: %w", err)
		}
		todos = append(todos, decisions...)
	}

	if todos == nil {
		todos = []TodoItem{}
	}

	return todos, nil
}

// computeBlockers finds issues that prevent card finalization.
func (r *TodoRepository) computeBlockers() ([]TodoItem, error) {
	var todos []TodoItem

	// Check for injured stars booked in segments
	rows, err := r.db.Query(`
		SELECT DISTINCT s.id, s.name
		FROM star s
		JOIN segment_star ss ON ss.star_id = s.id
		JOIN segment seg ON seg.id = ss.segment_id
		WHERE s.status = 'injured'
		ORDER BY s.name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id int64
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		todos = append(todos, TodoItem{
			ID:      fmt.Sprintf("blocker-injured-%d", id),
			Tier:    "blocker",
			Message: fmt.Sprintf("%s is injured but still booked in a segment — remove or replace them before finalizing", name),
			StarID:  &id,
		})
	}

	return todos, nil
}

// computeWarnings finds issues that need attention soon.
func (r *TodoRepository) computeWarnings() ([]TodoItem, error) {
	var todos []TodoItem

	// Check for stalling narrative threads
	rows, err := r.db.Query(`
		SELECT id, name
		FROM narrative_thread
		WHERE status = 'stalling'
		ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id int64
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		todos = append(todos, TodoItem{
			ID:       fmt.Sprintf("warning-stalling-%d", id),
			Tier:     "warning",
			Message:  fmt.Sprintf("Thread \"%s\" is stalling — add a segment to the next card to keep momentum", name),
			ThreadID: &id,
		})
	}

	// Check for part-time stars with 1 appearance remaining
	rows2, err := r.db.Query(`
		SELECT s.id, s.name, sa.appearances_used, sa.max_appearances
		FROM star s
		JOIN star_availability sa ON sa.star_id = s.id
		WHERE sa.max_appearances - sa.appearances_used = 1
		AND sa.available_to >= CURRENT_DATE
		ORDER BY s.name`)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()

	for rows2.Next() {
		var id int64
		var name string
		var used, max int
		if err := rows2.Scan(&id, &name, &used, &max); err != nil {
			return nil, err
		}
		todos = append(todos, TodoItem{
			ID:      fmt.Sprintf("warning-appearances-%d", id),
			Tier:    "warning",
			Message: fmt.Sprintf("%s has 1 appearance remaining in their current window — plan their final booking carefully", name),
			StarID:  &id,
		})
	}

	return todos, nil
}

// computeDecisions finds strategic choices for the creative director.
func (r *TodoRepository) computeDecisions() ([]TodoItem, error) {
	var todos []TodoItem

	// Threads with no target PLE
	rows, err := r.db.Query(`
		SELECT id, name
		FROM narrative_thread
		WHERE target_ple_id IS NULL
		AND status != 'abandoned'
		ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id int64
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		todos = append(todos, TodoItem{
			ID:       fmt.Sprintf("decision-no-ple-%d", id),
			Tier:     "decision",
			Message:  fmt.Sprintf("Thread \"%s\" has no target PLE — assign one to give the feud a clear destination", name),
			ThreadID: &id,
		})
	}

	// Championships with reigns over 180 days
	rows2, err := r.db.Query(`
		SELECT id, name, reign_start
		FROM championship
		WHERE reign_start IS NOT NULL
		AND CURRENT_DATE - reign_start > 180
		ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()

	for rows2.Next() {
		var id int64
		var name string
		var reignStart string
		if err := rows2.Scan(&id, &name, &reignStart); err != nil {
			return nil, err
		}
		todos = append(todos, TodoItem{
			ID:      fmt.Sprintf("decision-reign-%d", id),
			Tier:    "decision",
			Message: fmt.Sprintf("The %s reign has exceeded 180 days — consider planning a title change", name),
		})
	}

	return todos, nil
}
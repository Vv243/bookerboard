package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/vv243/bookerboard/api/internal/model"
)

// SolverClient handles HTTP communication with the Java solver.
type SolverClient struct {
	solverURL  string
	httpClient *http.Client
}

// NewSolver Client creates a new SolverClient with a timeout.
func NewSolverClient(solverURL string) *SolverClient {
	return &SolverClient{
		solverURL: solverURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Solve sends a card to the Java solver and returns ranked backup plans.
// Returns empty slice if solver returns 204 (no solution).
func (sc *SolverClient) Solve(card model.Card) ([]model.BackupPlan, error) {

	// Serialize card to JSON
	body, err := json.Marshal(card)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize card: %w", err)
	}

	// Send POST request to solver
	resp, err := sc.httpClient.Post(
		sc.solverURL+"/solve",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to call solver: %w", err)
	}
	defer resp.Body.Close()

	// 204 means AC-3 found no solution
	if resp.StatusCode == http.StatusNoContent {
		return []model.BackupPlan{}, nil
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("solver returned unexpected status: %d", resp.StatusCode)
	}

	// Deserialize backup plans from response
	var plans []model.BackupPlan
	if err := json.NewDecoder(resp.Body).Decode(&plans); err != nil {
		return nil, fmt.Errorf("failed to decode solver response: %w", err)
	}

	return plans, nil
}

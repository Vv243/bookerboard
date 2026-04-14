package model

// BackupPlan represents one ranked alternative card
// returned by the Java solver.
type BackupPlan struct {
	ID               string    `json:"id"`
	SolverRunID      string    `json:"solverRunId"`
	Rank             int       `json:"rank"`
	ConfidenceScore  float64   `json:"confidenceScore"`
	ModifiedSegments []Segment `json:"modifiedSegments"`
	Reasoning        string    `json:"reasoning"`
	Warnings         []string  `json:"warnings"`
}

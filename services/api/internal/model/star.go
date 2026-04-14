package model

// Star represents a WWE roster member.
// JSON tags control serialization field names.
// Fields marked omitempty are excluded from JSON if zero/nil/
type Star struct {
	ID                           string `json:"id"`
	Name                         string `json:"name"`
	Brand                        string `json:"brand"`
	Alignment                    string `json:"alignment"`
	Status                       string `json:"status"`
	ScheduleType                 string `json:"scheduleType"`
	ContractedAppearancesLeft    *int   `json:"contractedAppearancesRemaining,omitempty"`
	WorkloadThisMonth            int    `json:"workloadThisMonth"`
	ConsecutiveAppearances       int    `json:"consecutiveAppearances"`
	FanScoreValue                int    `json:"fanScoreValue"`
	FanScoreTrend                string `json:"fanScoreTrend"`
	DrawScoreValue               int    `json:"drawScoreValue"`
	BackstageScoreValue          int    `json:"backstageScoreValue,omitempty"`
	BackstageScoreBelowThreshold bool   `json:"backstageScoreBelowThreshold,omitempty"`
	Available                    bool   `json:"available"`
}

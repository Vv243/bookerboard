package model

// BroadcastWindow defines the time budget and constraint
// behavior for a show.
type BroadcastWindow struct {
	EventType      string `json:"eventType"`
	ContentMinutes int    `json:"contentMinutes"`
	ConstraintType string `json:"constraintType"`
}

// Card represents a full show card with all segments.
type Card struct {
	ShowID          string          `json:"showId"`
	BroadcastWindow BroadcastWindow `json:"broadcastWindow"`
	Segments        []Segment       `json:"segments"`
	AvailableStars  []Star          `json:"availableStars"`
}

// TotalDurationMinutes returns the sum of all segment durations.
func (c Card) TotalDurationMinutes() int {
	total := 0
	for _, segment := range c.Segments {
		total += segment.DurationMinutes
	}
	return total
}

package model

// Segment represents one slot on a show card.
type Segment struct {
	ID                  string `json:"id"`
	PpvEventID          string `json:"ppvEventId"`
	NarrativeThreadID   string `json:"narrativeThreadId,omitempty"`
	SegmentType         string `json:"segmentType"`
	SegmentOrder        int    `json:"segmentOrder"`
	DurationMinutes     int    `json:"durationMinutes"`
	Status              string `json:"status"`
	ContendershipReason string `json:"contendershipReason,omitempty"`
	Stars               []Star `json:"stars"`
}

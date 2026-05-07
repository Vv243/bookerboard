package db

import (
	"database/sql"
	"fmt"
)

// CardSegment represents one segment in the card.
type CardSegment struct {
	ID                  int64    `json:"id"`
	SegmentType         string   `json:"segmentType"`
	SegmentOrder        int      `json:"segmentOrder"`
	DurationMinutes     int      `json:"durationMinutes"`
	Status              string   `json:"status"`
	ContendershipReason *string  `json:"contendershipReason"`
	NarrativeThreadName *string  `json:"narrativeThreadName"`
	Stars               []string `json:"stars"`
}

// CardData represents the full card for a show.
type CardData struct {
	EventID         int64         `json:"eventId"`
	EventName       string        `json:"eventName"`
	EventType       string        `json:"eventType"`
	ContentMinutes  int           `json:"contentMinutes"`
	ConstraintType  string        `json:"constraintType"`
	TotalMinutes    int           `json:"totalMinutes"`
	Segments        []CardSegment `json:"segments"`
}

// CardRepository handles DB operations for the card builder.
type CardRepository struct {
	db *sql.DB
}

// NewCardRepository creates a new CardRepository.
func NewCardRepository(db *sql.DB) *CardRepository {
	return &CardRepository{db: db}
}

// GetCard returns the full card for a given event.
func (r *CardRepository) GetCard(eventID string) (*CardData, error) {
	// Get event + broadcast window
	var card CardData
	err := r.db.QueryRow(`
		SELECT
			p.id, p.name, p.event_type,
			bw.content_minutes, bw.constraint_type
		FROM ppv_event p
		JOIN broadcast_window bw ON bw.event_type = p.event_type
		WHERE p.id = $1
		AND bw.effective_from <= CURRENT_DATE
		AND (bw.effective_to IS NULL OR bw.effective_to >= CURRENT_DATE)
		LIMIT 1`, eventID,
	).Scan(
		&card.EventID, &card.EventName, &card.EventType,
		&card.ContentMinutes, &card.ConstraintType,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch event: %w", err)
	}

	// Get segments
	rows, err := r.db.Query(`
		SELECT
			s.id, s.segment_type, s.segment_order,
			s.duration_minutes, s.status,
			s.contendership_reason,
			nt.name AS thread_name
		FROM segment s
		LEFT JOIN narrative_thread nt ON nt.id = s.narrative_thread_id
		WHERE s.ppv_event_id = $1
		ORDER BY s.segment_order`, eventID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch segments: %w", err)
	}
	defer rows.Close()

	var segments []CardSegment
	var total int

	for rows.Next() {
		var seg CardSegment
		var contReason sql.NullString
		var threadName sql.NullString

		err := rows.Scan(
			&seg.ID, &seg.SegmentType, &seg.SegmentOrder,
			&seg.DurationMinutes, &seg.Status,
			&contReason, &threadName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan segment: %w", err)
		}

		if contReason.Valid {
			seg.ContendershipReason = &contReason.String
		}
		if threadName.Valid {
			seg.NarrativeThreadName = &threadName.String
		}

		// Get stars for this segment
		seg.Stars, err = r.getStarsForSegment(seg.ID)
		if err != nil {
			return nil, err
		}

		total += seg.DurationMinutes
		segments = append(segments, seg)
	}

	if segments == nil {
		segments = []CardSegment{}
	}

	card.Segments = segments
	card.TotalMinutes = total

	return &card, nil
}

// getStarsForSegment returns star names for a segment.
func (r *CardRepository) getStarsForSegment(segmentID int64) ([]string, error) {
	rows, err := r.db.Query(`
		SELECT s.name
		FROM segment_star ss
		JOIN star s ON s.id = ss.star_id
		WHERE ss.segment_id = $1
		ORDER BY s.name`, segmentID)
	if err != nil {
		return nil, fmt.Errorf("failed to query stars for segment: %w", err)
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

// ReorderSegments updates segment_order for a list of segments.
func (r *CardRepository) ReorderSegments(eventID string, segmentIDs []int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Step 1 — shift all orders to a high range to avoid constraint conflicts
	// e.g. 1,2,3 → 1001,1002,1003
	_, err = tx.Exec(`
		UPDATE segment SET segment_order = segment_order + 1000
		WHERE ppv_event_id = $1`, eventID)
	if err != nil {
		return fmt.Errorf("offset orders: %w", err)
	}

	// Step 2 — set the new orders
	for i, id := range segmentIDs {
		result, err := tx.Exec(`
			UPDATE segment SET segment_order = $1
			WHERE id = $2 AND ppv_event_id = $3`,
			i+1, id, eventID,
		)
		if err != nil {
			return fmt.Errorf("update segment %d: %w", id, err)
		}
		rows, _ := result.RowsAffected()
		if rows == 0 {
			return fmt.Errorf("segment %d not found in event %s", id, eventID)
		}
	}

	return tx.Commit()
}

// DeleteSegment removes a segment by ID.
func (r *CardRepository) DeleteSegment(segmentID string) error {
	_, err := r.db.Exec(`DELETE FROM segment WHERE id = $1`, segmentID)
	return err
}

// AddSegment inserts a new segment and links stars.
func (r *CardRepository) AddSegment(eventID string, segmentType string, durationMinutes int, starIDs []int64, narrativeThreadID *int64) (*CardSegment, error) {
	// Get next order number
	var maxOrder int
	err := r.db.QueryRow(`
		SELECT COALESCE(MAX(segment_order), 0) FROM segment
		WHERE ppv_event_id = $1`, eventID,
	).Scan(&maxOrder)
	if err != nil {
		return nil, fmt.Errorf("failed to get max order: %w", err)
	}

	// Insert segment
	var seg CardSegment
	err = r.db.QueryRow(`
		INSERT INTO segment (ppv_event_id, narrative_thread_id, segment_type, segment_order, duration_minutes, status)
		VALUES ($1, $2, $3, $4, $5, 'valid')
		RETURNING id, segment_type, segment_order, duration_minutes, status`,
		eventID, narrativeThreadID, segmentType, maxOrder+1, durationMinutes,
	).Scan(&seg.ID, &seg.SegmentType, &seg.SegmentOrder, &seg.DurationMinutes, &seg.Status)
	if err != nil {
		return nil, fmt.Errorf("failed to insert segment: %w", err)
	}

	// Link stars
	for _, starID := range starIDs {
		_, err := r.db.Exec(`
			INSERT INTO segment_star (segment_id, star_id) VALUES ($1, $2)`,
			seg.ID, starID,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to link star: %w", err)
		}
	}

	// Fetch star names
	seg.Stars, err = r.getStarsForSegment(seg.ID)
	if err != nil {
		return nil, err
	}

	return &seg, nil
}

// UpdateSegmentStars replaces all stars for a segment.
func (r *CardRepository) UpdateSegmentStars(segmentID string, starIDs []int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Remove all existing stars for this segment
	_, err = tx.Exec(`DELETE FROM segment_star WHERE segment_id = $1`, segmentID)
	if err != nil {
		return fmt.Errorf("delete existing stars: %w", err)
	}

	// Insert new stars
	for _, starID := range starIDs {
		_, err = tx.Exec(
			`INSERT INTO segment_star (segment_id, star_id) VALUES ($1, $2)`,
			segmentID, starID,
		)
		if err != nil {
			return fmt.Errorf("insert star %d: %w", starID, err)
		}
	}

	return tx.Commit()
}
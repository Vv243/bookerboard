package handler

import (
	"net/http"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/vv243/bookerboard/api/internal/db"
)

// CardHandler handles card builder requests.
type CardHandler struct {
	repo *db.CardRepository
}

// NewCardHandler creates a new CardHandler.
func NewCardHandler(repo *db.CardRepository) *CardHandler {
	return &CardHandler{repo: repo}
}

// GetCard handles GET /api/card?event_id=1
func (h *CardHandler) GetCard(c *gin.Context) {
	eventID := c.Query("event_id")
	if eventID == "" {
		eventID = "1" // default to first event
	}

	card, err := h.repo.GetCard(eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch card",
		})
		return
	}

	c.JSON(http.StatusOK, card)
}

// ReorderRequest is the body for reorder endpoint.
type ReorderRequest struct {
	SegmentIDs []int64 `json:"segmentIds" binding:"required"`
}

// Reorder handles PATCH /api/card/:event_id/reorder
func (h *CardHandler) Reorder(c *gin.Context) {
	eventID := c.Param("event_id")
	var req ReorderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "segmentIds required"})
		return
	}
	if err := h.repo.ReorderSegments(eventID, req.SegmentIDs); err != nil {
		log.Printf("reorder error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// DeleteSegment handles DELETE /api/card/segments/:segment_id
func (h *CardHandler) DeleteSegment(c *gin.Context) {
	segmentID := c.Param("segment_id")
	if err := h.repo.DeleteSegment(segmentID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete segment"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// AddSegmentRequest is the body for add segment endpoint.
type AddSegmentRequest struct {
	SegmentType     string  `json:"segmentType" binding:"required"`
	DurationMinutes int     `json:"durationMinutes" binding:"required"`
	StarIDs         []int64 `json:"starIds"`
	ThreadID        *int64  `json:"threadId"`
}

// AddSegment handles POST /api/card/:event_id/segments
func (h *CardHandler) AddSegment(c *gin.Context) {
	eventID := c.Param("event_id")
	var req AddSegmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	seg, err := h.repo.AddSegment(eventID, req.SegmentType, req.DurationMinutes, req.StarIDs, req.ThreadID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add segment"})
		return
	}
	c.JSON(http.StatusCreated, seg)
}

// UpdateSegmentStarsRequest is the body for the update stars endpoint.
type UpdateSegmentStarsRequest struct {
	StarIDs []int64 `json:"starIds"`
}

// UpdateSegmentStars handles PATCH /api/card/segments/:segment_id/stars
func (h *CardHandler) UpdateSegmentStars(c *gin.Context) {
	segmentID := c.Param("segment_id")

	var req UpdateSegmentStarsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if err := h.repo.UpdateSegmentStars(segmentID, req.StarIDs); err != nil {
		log.Printf("update segment stars error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
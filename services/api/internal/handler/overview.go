package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vv243/bookerboard/api/internal/db"
)

// OverviewHandler handles year overview requests.
type OverviewHandler struct {
	repo *db.OverviewRepository
}

// NewOverviewHandler creates a new OverviewHandler.
func NewOverviewHandler(repo *db.OverviewRepository) *OverviewHandler {
	return &OverviewHandler{repo: repo}
}

// GetStats handles GET /api/overview/stats
func (h *OverviewHandler) GetStats(c *gin.Context) {
	stats, err := h.repo.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stats"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

// GetUpcomingPLEs handles GET /api/overview/ples
func (h *OverviewHandler) GetUpcomingPLEs(c *gin.Context) {
	events, err := h.repo.GetUpcomingPLEs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch PLEs"})
		return
	}
	c.JSON(http.StatusOK, events)
}
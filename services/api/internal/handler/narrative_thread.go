package handler

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vv243/bookerboard/api/internal/db"
	
)
// NarrativeThreadHandler handles narrative thread requests.
type NarrativeThreadHandler struct {
	repo *db.NarrativeThreadRepository
}

// NewNarrativeThreadHandler creates a new handler.
func NewNarrativeThreadHandler(repo *db.NarrativeThreadRepository) *NarrativeThreadHandler {
	return &NarrativeThreadHandler{repo: repo}
}

// List handles GET /api/threads
func (h *NarrativeThreadHandler) List(c *gin.Context) {
	threads, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch threads"})
		return
	}
	c.JSON(http.StatusOK, threads)
}

// GetByID handles GET /api/threads/:id
func (h *NarrativeThreadHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	thread, err := h.repo.GetByID(id)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "thread not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch thread"})
		return
	}
	c.JSON(http.StatusOK, thread)
}
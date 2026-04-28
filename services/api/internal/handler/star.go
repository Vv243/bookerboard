package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vv243/bookerboard/api/internal/db"
)

// StarHandler handles star roster requests.
type StarHandler struct {
	starRepo *db.StarRepository
}

// NewStarHandler creates a new StarHandler.
func NewStarHandler(starRepo *db.StarRepository) *StarHandler {
	return &StarHandler{starRepo: starRepo}
}

// List handles GET /api/stars
// Returns all stars, stripping backstage scores for lead writers.
func (h *StarHandler) List(c *gin.Context) {
	brand := c.Query("brand") // optional filter

	var stars interface{}
	var err error

	if brand != "" {
		stars, err = h.starRepo.GetActiveByBrand(brand)
	} else {
		stars, err = h.starRepo.GetAll()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch stars",
		})
		return
	}

	c.JSON(http.StatusOK, stars)
}
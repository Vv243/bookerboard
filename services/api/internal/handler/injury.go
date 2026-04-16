package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/vv243/bookerboard/api/internal/db"
	"github.com/vv243/bookerboard/api/internal/model"
)

// InjuryHandler handles star injury flagging and solver orchestration.
type InjuryHandler struct {
	starRepo     *db.StarRepository
	backupRepo   *db.BackupPlanRepository
	solverClient *SolverClient
}

// NewInjuryHandler creates a new InjuryHandler.
func NewInjuryHandler(
	starRepo *db.StarRepository,
	backupRepo *db.BackupPlanRepository,
	solverClient *SolverClient,
) *InjuryHandler {
	return &InjuryHandler{
		starRepo:     starRepo,
		backupRepo:   backupRepo,
		solverClient: solverClient,
	}
}

// PatchRequest is the request body for PATCH /stars/ :id
type PatchRequest struct {
	Status string `json:"status" binding:"required"`
}

// InjuryResponse is returned after flagging an injury.
type InjuryResponse struct {
	Star        *model.Star        `json:"star"`
	BackupPlans []model.BackupPlan `json:"backupPlans"`
	SolverRunID string             `json:"solverRunId"`
}

// FlagInjury handles Patch /stars/:id
// Updates star status, calls solver, returns backup plans.
func (h *InjuryHandler) FlagInjury(c *gin.Context) {

	// Parse star ID from URL
	starIDStr := c.Param("id")
	starID, err := strconv.ParseInt(starIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid star id",
		})
		return
	}

	// Parse request body
	var req PatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "status is required",
		})
		return
	}

	// Validate status value
	validStatuses := []string{"active", "injured", "suspended"}
	valid := false
	for _, s := range validStatuses {
		if req.Status == s {
			valid = true
			break
		}
	}
	if !valid {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("invalid status: %s", req.Status),
		})
		return
	}

	// Step 1 - get the star from database
	star, err := h.starRepo.GetByID((starID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Step 2 - update star status in database
	if err := h.starRepo.UpdateStatus(starID, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to update star status",
		})
		return
	}
	star.Status = req.Status

	// Step 3 - if injury flagged, call solver for backup plans
	var plans []model.BackupPlan
	solverRunID := ""

	if req.Status == "injured" {

		// Get available stars for this brand
		availableStars, err := h.starRepo.GetActiveByBrand(star.Brand)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to get available stars",
			})
			return
		}

		// Build a minimal card for the solver
		// In a full implementation this would load the actual
		// current card from the segment table
		card := model.Card{
			ShowID: fmt.Sprintf("%s-%s", star.Brand,
				time.Now().Format("2006-01-02")),
			BroadcastWindow: model.BroadcastWindow{
				EventType:      star.Brand,
				ContentMinutes: 150,
				ConstraintType: "soft",
			},
			Segments:       []model.Segment{},
			AvailableStars: availableStars,
		}

		// Call solver synchronously
		solverRunID = fmt.Sprintf("run-%d-%d", starID, time.Now().Unix())
		plans, err = h.solverClient.Solve(card)
		if err != nil {
			// Solver failure is non-fatal - return the injury update
			// but log the error and return empty plans
			plans = []model.BackupPlan{}
		}

		// Save backup plans to database
		if len(plans) > 0 {
			if err := h.backupRepo.SavePlans(solverRunID, plans); err != nil {
				// Non-fatal - plans already returned to dashboard
				_ = err
			}
		}

	}

	c.JSON(http.StatusOK, InjuryResponse{
		Star:        star,
		BackupPlans: plans,
		SolverRunID: solverRunID,
	})
}

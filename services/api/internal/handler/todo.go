package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vv243/bookerboard/api/internal/db"
)

// TodoHandler computes and returns the todo list
type TodoHandler struct {
	repo *db.TodoRepository
}

// NewTodoHandler creates a new TodoHandler.
func NewTodoHandler(repo *db.TodoRepository) *TodoHandler {
	return &TodoHandler{repo: repo}
}

// List handles GET /api/todos
// Returns blockers, warnings, and decisions computed from rule checks.
func (h *TodoHandler) List(c *gin.Context) {
	role, _ := c.Get("userRole")
	includeDecisions := role == "creative_director"

	todos, err := h.repo.Compute(includeDecisions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to compute todo list",
		})
		return
	}

	c.JSON(http.StatusOK, todos)
}
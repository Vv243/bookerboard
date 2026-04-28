package db

import (
	"database/sql"

	"github.com/vv243/bookerboard/api/internal/model"
)

// UserRepository handles database operations for users.
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new UserRepository.
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// GetByEmail returns a user by email address.
func (r *UserRepository) GetByEmail(email string) (*model.User, error) {
	var user model.User
	var passwordHash string

	err := r.db.QueryRow(`
		SELECT id, email, user_role, password_hash
		FROM "user"
		WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Email, &user.UserRole, &passwordHash)

	if err != nil {
		return nil, err
	}

	// Store password hash temporarily for auth handler
	user.PasswordHash = passwordHash
	return &user, nil
}
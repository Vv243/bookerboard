package model

// User represents an authenticated BookerBoard user.
type User struct {
	ID           int64  `json:"id"`
	Email        string `json:"email"`
	UserRole     string `json:"userRole"`
	PasswordHash string `json:"-"` // never serialized to JSON
}

// IsCreativeDirector returns true if this user has full access.
func (u User) IsCreativeDirector() bool {
	return u.UserRole == "creative_director"
}

// IsLeadWriter returns true if this user has writer-level access.
func (u User) IsLeadWriter() bool {
	return u.UserRole == "lead_writer"
}
package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims holds the data stored inside a JWT token.
// jwt.RegisteredClaims adds standard fields like expiry
type Claims struct {
	UserID   int64  `json:"userId"`
	Email    string `json:"email"`
	UserRole string `json:"userRole"`
	jwt.RegisteredClaims
}

// GenerateToken creates a signed JWT for the given user/
// Token expires after 8 hrs.
func GenerateToken(userID int64, email, role, secret string) (string, error) {
	claims := Claims{
		UserID:   userID,
		Email:    email,
		UserRole: role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(8 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return signed, nil
}

// ValidateToken parses and validates a JWT string.
// Returns the claims if valid, error if expired or tampered.
func ValidateToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v",
					token.Header["alg"])
			}
			return []byte(secret), nil
		},
	)

	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}

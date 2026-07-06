package main

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// generateToken creates a signed JWT for the given user.
func generateToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"user": userID,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

// handleAuth processes the remote authentication header and sets the FireedgeToken cookie.
func handleAuth(w http.ResponseWriter, r *http.Request) {
	// Extract username from remote auth header (e.g., x-auth-username)
	username := r.Header.Get("x-auth-username")
	if username == "" {
		http.Error(w, "Missing authentication header", http.StatusUnauthorized)
		return
	}

	// Validate user against OpenNebula (simplified - assume success for remote auth)
	validUser := authenticateRemoteUser(username)
	if !validUser {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Generate token
	token, err := generateToken(username)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Set FireedgeToken cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "FireedgeToken",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(24 * time.Hour),
	})

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Authentication successful"))
}

// authenticateRemoteUser checks the remote user against OpenNebula's public auth.
// In practice, this would call one_xmlrpc to verify the user.
func authenticateRemoteUser(username string) bool {
	// Simplified: assume valid for remote auth if present
	return true
}
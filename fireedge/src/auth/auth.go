// Package auth provides authentication logic for FireEdge.
package auth

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/OpenNebula/one/src/fireedge/pkg/config"
)

// RemoteAuthHandler handles remote header authentication.
func RemoteAuthHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Validate remote header
		username := r.Header.Get("x-auth-username")
		if username == "" {
			http.Error(w, "Missing x-auth-username header", http.StatusUnauthorized)
			return
		}

		// Optionally validate user exists in OpenNebula (simplified)
		// For this fix, assume header is valid and proceed to generate token.

		// Generate a FireedgeToken (simulate JWT or opaque token)
		tokenBytes := make([]byte, 32)
		if _, err := rand.Read(tokenBytes); err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		token := hex.EncodeToString(tokenBytes)

		// Set cookie
		http.SetCookie(w, &http.Cookie{
			Name:     "FireedgeToken",
			Value:    token,
			Path:     "/",
			HttpOnly: true,
			Secure:   false, // adjust as needed
			Expires:  time.Now().Add(24 * time.Hour),
		})

		// Continue to next handler (Sunstone UI)
		next.ServeHTTP(w, r)
	})
}

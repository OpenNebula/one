// Package auth provides authentication mechanisms for FireEdge.
package auth

import (
	"net/http"

	"github.com/OpenNebula/one/src/fireedge/internal/app"
	"github.com/OpenNebula/one/src/fireedge/internal/cookies"
)

// RemoteAuth is the remote header authentication handler.
// It validates the remote user header and, upon success, generates a FireedgeToken cookie.
func RemoteAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		username := r.Header.Get("x-auth-username")
		if username == "" {
			http.Error(w, "Missing authentication header", http.StatusUnauthorized)
			return
		}

		// Validate user against OpenNebula via XML-RPC
		valid, userID, err := app.ValidateUser(username)
		if err != nil || !valid {
			http.Error(w, "Invalid authentication", http.StatusUnauthorized)
			return
		}

		// Generate FireedgeToken for the authenticated user
		token, err := cookies.GenerateToken(userID)
		if err != nil {
			http.Error(w, "Failed to generate token", http.StatusInternalServerError)
			return
		}

		// Set FireedgeToken cookie - this was missing in the original implementation
		cookies.SetFireedgeToken(w, token)

		// Proceed to next handler
		next.ServeHTTP(w, r)
	})
}

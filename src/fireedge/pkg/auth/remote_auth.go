package auth

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	log "github.com/OpenNebula/one/pkg/logger"
	"github.com/OpenNebula/one/pkg/one"
)

const (
	cookieName = "FireedgeToken"
	tokenLength = 32
	cookieMaxAge = 86400 // 24 hours
)

// RemoteAuthHandler handles remote authentication via headers and sets FireedgeToken cookie.
func RemoteAuthHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract remote auth header (customize as needed)
		authHeader := r.Header.Get("x-auth-username")
		if authHeader == "" {
			http.Error(w, "Missing authentication header", http.StatusUnauthorized)
			return
		}

		// Validate user with OpenNebula (existing function)
		user, err := one.AuthenticateRemote(authHeader)
		if err != nil {
			log.Warn("Remote authentication failed: %v", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Generate a new FireedgeToken (secure random)
		tokenBytes := make([]byte, tokenLength)
		if _, err := rand.Read(tokenBytes); err != nil {
			log.Error("Failed to generate token: %v", err)
			http.Error(w, "Internal error", http.StatusInternalServerError)
			return
		}
		token := hex.EncodeToString(tokenBytes)

		// Store token in server-side session/cache (simplified)
		sessionStore.Set(user.ID, token, time.Now().Add(cookieMaxAge*time.Second))

		// Set cookie
		http.SetCookie(w, &http.Cookie{
			Name:     cookieName,
			Value:    token,
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			MaxAge:   cookieMaxAge,
			SameSite: http.SameSiteStrictMode,
		})

		next.ServeHTTP(w, r)
	})
}

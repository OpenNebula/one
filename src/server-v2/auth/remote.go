package auth

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/OpenNebula/fireedge/src/server-v2/config"
	"github.com/OpenNebula/fireedge/src/server-v2/security"
)

// RemoteAuthHandler handles remote authentication via HTTP headers.
// It expects a header like "x-auth-username: username:password" and validates it.
// On success, it generates a FireedgeToken cookie and sets it in the response.
func RemoteAuthHandler(w http.ResponseWriter, r *http.Request) {
	username := r.Header.Get("x-auth-username")
	if username == "" {
		http.Error(w, "Missing authentication header", http.StatusUnauthorized)
		return
	}

	// Validate the remote authentication (simplified: check against one_xmlrpc)
	valid, userID, err := security.ValidateRemoteUser(username)
	if err != nil || !valid {
		http.Error(w, "Authentication failed", http.StatusUnauthorized)
		return
	}

	// Generate a unique token
	tokenBytes := make([]byte, 16)
	_, err = rand.Read(tokenBytes)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	token := hex.EncodeToString(tokenBytes)

	// Store the token in memory or DB (simplified: in-memory map)
	security.StoreToken(token, userID, time.Now().Add(24*time.Hour))

	// Set cookie
	cookie := &http.Cookie{
		Name:    "FireedgeToken",
		Value:   token,
		Path:    "/",
		Expires: time.Now().Add(24 * time.Hour),
	}
	http.SetCookie(w, cookie)

	// Optionally redirect or return success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Authentication successful"))
}

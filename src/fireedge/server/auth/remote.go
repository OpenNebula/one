package auth

import (
	"net/http"
	"time"

	"github.com/OpenNebula/one/src/fireedge/pkg/auth/token"
)

func RemoteLoginHandler(w http.ResponseWriter, r *http.Request) {
	// Validate remote header
	username := r.Header.Get("x-auth-username")
	if username == "" {
		http.Error(w, "Missing authentication header", http.StatusUnauthorized)
		return
	}

	// Authenticate user (simplified, actual validation against one_xmlrpc)
	// ...

	// Generate token
	tokenStr, err := token.GenerateToken(username, time.Hour*24)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Set FireedgeToken cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "FireedgeToken",
		Value:    tokenStr,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // set to true in production
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400,
	})

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Authenticated"))
}

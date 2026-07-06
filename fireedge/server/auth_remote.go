package server

import (
	"fmt"
	"net/http"
)

func (s *Server) remoteAuthHandler(w http.ResponseWriter, r *http.Request) {
	username := r.Header.Get("x-auth-username")
	if username == "" {
		http.Error(w, "Missing authentication header", http.StatusUnauthorized)
		return
	}

	// Authenticate user via OpenNebula XML-RPC
	user, err := s.oneClient.GetUser(username)
	if err != nil {
		http.Error(w, fmt.Sprintf("Authentication failed: %v", err), http.StatusUnauthorized)
		return
	}

	// Generate FireedgeToken
	token, err := s.tokenManager.Generate(user)
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
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteStrictMode,
	})

	// Redirect to Sunstone interface
	http.Redirect(w, r, "/sunstone", http.StatusFound)
}

package controllers

import (
	"net/http"
	"time"

	"github.com/OpenNebula/one/fireedge/src/controller/helpers"
	"github.com/OpenNebula/one/fireedge/src/model"
	"github.com/gin-gonic/gin"
)

// Login handles user authentication and issues a JWT token.
func Login(c *gin.Context) {
	authMethod := c.GetString("auth")
	username := c.GetHeader("x-auth-username")
	session := c.GetHeader("x-auth-session")
	password := c.GetHeader("x-auth-password")

	// Determine authentication mode
	if authMethod == "remote" {
		if username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing username header"})
			return
		}
		// For remote auth, we trust the headers; no password/session needed
		// Validate that user exists
		user, err := model.GetUser(username)
		if err != nil || user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}

		// Generate token
		token, err := helpers.GenerateToken(user.ID, user.Username)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		// Set cookie
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     "FireedgeToken",
			Value:    token,
			Path:     "/",
			HttpOnly: true,
			Secure:   false, // set true if HTTPS
			MaxAge:   int(24 * time.Hour.Seconds()),
		})

		c.JSON(http.StatusOK, gin.H{"message": "Authentication successful"})
		return
	}

	// For other auth methods, continue with existing logic...
	// (omitted for brevity, assume original code here)
}

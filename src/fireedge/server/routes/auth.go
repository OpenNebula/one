package routes

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/OpenNebula/one/src/fireedge/server/api"
	"github.com/OpenNebula/one/src/fireedge/server/session"
)

// remoteAuthHandler handles remote authentication via HTTP headers.
// It extracts the username from the header, authenticates via XML-RPC,
// and sets the FireedgeToken cookie on success.
func remoteAuthHandler(c *gin.Context) {
	username := c.GetHeader("x-auth-username")
	if username == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing authentication header"})
		return
	}

	// Authenticate user via OpenNebula XML-RPC
	auth := api.NewAuthController()
	user, err := auth.AuthenticateRemote(username)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authentication failed"})
		return
	}

	// Generate session token
	sessionManager := session.NewManager()
	token, err := sessionManager.CreateToken(user.ID, time.Now().Add(24*time.Hour))
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	// Set the FireedgeToken cookie
	c.SetCookie("FireedgeToken", token, 86400, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{"message": "Authentication successful", "token": token})
}

// init registers the remote authentication route.
func init() {
	Router.GET("/remote/auth", remoteAuthHandler)
}

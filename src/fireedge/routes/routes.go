package routes

import (
	"github.com/OpenNebula/one/src/fireedge/handlers"
	"github.com/gorilla/mux"
)

func SetupRouter() *mux.Router {
	r := mux.NewRouter()
	// ... other routes
	r.HandleFunc("/api/sunstone/config", handlers.SunstoneConfigHandler).Methods("GET")
	return r
}
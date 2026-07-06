package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/OpenNebula/one/src/fireedge/config"
	"github.com/OpenNebula/one/src/fireedge/models"
)

func SunstoneConfigHandler(w http.ResponseWriter, r *http.Request) {
	cfg := config.DefaultConfig
	err := cfg.Load("")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	resp := models.SunstoneConfigResponse{
		TimeConfigurationSource: cfg.TimeConfigurationSource,
		Timezone:                cfg.Timezone,
		DateFormat:              cfg.DateFormat,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
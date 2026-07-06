package main

import (
	"encoding/json"
	"net/http"
	"time"
)

type SettingsResponse struct {
	TimezoneMode  string `json:"timezone_mode"`
	ServerTimezone string `json:"server_timezone,omitempty"`
}

func settingsHandler(cfg *SunstoneConfig) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := SettingsResponse{
			TimezoneMode: cfg.GetTimezoneMode(),
		}
		if resp.TimezoneMode == "os" {
			zone, _ := time.Now().Zone()
			resp.ServerTimezone = zone
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

// In main or router setup, register the endpoint:
// http.HandleFunc("/sunstone/config", settingsHandler(cfg))
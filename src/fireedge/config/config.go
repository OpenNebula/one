package config

import (
	"os"
	"strings"
	"time"
)

type SunstoneConfig struct {
	TimeConfigurationSource string `yaml:"time_configuration_source"`
	Timezone                string `yaml:"timezone"`
	DateFormat              string `yaml:"date_format"`
}

var DefaultConfig = SunstoneConfig{
	TimeConfigurationSource: "os",
	Timezone:                "",
	DateFormat:              "",
}

func (c *SunstoneConfig) Load(path string) error {
	// In production, this would parse YAML from sunstone-server.conf
	// For now, we simulate with environment variables
	source := os.Getenv("OPENNEBULA_TIME_CONFIGURATION_SOURCE")
	if source == "" {
		source = DefaultConfig.TimeConfigurationSource
	}
	c.TimeConfigurationSource = source

	if source == "timezone" {
		tz := os.Getenv("OPENNEBULA_TIMEZONE")
		if tz != "" {
			_, err := time.LoadLocation(tz)
			if err != nil {
				return err
			}
			c.Timezone = tz
		} else {
			// Fallback to OS default
			c.Timezone = "Local"
		}
	} else if source == "os" {
		// Use OS timezone
		c.Timezone = getOSTimezone()
	} else {
		// browser
		c.Timezone = ""
	}

	df := os.Getenv("OPENNEBULA_DATE_FORMAT")
	if df != "" {
		c.DateFormat = df
	} else {
		c.DateFormat = "24h" // default 24-hour format
	}

	return nil
}

func getOSTimezone() string {
	// Read /etc/timezone or use time.LoadLocation("Local")
	loc, _ := time.LoadLocation("Local")
	if loc != nil {
		name, _ := time.Now().In(loc).Zone()
		return name
	}
	return "UTC"
}
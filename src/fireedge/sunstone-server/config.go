package main

import (
	"github.com/OpenNebula/config"
)

type SunstoneConfig struct {
	// ... existing fields
	TimezoneMode string `mapstructure:"timezone_mode"`
}

func LoadSunstoneConfig(path string) (*SunstoneConfig, error) {
	cfg := &SunstoneConfig{
		TimezoneMode: "browser", // default
	}
	// ... existing parsing code
	viper := config.NewViper()
	viper.SetConfigFile(path)
	if err := viper.ReadInConfig(); err != nil {
		return nil, err
	}
	if err := viper.Unmarshal(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (c *SunstoneConfig) GetTimezoneMode() string {
	return c.TimezoneMode
}
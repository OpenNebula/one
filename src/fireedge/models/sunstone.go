package models

type SunstoneConfigResponse struct {
	TimeConfigurationSource string `json:"time_configuration_source"`
	Timezone                string `json:"timezone"`
	DateFormat              string `json:"date_format"`
}
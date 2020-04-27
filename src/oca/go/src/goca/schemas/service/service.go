package service

// Service schema
type Service struct {
	ID              int `json:",omitempty"`
	Name            string
	Deployment      string `json:",omitempty"`
	ShutdownAction  string `json:",omitempty"`
	ReadyStatusGate bool   `json:",omitempty"`
	Roles           []map[string]interface{}
}

type Permission struct {
}

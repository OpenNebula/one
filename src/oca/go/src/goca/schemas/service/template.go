package service

// Template schema
type Template struct {
	Name            string
	Roles           []map[string]interface{}
	ID              int                    `json:",omitempty"`
	Deployment      string                 `json:",omitempty"`
	ShutdownAction  string                 `json:",omitempty"`
	ReadyStatusGate bool                   `json:",omitempty"`
	JSON            map[string]interface{} `json:",omitempty"`
}

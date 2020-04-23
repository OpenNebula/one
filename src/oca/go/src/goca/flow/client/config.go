package client

// Config holds OpenNebula connection information for the flow client
type Config struct {
	user    string
	pass    string
	address string // oneflow server address, ie: http://localhost:2474
}

// NewConfig considering environment variables and such
func NewConfig(user, pass, address string) Config {
	var conf Config

	return conf
}

package main

import (
	"github.com/OpenNebula/docker-machine-opennebula"
	"github.com/docker/machine/libmachine/drivers/plugin"
)

func main() {
	plugin.RegisterDriver(opennebula.NewDriver("", ""))
}

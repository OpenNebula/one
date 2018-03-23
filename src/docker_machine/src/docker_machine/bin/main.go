package main

import (
	"docker_machine"
	"github.com/docker/machine/libmachine/drivers/plugin"
)

func main() {
	plugin.RegisterDriver(opennebula.NewDriver("", ""))
}

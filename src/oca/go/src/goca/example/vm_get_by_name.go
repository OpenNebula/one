package main

import (
	"log"

	"github.com/OpenNebula/one/src/oca/go/src/goca"
)

func main() {
	conf := goca.NewConfig("", "", "")
	client := goca.NewClient(conf)
	controller := goca.NewController(client)

	// Get VM id by name
	id, err := controller.VMByName("vm_name")
	if err != nil {
		log.Fatal(err)
	}

	// Fetch VM informations
	vm, err := controller.VM(id).Info()
	if err != nil {
		log.Fatal(err)
	}

	//Do some others stuffs on vm
}

package main

import (
	"log"

	"github.com/OpenNebula/one/src/oca/go/src/goca"
)

func main() {
	conf := goca.NewConfig("", "", "")
	client := goca.NewClient(conf)
	controller := goca.NewController(client)

	// Get a list of VM informations
	vmID, err := controller.VMs().Create(template, pending)
	if err != nil {
		log.Fatal(err)
	}

	// Fetch info on created VM
	vm, err := controller.VM(vmID).Info()
	if err != nil {
		log.Fatal(err)
	}

	//Do some others stuffs on vm
}

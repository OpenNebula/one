package main

import (
	"fmt"
	"log"

	"github.com/OpenNebula/one/src/oca/go/src/goca"
)

func main() {
	client := goca.NewDefaultClient(
		goca.NewConfig("", "", ""),
	)
	controller := goca.NewController(client)

	// Get VM id by name
	id, err := controller.VMs().ByName("vm_name")
	if err != nil {
		log.Fatal(err)
	}

	// Fetch VM informations
	vm, err := controller.VM(id).Info(false)
	if err != nil {
		log.Fatal(err)
	}

	// Do some stuffs on vm
	fmt.Printf("%+v\n", vm)
}

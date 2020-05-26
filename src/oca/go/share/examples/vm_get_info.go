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

	// Get short informations of the VMs
	vms, err := controller.VMs().Info()
	if err != nil {
		log.Fatal(err)
	}

	for i := 0; i < len(vms.VMs); i++ {
		// This Info method, per VM instance, give us detailed informations on the instance
		// Check xsd files to see the difference
		vm, err := controller.VM(vms.VMs[i].ID).Info(false)
		if err != nil {
			log.Fatal(err)
		}

		//Do some others stuffs on vm
		fmt.Printf("%+v\n", vm)
	}
}

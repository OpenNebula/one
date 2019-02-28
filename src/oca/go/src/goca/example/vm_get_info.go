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
	vms, err := controller.VMs().Info()
	if err != nil {
		log.Fatal(err)
	}

	for i := 0; i < len(vms.VMs); i++ {
		// This Info method, per VM instance, give us detailed informations on the instance
		vm, err := controller.VM(vms.VMs[i].ID).Info()
		if err != nil {
			log.Fatal(err)
		}

		//Do some others stuffs on vm
	}
}

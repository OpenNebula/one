package main

import (
	"fmt"
	"log"

	"github.com/OpenNebula/one/src/oca/go/src/goca"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm/keys"
)

func main() {
	client := goca.NewDefaultClient(
		goca.NewConfig("", "", ""),
	)
	controller := goca.NewController(client)

	// Build a string template. (No XML-RPC call done)
	// To make a VM from an existing OpenNebula template,
	// use template "Instantiate" method instead
	tpl := vm.NewTemplate()
	tpl.Add(keys.Name, "this-is-a-vm")
	tpl.CPU(1).Memory(64).VCPU(2)

	// The image ID should exist to make this example work
	disk := tpl.AddDisk()
	disk.Add(shared.ImageID, "119")
	disk.Add(shared.DevPrefix, "vd")

	// The network ID should exist to make this example work
	nic := tpl.AddNIC()
	nic.Add(shared.NetworkID, "3")
	nic.Add(shared.Model, "virtio")

	// Create VM from template
	vmID, err := controller.VMs().Create(tpl.String(), false)
	if err != nil {
		log.Fatal(err)
	}

	vmCtrl := controller.VM(vmID)

	// Fetch informations of the created VM
	vm, err := vmCtrl.Info(false)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("%+v\n", vm)

	// Poweroff the VM
	err = vmCtrl.Poweroff()
	if err != nil {
		log.Fatal(err)
	}

}

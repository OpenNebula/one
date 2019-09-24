package main

import (
	"fmt"
	"log"

	"github.com/OpenNebula/one/src/oca/go/src/goca"
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
)

func main() {
	client := goca.NewClient(
		goca.NewConfig("", "", ""),
	)
	controller := goca.NewController(client)

	// Build a string template. (No XML-RPC call done)
	// To make a VM from an existing OpenNebula template,
	// use template "Instantiate" method instead
	tpl := dyn.NewTemplateBuilder()
	tpl.AddValue("name", "this-is-a-vm")
	tpl.AddValue("cpu", 1)
	tpl.AddValue("vcpu", "2")
	tpl.AddValue("memory", "64")

	// The image ID should exist to make this example work
	vec := tpl.NewVector("disk")
	vec.AddValue("image_id", "119")
	vec.AddValue("dev_prefix", "vd")

	// Create VM from template
	vmID, err := controller.VMs().Create(tpl.String(), false)
	if err != nil {
		log.Fatal(err)
	}

	vmCtrl := controller.VM(vmID)

	// Fetch informations of the created VM
	vm, err := vmCtrl.Info()
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

/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/*--------------------------------------------------------------------------- */

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

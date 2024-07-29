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

package dynamic

import (
	"testing"
)

func TestTemplate(t *testing.T) {
	template := NewTemplate()

	// Main
	expectedMemory := 64

	template.AddPair("CPU", 1)
	template.AddPair("MEMORY", expectedMemory)
	template.AddPair("VCPU", "2")

	// Disk
	expectedDevPrefix := "vd"
	vector := template.AddVector("DISK")
	vector.AddPair("IMAGE_ID", "119")
	vector.AddPair("DEV_PREFIX", expectedDevPrefix)

	// NIC
	vector = template.AddVector("NIC")
	vector.AddPair("NETWORK_ID", "3")
	vector.AddPair("MODEL", "virtio")

	// retrieve and test some elements
	mem, err := template.GetInt("MEMORY")
	if err != nil {
		t.Errorf("Failed to retrieve the key \"MEMORY\" in the template: %s", err)
	}
	if mem != expectedMemory {
		t.Errorf("Unexpected memory amount retrieved from the template. Got:%d Expected:%d", mem, expectedMemory)
	}

	disk, err := template.GetVector("DISK")
	if err != nil {
		t.Errorf("Failed to retrieve the vector key \"DISK\" in the template: %s", err)
	}
	vecLen := len(disk.Pairs)
	if vecLen != 2 {
		t.Errorf("Unexpected count of elements in the \"DISK\" vector. Got:%d Expected:2", vecLen)
	}
	devPrefix, err := disk.GetStr("DEV_PREFIX")
	if err != nil {
		t.Errorf("Failed to retrieve the key \"DEV_PREFIX\" in the template: %s", err)
	}
	if devPrefix != expectedDevPrefix {
		t.Errorf("Unexpected dev prefix value from the disk vector. Got:%s Expected:%s", devPrefix, expectedDevPrefix)
	}

	// test the string output
	templateString := `CPU="1"
MEMORY="64"
VCPU="2"
DISK=[
    IMAGE_ID="119",
    DEV_PREFIX="vd" ]
NIC=[
    NETWORK_ID="3",
    MODEL="virtio" ]`

	if template.String() != templateString {
		t.Errorf("Unexpected template string representation. Got:%s Expected:%s", templateString, template.String())
	}

}

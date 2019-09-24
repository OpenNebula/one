/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
	"fmt"
)

func Example() {
	template := NewTemplateBuilder()

	// Main
	template.AddValue("cpu", 1)
	template.AddValue("memory", "64")
	template.AddValue("vcpu", "2")

	// Disk
	vector := template.NewVector("disk")
	vector.AddValue("image_id", "119")
	vector.AddValue("dev_prefix", "vd")

	// NIC
	vector = template.NewVector("nic")
	vector.AddValue("network_id", "3")
	vector.AddValue("model", "virtio")

	fmt.Println(template)
	// Output:
	// CPU="1"
	// MEMORY="64"
	// VCPU="2"
	// DISK=[
	//     IMAGE_ID="119",
	//     DEV_PREFIX="vd" ]
	// NIC=[
	//     NETWORK_ID="3",
	//     MODEL="virtio" ]
}

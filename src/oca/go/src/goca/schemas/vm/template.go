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

package vm

import (
	"encoding/base64"
	"encoding/xml"
	"fmt"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm/keys"
)

// Available template parts and keys are listed here: https://docs.opennebula.io/5.8/operation/references/template.html
// Some specific part are not defined: vCenter, Public Cloud, Hypervisor, User Inputs

// Template is a structure allowing to parse VM templates.
// It's defined in a semi-static way to guide the user among the bunch of values
type Template struct {
	dyn.Template
}

// NewTemplate returns a vm Template structure
func NewTemplate() *Template {
	return &Template{}
}

// Get returns the string value for a vm template
func (t *Template) Get(key keys.Template) (string, error) {
	return t.GetStr(string(key))
}

// GetI returns the integer value for an vm key
func (n *Template) GetI(key keys.Template) (int, error) {
	return n.GetInt(string(key))
}

// Add adds a vm template key, value pair
func (t *Template) Add(key keys.Template, value interface{}) {
	t.AddPair(string(key), value)
}

// Template parts

// Capacity template part

// CPU set the CPU amount to the template
func (t *Template) CPU(cpu float64) *Template {

	pair, err := t.GetPair(string(keys.CPU))
	if err != nil {
		t.AddPair(string(keys.CPU), cpu)
	} else {
		pair.Value = fmt.Sprint(cpu)
	}

	return t
}

// Memory set the memory amount to the template
func (t *Template) Memory(memory int) *Template {

	pair, err := t.GetPair(string(keys.Memory))
	if err != nil {
		t.AddPair(string(keys.Memory), memory)
	} else {
		pair.Value = fmt.Sprint(memory)
	}

	return t
}

// VCPU set the VCPU count to the template
func (t *Template) VCPU(vcpu int) *Template {

	pair, err := t.GetPair(string(keys.VCPU))
	if err != nil {
		t.AddPair(string(keys.VCPU), vcpu)
	} else {
		pair.Value = fmt.Sprint(vcpu)
	}

	return t
}

// GetCPU return the CPU amount from a VM Template
func (t *Template) GetCPU() (float64, error) {

	CPU, err := t.GetFloat(string(keys.CPU))
	if err != nil {
		return -1, err
	}

	return CPU, nil
}

// GetMemory return the memory amount from a VM Template
func (t *Template) GetMemory() (int, error) {

	Memory, err := t.GetInt(string(keys.Memory))
	if err != nil {
		return -1, err
	}

	return Memory, nil
}

// GetVCPU return the VCPU count from a VM Template
func (t *Template) GetVCPU() (int, error) {

	VCPU, err := t.GetInt(string(keys.VCPU))
	if err != nil {
		return -1, err
	}

	return VCPU, nil
}

// GetDisk allow to get disks from Template
func (t *Template) GetDisks() []shared.Disk {

	vecs := t.GetVectors(string(shared.DiskVec))
	disks := make([]shared.Disk, len(vecs))

	for i, v := range vecs {
		disks[i] = shared.Disk{*v}
	}

	return disks
}

// GetNICs allow to get NICs from Template
func (t *Template) GetNICs() []shared.NIC {

	vecs := t.GetVectors(string(shared.NICVec))
	nics := make([]shared.NIC, len(vecs))

	for i, v := range vecs {
		nics[i] = shared.NIC{*v}
	}

	return nics
}

// AddDisk allow to add a disk to the template
func (t *Template) AddDisk() *shared.Disk {
	disk := shared.NewDisk()
	t.Elements = append(t.Elements, disk)
	return disk
}

// AddNIC allow to add a NIC to the template
func (t *Template) AddNIC() *shared.NIC {
	nic := shared.NewNIC()
	t.Elements = append(t.Elements, nic)
	return nic
}

// Show back template part

func (t *Template) Showback(key keys.Showback, value interface{}) *Template {

	t.Template.Del(string(key))
	t.Template.AddPair(string(key), value)

	return t
}

func (t *Template) GetShowback(key keys.Showback) (string, error) {
	return t.Template.GetStr(string(key))
}

// OS template part

func (t *Template) AddOS(key keys.OS, value string) error {
	return t.Template.AddPairToVec(keys.OSVec, string(key), value)
}

func (t *Template) GetOS(key keys.OS) (string, error) {
	return t.Template.GetStrFromVec(string(keys.OSVec), string(key))
}

// CPU model part

// CPUModel set the model of the CPU
func (t *Template) CPUModel(value string) *Template {

	t.Template.Del(string(keys.CPUModelVec))
	t.Template.AddPairToVec(keys.CPUModelVec, string(keys.Model), value)

	return t
}

// GetCPUModel get the model of the CPU
func (t *Template) GetCPUModel(key keys.CPUModel) (string, error) {
	cpuModVec, err := t.Template.GetVector(string(keys.CPUModelVec))
	if err != nil {
		return "", fmt.Errorf("Template.GetCPUModel: vector %s: %s", keys.CPUModelVec, err)
	}
	return cpuModVec.GetStr(string(key))
}

// Features template part

func (t *Template) AddFeature(key keys.Feature, value string) error {
	return t.Template.AddPairToVec(keys.FeaturesVec, string(key), value)
}

func (t *Template) GetFeature(key keys.Feature) (string, error) {
	return t.Template.GetStrFromVec(string(keys.FeaturesVec), string(key))
}

// I/O devices template part

func (t *Template) AddIOGraphic(key keys.IOGraphics, value interface{}) error {
	return t.Template.AddPairToVec(keys.IOGraphicsVec, string(key), value)
}

func (t *Template) GetIOGraphic(key keys.IOGraphics) (string, error) {
	return t.Template.GetStrFromVec(string(keys.IOGraphicsVec), string(key))
}

func (t *Template) AddIOInput(key keys.IOInput, value string) error {
	return t.Template.AddPairToVec(keys.IOGraphicsVec, string(key), value)
}

func (t *Template) GetIOInput(key keys.IOInput) (string, error) {
	return t.Template.GetStrFromVec(string(keys.IOGraphicsVec), string(key))
}

// Context template part

// GetCtx retrieve a context key
func (t *Template) GetCtx(key keys.Context) (string, error) {
	return t.GetStrFromVec(string(keys.ContextVec), string(key))
}

// Add adds a context key, value pair
func (t *Template) AddCtx(key keys.Context, value interface{}) error {
	return t.AddPairToVec(keys.ContextVec, string(key), value)
}

// Add adds a context key, value pair. It will convert value to base64
func (t *Template) AddB64Ctx(key keys.ContextB64, value interface{}) error {
	valueBytes := []byte(fmt.Sprint(value))
	valueB64 := base64.StdEncoding.EncodeToString(valueBytes)
	return t.AddPairToVec(keys.ContextVec, string(key), valueB64)
}

// Placement Template part

// Placement set once a placement attribute
func (t *Template) Placement(key keys.Placement, value interface{}) *Template {

	t.Template.Del(string(key))
	t.Template.AddPair(string(key), value)

	return t
}

func (t *Template) GetPlacement(key keys.Placement) (string, error) {
	return t.Template.GetStr(string(key))
}

// Scheduled actions template part

// SchedAction is a scheduled action on VM
type SchedAction struct {
	dyn.Vector
}

// AddSchedAction returns a structure disk entity to build
func (t *Template) AddSchedAction() *SchedAction {
	action := &SchedAction{
		dyn.Vector{XMLName: xml.Name{Local: keys.SchedActionVec}},
	}
	t.Template.Elements = append(t.Template.Elements, action)

	return action
}

// Add adds a SchedAction key, value pair
func (t *SchedAction) Add(key keys.SchedAction, value interface{}) {
	t.AddPair(string(key), value)
}

// Get retrieve a SchedAction key
func (t *SchedAction) Get(key keys.SchedAction) (string, error) {
	return t.GetStr(string(key))
}

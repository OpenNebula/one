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

package goca

import (
	"testing"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/template"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm/keys"
)

// Helper to create a template
func createTemplate(t *testing.T) (*template.Template, int) {
	templateName := GenName("template")

	// Create template
	tpl := vm.NewTemplate()
	tpl.Add(keys.Name, templateName)
	tpl.CPU(1).Memory(64)

	id, err := testCtrl.Templates().Create(tpl.String())
	if err != nil {
		t.Fatal(err)
	}

	// Get template by ID
	template, err := testCtrl.Template(id).Info(false, false)

	if err != nil {
		t.Error(err)
	}

	return template, id
}

func TestTemplateCreateAndDelete(t *testing.T) {
	var err error

	template, idOrig := createTemplate(t)

	idParse := template.ID
	if idParse != idOrig {
		t.Errorf("Template ID does not match")
	}

	// Get template by Name
	name := template.Name
	id, err := testCtrl.Templates().ByName(name)
	if err != nil {
		t.Fatal(err)
	}

	template, err = testCtrl.Template(id).Info(false, false)
	if err != nil {
		t.Error(err)
	}

	idParse = template.ID
	if idParse != idOrig {
		t.Errorf("Template ID does not match")
	}

	// Delete template
	err = testCtrl.Template(id).Delete()
	if err != nil {
		t.Error(err)
	}
}

func TestTemplateInstantiate(t *testing.T) {
	templateName := GenName("template")

	// Create template
	tpl := vm.NewTemplate()
	tpl.Add(keys.Name, templateName)
	tpl.CPU(1).Memory(64)

	id, err := testCtrl.Templates().Create(tpl.String())
	if err != nil {
		t.Error(err)
	}

	// Get template by ID
	templateC := testCtrl.Template(id)

	// Instantiate(name string, pending bool, extra string) (uint, error)
	vmid, err := templateC.Instantiate("", false, "", false)
	if err != nil {
		t.Error(err)
	}

	err = testCtrl.VM(vmid).Terminate()
	if err != nil {
		t.Error(err)
	}

	// Delete template
	err = templateC.Delete()
	if err != nil {
		t.Error(err)
	}
}

func TestTemplateUpdate(t *testing.T) {

	template, _ := createTemplate(t)
	templateCtrl := testCtrl.Template(template.ID)

	tpl := dyn.NewTemplate()
	tpl.AddPair("A", "B")

	// Update
	templateCtrl.Update(tpl.String(), 1)

	template, err := templateCtrl.Info(false, false)
	if err != nil {
		t.Error(err)
	}

	val, err := template.Template.GetStr("A")
	if err != nil {
		t.Errorf("Test failed, can't retrieve '%s', error: %s", "A", err.Error())
	} else {
		if val != "B" {
			t.Errorf("Expecting A=B")
		}
	}

	// Delete template
	err = templateCtrl.Delete()
	if err != nil {
		t.Error(err)
	}
}

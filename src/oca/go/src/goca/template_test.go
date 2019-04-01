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

package goca

import (
	"testing"
)

// Helper to create a template
func createTemplate(t *testing.T) (*Template, uint) {
	templateName := GenName("template")

	// Create template
	tpl := NewTemplateBuilder()

	tpl.AddValue("name", templateName)
	tpl.AddValue("cpu", 1)
	tpl.AddValue("memory", "64")

	id, err := CreateTemplate(tpl.String())
	if err != nil {
		t.Error(err)
	}

	// Get template by ID
	template := NewTemplate(id)

	err = template.Info()
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
	template, err = NewTemplateFromName(name)
	if err != nil {
		t.Fatal(err)
	}

	err = template.Info()
	if err != nil {
		t.Error(err)
	}

	idParse = template.ID
	if idParse != idOrig {
		t.Errorf("Template ID does not match")
	}

	// Delete template
	err = template.Delete()
	if err != nil {
		t.Error(err)
	}
}

func TestTemplateInstantiate(t *testing.T) {
	templateName := GenName("template")

	// Create template
	tpl := NewTemplateBuilder()

	tpl.AddValue("name", templateName)
	tpl.AddValue("cpu", 1)
	tpl.AddValue("memory", "64")

	id, err := CreateTemplate(tpl.String())
	if err != nil {
		t.Error(err)
	}

	// Get template by ID
	template := NewTemplate(id)

	// Instantiate(name string, pending bool, extra string) (uint, error)
	vmid, err := template.Instantiate("", false, "", false)
	if err != nil {
		t.Error(err)
	}

	vm := NewVM(vmid)
	vm.Terminate()

	// Delete template
	err = template.Delete()
	if err != nil {
		t.Error(err)
	}
}

func TestTemplateUpdate(t *testing.T) {
	template, _ := createTemplate(t)

	tpl := NewTemplateBuilder()
	tpl.AddValue("A", "B")

	// Update
	template.Update(tpl.String(), 1)

	err := template.Info()
	if err != nil {
		t.Error(err)
	}

	val, err := template.Template.Dynamic.GetContentByName("A")
	if err != nil {
		t.Errorf("Test failed, can't retrieve '%s', error: %s", "A", err.Error())
	} else {
		if val != "B" {
			t.Errorf("Expecting A=B")
		}
	}

	// Delete template
	err = template.Delete()
	if err != nil {
		t.Error(err)
	}
}

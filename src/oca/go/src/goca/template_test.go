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
	vmid, err := template.Instantiate("", false, "")
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

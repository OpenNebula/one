package goca

import (
	"testing"
)

// Helper to create a template
func createTemplate(t *testing.T) *Template {
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

	return template
}

func TestTemplateCreateAndDelete(t *testing.T) {
	template := createTemplate(t)

	idParse, err := GetID(t, template, "VMTEMPLATE")
	if err != nil {
		t.Error(err)
	}

	if idParse != template.ID {
		t.Errorf("Template ID does not match")
	}

	// Get template by Name
	templateName, ok := template.XPath("/VMTEMPLATE/NAME")
	if !ok {
		t.Errorf("Could not get name")
	}

	template, err = NewTemplateFromName(templateName)
	if err != nil {
		t.Error(err)
	}

	err = template.Info()
	if err != nil {
		t.Error(err)
	}

	idParse, err = GetID(t, template, "VMTEMPLATE")

	if idParse != template.ID {
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
	template := createTemplate(t)

	tpl := NewTemplateBuilder()
	tpl.AddValue("A", "B")

	// Update
	template.Update(tpl.String(), 1)

	err := template.Info()
	if err != nil {
		t.Error(err)
	}

	if val, ok := template.XPath("/VMTEMPLATE/TEMPLATE/A"); !ok || val != "B" {
		t.Errorf("Expecting A=B")
	}

	// Delete template
	err = template.Delete()
	if err != nil {
		t.Error(err)
	}
}

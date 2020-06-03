package goca

import (
	"fmt"
	"testing"
)

func TestService(t *testing.T) {
	c := createController()
	services := c.Services()

	response, e := services.List()

	if e != nil {
		t.Fatal(e)
	}

	fmt.Println(response)
}

func createController() *Controller {
	config := NewFlowConfig("", "", "")
	client := NewRESTClient(config)

	controller := NewController(nil)

	controller.ClientFlow = client

	return controller
}

func createRole(name string) map[string]interface{} {
	return map[string]interface{}{
		"name":                name,
		"cardiniality":        1,
		"vm_template":         0,
		"elasticity_policies": []map[string]interface{}{},
		"scheduled_policies":  []map[string]interface{}{},
	}
}

package goca

import (
	"fmt"
	"strconv"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/service"
)

var endpointFService string

func init() {
	endpointFService = "service"
}

// ServiceController interacts with oneflow service. Uses REST Client.
type ServiceController entityController

// ServicesController interacts with oneflow services. Uses REST Client.
type ServicesController entitiesController

// Service Controller constructor
func (c *Controller) Service(id int) *ServiceController {
	return &ServiceController{c, id}
}

// Services Controller constructor
func (c *Controller) Services() *ServicesController {
	return &ServicesController{c}
}

// NewService constructor
func NewService(docJSON map[string]interface{}) *service.Service {
	var serv service.Service

	template := NewTemplate(docJSON)

	serv.Template = *template
	serv.State = template.JSON["state"].(int)

	return &serv
}

// OpenNebula Actions

// Show the SERVICE resource identified by <id>
func (sc *ServiceController) Info() (*service.Service, error) {
	url := urlService(sc.ID)

	response, e := sc.c.ClientFlow.HTTPMethod("GET", url)

	if e != nil {
		return &service.Service{}, e
	}

	return NewService(documentJSON(response)), nil
}

// Delete the SERVICE resource identified by <id>
func (sc *ServiceController) Delete() (bool, string) {
	url := urlService(sc.ID)

	return sc.c.boolResponse("DELETE", url, nil)
}

// Shutdown running services
func (sc *ServiceController) Shutdown() (bool, string) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "shutdown",
	}

	return sc.Action(action)
}

// Recover existing service
func (sc *ServiceController) Recover() (bool, string) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "recover",
	}

	return sc.Action(action)
}

// List the contents of the SERVICE collection.
func (ssc *ServicesController) Info() ([]*service.Service, error) {
	var services []*service.Service

	response, e := ssc.c.ClientFlow.HTTPMethod("GET", endpointFService)

	if e != nil {
		return services, e
	}

	documents := response.BodyMap()["DOCUMENT_POOL"].(map[string]interface{})

	for _, v := range documents {
		service := NewService(v.(map[string]interface{}))
		services = append(services, service)
	}

	return services, e
}

// Role operations

// Scale the cardinality of a service role
func (sc *ServiceController) Scale(role string, cardinal int) (bool, string) {

	roleBody := make(map[string]interface{})

	roleBody["cardinality"] = 2
	roleBody["force"] = true

	return sc.UpdateRole(role, roleBody)
}

// VMAction performs the action on every VM belonging to role. Available actions:
// shutdown, shutdown-hard, undeploy, undeploy-hard, hold, release, stop, suspend, resume, boot, delete, delete-recreate, reboot, reboot-hard, poweroff, poweroff-hard, snapshot-create.
// Example params. Read the flow API docu.
// map[string]interface{}{
// 			"period": 60,
// 			"number": 2,
// 		},
// TODO: enforce only available actions
func (sc *ServiceController) VMAction(role, name string, params map[string]interface{}) (bool, string) {
	url := fmt.Sprintf("%s/action", urlRole(sc.ID, role))

	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": name,
		"params":  params,
	}

	return sc.c.boolResponse("POST", url, action)
}

// UpdateRole of a given Service
func (sc *ServiceController) UpdateRole(name string, body map[string]interface{}) (bool, string) {
	url := urlRole(sc.ID, name)

	return sc.c.boolResponse("PUT", url, body)
}

// Permissions operations

// Chgrp service
func (sc *ServiceController) Chgrp(gid int) (bool, string) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chgrp",
		"params": map[string]interface{}{
			"group_id": gid,
		},
	}

	return sc.Action(action)
}

// Chown service
func (sc *ServiceController) Chown(uid, gid int) (bool, string) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chgrp",
		"params": map[string]interface{}{
			"group_id": gid,
			"user_id":  uid,
		},
	}

	return sc.Action(action)
}

// Chmod service
func (sc *ServiceController) Chmod(owner, group, other int) (bool, string) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chgrp",
		"params": map[string]interface{}{
			"owner": owner,
			"group": group,
			"other": other,
		},
	}

	return sc.Action(action)
}

// Helpers

func documentJSON(response *Response) map[string]interface{} {
	responseJSON := response.BodyMap()

	return responseJSON["DOCUMENT"].(map[string]interface{})
}

func urlServiceAction(id int) string {
	return fmt.Sprintf("%s/action", urlService(id))
}

func urlRole(id int, name string) string {
	return fmt.Sprintf("%s/role/%s", urlService(id), name)

}

func urlService(id int) string {
	return fmt.Sprintf("%s/%s", endpointFService, strconv.Itoa(id))
}

// Action handler for existing flow services. Requires the action body.
func (sc *ServiceController) Action(action map[string]interface{}) (bool, string) {
	url := urlServiceAction(sc.ID)

	return sc.c.boolResponse("POST", url, action)
}

func (c *Controller) boolResponse(method string, url string, body map[string]interface{}) (bool, string) {
	response, e := c.ClientFlow.HTTPMethod(method, url, body)

	if e != nil {
		return false, e.Error()
	}

	return response.status, response.Body()
}

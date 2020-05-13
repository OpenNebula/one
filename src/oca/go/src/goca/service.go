package goca

import (
	"fmt"
	"strconv"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/service"
)

var endpoint string

func init() {
	endpoint = "service"
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
func (c *Controller) Services(id int) *ServiceController {
	return &ServiceController{c, id}
}

// NewService constructor
func NewService(docJSON map[string]interface{}) *service.Service {
	var serv service.Service

	body := docJSON["TEMPLATE"].(map[string]interface{})["BODY"].(map[string]interface{})

	id, err := strconv.Atoi(docJSON["ID"].(string))

	if err == nil {
		serv.ID = id
	}

	serv.Name = body["name"].(string)
	serv.Deployment = body["deployment"].(string)

	ready, err := strconv.ParseBool(body["deployment"].(string))

	if err == nil {
		serv.ReadyStatusGate = ready
	}

	return &serv
}

// Map returns the map representation of a service
func (sc *ServiceController) Map(service *service.Service) map[string]interface{} {
	serv := make(map[string]interface{})

	return serv
}

// OpenNebula Actions

// Show the SERVICE resource identified by <id>
func (sc *ServiceController) Show() (*service.Service, error) {
	url := urlService(sc.ID)

	response, e := sc.c.ClientREST.HTTPMethod("GET", url)

	if e != nil {
		return &service.Service{}, e
	}

	return NewService(documentJSON(response)), nil
}

// Delete the SERVICE resource identified by <id>
func (sc *ServiceController) Delete() (bool, string) {
	url := urlService(sc.ID)

	response, e := sc.c.ClientREST.HTTPMethod("DELETE", url)

	if e != nil {
		return false, e.Error()
	}

	return response.status, response.Body()
}

// Shutdown running services
func (sc *ServiceController) Shutdown() (bool, string) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "shutdown",
	}

	return sc.serviceAction(action)
}

// Recover existing service
func (sc *ServiceController) Recover() (bool, string) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "recover",
	}

	return sc.serviceAction(action)
}

// Chgrp service
func (sc *ServiceController) Chgrp(gid int) (bool, string) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chgrp",
		"params": map[string]interface{}{
			"group_id": gid,
		},
	}

	return sc.serviceAction(action)
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

	return sc.serviceAction(action)
}

// TODO: Confirm param keys
// Chmod service
func (sc *ServiceController) Chmod(owner, user, other int) (bool, string) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chgrp",
		"params": map[string]interface{}{
			"owner": owner,
			"group": user,
			"other": other,
		},
	}

	return sc.serviceAction(action)
}

// List the contents of the SERVICE collection.
func (ssc *ServicesController) List() (*[]*service.Service, error) {
	var services []*service.Service

	response, e := ssc.c.ClientREST.HTTPMethod("GET", endpoint)

	if e != nil {
		services = append(services, &service.Service{})
		return &services, e
	}

	documents := response.BodyMap()["DOCUMENT_POOL"].(map[string]interface{})

	for _, v := range documents {
		service := NewService(v.(map[string]interface{}))
		services = append(services, service)
	}

	return &services, e
}

// Helpers

func documentJSON(response *Response) map[string]interface{} {
	responseJSON := response.BodyMap()

	return responseJSON["DOCUMENT"].(map[string]interface{})
}

func urlService(id int) string {
	return fmt.Sprintf("%s/%s", endpoint, strconv.Itoa(id))
}

func urlAction(id int) string {
	return fmt.Sprintf("%s/%s/action", endpoint, strconv.Itoa(id))
}

// Generic action for existing flow services. Requires the action body.
func (sc *ServiceController) serviceAction(action map[string]interface{}) (bool, string) {
	url := urlAction(sc.ID)

	response, e := sc.c.ClientREST.HTTPMethod("POST", url, action)

	if e != nil {
		return false, e.Error()
	}

	return response.status, response.Body()
}

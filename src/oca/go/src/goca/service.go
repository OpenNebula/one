package goca

import (
	"fmt"
	"strconv"
	"encoding/json"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/service"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
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

// OpenNebula Actions

// Get the service pool
func (sc *ServicesController) Info() (*service.Pool, error) {
	response, err := sc.c.ClientFlow.HTTPMethod("GET", endpointFService)
	if err != nil {
		return nil, err
	}
	servicepool := &service.Pool{}
	pool_str, err := json.Marshal(response.BodyMap()["DOCUMENT_POOL"])
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(pool_str, servicepool)
	if err != nil {
		return nil, err
	}

	return servicepool, err
}

// Get the service resource identified by <id>
func (sc *ServiceController) Info() (*service.Service, error) {
	url := urlService(sc.ID)
	response, err := sc.c.ClientFlow.HTTPMethod("GET", url)
	if err != nil {
		return nil, err
	}

	service := &service.Service{}
	service_str, err := json.Marshal(response.BodyMap()["DOCUMENT"])
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(service_str, service)
	if err != nil {
		return nil, err
	}

	return service, nil
}

// Delete the service resource identified by <id>
func (sc *ServiceController) Delete() (bool, error) {
	url := urlService(sc.ID)

	return sc.c.boolResponse("DELETE", url, nil)
}

// Recover existing service if delete de service is recover and deleted
func (sc *ServiceController) Recover(delete bool) (bool, error) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "recover",
		"params":  map[string]interface{}{
			"delete": delete,
		},
	}

	return sc.action(action)
}

// Permissions operations

// Chgrp service
func (sc *ServiceController) Chgrp(gid int) (bool, error) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chgrp",
		"params": map[string]interface{}{
			"group_id": gid,
		},
	}

	return sc.action(action)
}

// Chown service
func (sc *ServiceController) Chown(uid, gid int) (bool, error) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chown",
		"params": map[string]interface{}{
			"group_id": gid,
			"owner_id": uid,
		},
	}

	return sc.action(action)
}

// Chmod service
func (sc *ServiceController) Chmod(perm shared.Permissions) (bool, error) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "chmod",
		"params": map[string]interface{}{
			"octet": strconv.Itoa(perm.Octet()),
		},
	}

	return sc.action(action)
}

// Rename service
func (sc *ServiceController) Rename(new_name string) (bool, error) {
	action := make(map[string]interface{})

	action["action"] = map[string]interface{}{
		"perform": "rename",
		"params": map[string]interface{}{
			"name": new_name,
		},
	}

	return sc.action(action)
}

// Role level actions

// Scale the cardinality of a service role
func (sc *ServiceController) Scale(role string, cardinality int, force bool) (bool, error) {
	url := fmt.Sprintf("%s/scale", urlService(sc.ID))

	body := make(map[string]interface{})
	body["role_name"] = role
	body["cardinality"] = cardinality
	body["force"] = force

	return sc.c.boolResponse("POST", url, body)
}

// VMAction performs the action on every VM belonging to role. Available actions:
// shutdown, shutdown-hard, undeploy, undeploy-hard, hold, release, stop, suspend,
// resume, boot, delete, delete-recreate, reboot, reboot-hard, poweroff, poweroff-hard, snapshot-create.
// Example params. Read the flow API docu.
// map[string]interface{}{
// 			"period": 60,
// 			"number": 2,
// 		},
// TODO: enforce only available actions
func (sc *ServiceController) VMAction(role, action string, params map[string]interface{}) (bool, error) {
	url := fmt.Sprintf("%s/action", urlRole(sc.ID, role))

	body := make(map[string]interface{})
	body["action"] = map[string]interface{}{
		"perform": action,
		"params":  params,
	}

	return sc.c.boolResponse("POST", url, body)
}

// Helpers

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
func (sc *ServiceController) action(action map[string]interface{}) (bool, error) {
	url := urlServiceAction(sc.ID)

	return sc.c.boolResponse("POST", url, action)
}

func (c *Controller) boolResponse(method string, url string, body map[string]interface{}) (bool, error) {
	response, err := c.ClientFlow.HTTPMethod(method, url, body)

	if err != nil {
		return false, err
	}

	return response.status, nil
}

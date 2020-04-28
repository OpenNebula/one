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

type ServiceController entityController

func (c *Controller) Service(id int) *ServiceController {
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
func (sc *ServiceController) Show(id int) (*service.Service, error) {
	url := urlServiceID(id)

	response, e := sc.c.Client2.Get(url)

	if e != nil {
		return &service.Service{}, e
	}

	return NewService(documentJSON(response)), nil
}

// Delete the SERVICE resource identified by <id>
func (sc *ServiceController) Delete(id int) (bool, string) {
	url := urlServiceID(sc.ID)

	response, e := sc.c.Client2.Delete(url)

	if e != nil {
		return false, e.Error()
	}

	return response.status, response.Body()
}

// Shutdown Running service
func (sc *ServiceController) Shutdown(id int) (bool, string) {
	url := urlServiceID(id)

	action := make(map[string]interface{})
	action["perform"] = "shutdown"

	response, e := sc.c.Client2.Post(url, action)

	if e != nil {
		return false, e.Error()
	}

	return response.status, response.Body()
}

// List the contents of the SERVICE collection.
func List(client *RESTClient) *[]service.Service {
	var services []service.Service

	// url := fmt.Sprintf("%s/%s", client.Address, endpoint)

	// servlist := Btomap(client.Get(url))

	// Iterate map >> Build service >> Push service to array

	return &services
}

// Helpers

func documentJSON(response *Response) map[string]interface{} {
	responseJSON := response.BodyMap()

	return responseJSON["DOCUMENT"].(map[string]interface{})
}

func urlServiceID(id int) string {
	return fmt.Sprintf("%s/%s", endpoint, strconv.Itoa(id))
}

package service

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/OpenNebula/one/src/oca/go/src/goca/flow/client"
	"github.com/OpenNebula/one/src/oca/go/src/goca/flow/schemas/service"
)

var endpoint string

func init() {
	endpoint = "service"
}

// OpenNebula Actions

// Show the SERVICE resource identified by <id>
func Show(client client.Client, id int) service.Service {
	url := urlServiceID(id)

	response := client.Get(client, url)

	return New(documentJSON(response))
}

// Delete the SERVICE resource identified by <id>
func Delete(client client.Client, id int) (bool, string) {
	url := urlServiceID(id)

	response := client.Delete(client, url)

	result := checkHttpStatus(204, response)
	return result, client.Btostr(response)
}

func Shutdown(client client.Client, id int) (bool, string) {
	url := urlServiceID(id)
	action := make(map[string]interface{})

	response := client.Post(client, url, action)

	result := checkHttpStatus(201, response)
	return result, client.Btostr(response)
}

// List the contents of the SERVICE collection.
func List(client client.Client) []service.Service {
	var services []service.Service

	// url := fmt.Sprintf("%s/%s", client.Address, endpoint)

	// servlist := Btomap(client.Get(client, url))

	// Iterate map >> Build service >> Push service to array

	return services
}

// Helpers

// New Service constructor
func New(docJSON map[string]interface{}) service.Service {
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

	return serv
}

// Map returns the map representation of a service
func Map(service service.Service) map[string]interface{} {
	serv := make(map[string]interface{})

	return serv
}

func documentJSON(response *http.Response) map[string]interface{} {
	responseJSON := client.Btomap(response)

	return responseJSON["DOCUMENT"].(map[string]interface{})
}

func urlServiceID(id int) string {
	return fmt.Sprintf("%s/%s", endpoint, strconv.Itoa(id))
}

func checkHttpStatus(status int, response *http.Response) bool {
	var result bool

	if response.StatusCode != status {
		result = false

	} else {
		result = true
	}

	return result
}

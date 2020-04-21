package service

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/OpenNebula/one/src/oca/go/src/goca/flow/httpclient"
	"github.com/OpenNebula/one/src/oca/go/src/goca/flow/schemas/service"
)

var endpoint string

func init() {
	endpoint = "service"
}

// OpenNebula Actions

// Show the SERVICE resource identified by <id>
func Show(client httpclient.Client, id int) service.Service {
	url := urlServiceID(id)

	response := httpclient.Get(client, url)

	return New(documentJSON(response))
}

// Delete the SERVICE resource identified by <id>
func Delete(client httpclient.Client, id int) (bool, string) {
	url := urlServiceID(id)

	response := httpclient.Delete(client, url)

	var result bool

	if response.StatusCode != 204 {
		result = false

	} else {
		result = true
	}

	return result, httpclient.Btostr(response)
}

func Shutdown(client httpclient.Client, id int) (bool, string) {
	url := urlServiceID(id)

	action := make(map[string]interface{})

	response := httpclient.Post(client, url, action)

	var result bool

	if response.StatusCode != 201 {
		result = false

	} else {
		result = true
	}

	return result, httpclient.Btostr(response)
}

// List the contents of the SERVICE collection.
func List(client httpclient.Client) []service.Service {
	var services []service.Service

	// url := fmt.Sprintf("%s/%s", client.Address, endpoint)

	// servlist := Btomap(httpclient.Get(client, url))

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
	responseJSON := httpclient.Btomap(response)

	return responseJSON["DOCUMENT"].(map[string]interface{})
}

func urlServiceID(id int) string {
	return fmt.Sprintf("%s/%s", endpoint, strconv.Itoa(id))
}

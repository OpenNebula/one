package template

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/OpenNebula/one/src/oca/go/src/flow/httpclient"
)

var endpoint string

func init() {
	endpoint = "service_template"
}

// List the contents of the SERVICE_TEMPLATE collection.
func List(client httpclient.Client) *http.Response {
	url := fmt.Sprintf("%s/%s", client.Address, endpoint)

	return httpclient.Get(client, url)
}

// Show the SERVICE_TEMPLATE resource identified by <id>
func Show(client httpclient.Client, id int) *http.Response {
	url := fmt.Sprintf("%s/%s/%s", client.Address, endpoint, strconv.Itoa(id))

	return httpclient.Get(client, url)
}

// Delete the SERVICE_TEMPLATE resource identified by <id>
func Delete(client httpclient.Client, id int) *http.Response {
	url := fmt.Sprintf("%s/%s/%s", client.Address, endpoint, strconv.Itoa(id))

	return httpclient.Delete(client, url)
}

// Create a new SERVICE_TEMPLATE resource.
func Create(body map[string]interface{}) {

}

// Update the SERVICE_TEMPLATE resource identified by <id>.
func Update() {

}

// Permissions

func Chown(id int) {

}

func Chwgrp(id int) {

}

func Chwmod(id int) {

}

// Perform an action on the SERVICE_TEMPLATE resource identified by <id>. Available actions: instantiate, chown, chgrp, chmod
func action(id int, action string) {

}

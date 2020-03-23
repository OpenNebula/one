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
func List(class httpclient.Auth) *http.Response {
	url := fmt.Sprintf("%s/%s", class.Oned, endpoint)

	return httpclient.Get(url, class.User, class.Pass)
}

// Show the SERVICE_TEMPLATE resource identified by <id>
func Show(class httpclient.Auth, id int) *http.Response {
	url := fmt.Sprintf("%s/%s/%s", class.Oned, endpoint, strconv.Itoa(id))

	return httpclient.Get(url, class.User, class.Pass)
}

// Delete the SERVICE_TEMPLATE resource identified by <id>
func Delete(class httpclient.Auth, id int) *http.Response {
	url := fmt.Sprintf("%s/%s/%s", class.Oned, endpoint, strconv.Itoa(id))

	return httpclient.Delete(url, class.User, class.Pass)
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

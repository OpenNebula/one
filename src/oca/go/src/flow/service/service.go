package service

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/oneflow-rest/httpclient"
)

var endpoint string

func init() {
	endpoint = "service"
}

// List the contents of the SERVICE collection.
func List(class httpclient.Auth) *http.Response {
	url := fmt.Sprintf("%s/%s", class.Oned, endpoint)

	return httpclient.Get(url, class.User, class.Pass)
}

// Show the SERVICE resource identified by <id>
func Show(class httpclient.Auth, id int) *http.Response {
	url := fmt.Sprintf("%s/%s/%s", class.Oned, endpoint, strconv.Itoa(id))

	return httpclient.Get(url, class.User, class.Pass)
}

// Delete the SERVICE resource identified by <id>
func Delete(class httpclient.Auth, id int) *http.Response {
	url := fmt.Sprintf("%s/%s/%s", class.Oned, endpoint, strconv.Itoa(id))

	return httpclient.Delete(url, class.User, class.Pass)
}

// Update the ROLE identified by <name> of the SERVICE resource identified by <id>. Currently the only attribute that can be updated is the cardinality.
func Scale(id int, role string, cardi int) {

}

// Status control

func Shutdown(id int) {

}

func Recover(id int) {

}

// Permissions

func Chown(id int) {

}

func Chwgrp(id int) {

}

func Chwmod(id int) {

}

// TODO: how to pass chmod/chrgrp/chow bits/id-name/id-name
// Perform an action on the SERVICE resource identified by <id>. Available actions: shutdown, recover, chown, chgrp, chmod
func action(class httpclient.Auth, id int, action string) *http.Response {
	url := fmt.Sprintf("%s/%s/%s/%s", class.Oned, endpoint, strconv.Itoa(id), action)

	return httpclient.Delete(url, class.User, class.Pass)
}

// Perform an action on all the Virtual Machines belonging to the ROLE identified by <name> of the SERVICE resource identified by <id>. Available actions: shutdown, shutdown-hard, undeploy, undeploy-hard, hold, release, stop, suspend, resume, boot, delete, delete-recreate, reboot, reboot-hard, poweroff, poweroff-hard, snapshot-create
func vmaction(id int, role string, action string) {

}

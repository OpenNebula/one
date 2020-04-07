package service

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/OpenNebula/one/src/oca/go/src/flow/httpclient"
)

var endpoint string

func init() {
	endpoint = "service"
}

// List the contents of the SERVICE collection.
func List(client httpclient.Client) *http.Response {
	url := fmt.Sprintf("%s/%s", client.Address, endpoint)

	return httpclient.Get(client, url)
}

// Show the SERVICE resource identified by <id>
func Show(client httpclient.Client, id int) *http.Response {
	url := fmt.Sprintf("%s/%s/%s", client.Address, endpoint, strconv.Itoa(id))

	return httpclient.Get(client, url)
}

// Delete the SERVICE resource identified by <id>
func Delete(client httpclient.Client, id int) *http.Response {
	url := fmt.Sprintf("%s/%s/%s", client.Address, endpoint, strconv.Itoa(id))

	return httpclient.Delete(client, url)
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
func action(client httpclient.Client, id int, action string) *http.Response {
	url := fmt.Sprintf("%s/%s/%s/%s", client.Address, endpoint, strconv.Itoa(id), action)

	return httpclient.Delete(client, url)
}

// Perform an action on all the Virtual Machines belonging to the ROLE identified by <name> of the SERVICE resource identified by <id>. Available actions: shutdown, shutdown-hard, undeploy, undeploy-hard, hold, release, stop, suspend, resume, boot, delete, delete-recreate, reboot, reboot-hard, poweroff, poweroff-hard, snapshot-create
func vmaction(id int, role string, action string) {

}

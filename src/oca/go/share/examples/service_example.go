package main

import (
	"fmt"
	"log"

	"github.com/OpenNebula/one/src/oca/go/src/goca"
)

var rclient *goca.RESTClient
var controller *goca.Controller

func init() {
	rclient = goca.NewRESTClient(
		goca.NewFlowConfig("", "", ""),
	)
	xclient := goca.NewDefaultClient(
		goca.NewConfig("", "", ""),
	)

	controller = goca.NewController(xclient, rclient)
}

func main() {
	testClient()
	testGoca()
}

// Shows oneflow server up and running
func testClient() {
	response, e := rclient.Get("service")

	if e == nil {
		body := response.BodyMap()

		fmt.Println(body)

	} else {
		fmt.Println(e)
	}
}

func testGoca() {
	id := 4

	serviceCtrl := controller.Service(id)
	serv, e := serviceCtrl.Show(id)

	if e != nil {
		log.Fatalln(e)
	}

	fmt.Println(serv.ID)
	fmt.Println(serv.Name)

	fmt.Println("============")

	var status bool
	var body string

	status, body = serviceCtrl.Shutdown(id)

	fmt.Println(status)
	fmt.Println(body)

	fmt.Println("============")

	status, body = serviceCtrl.Delete(id)
	fmt.Println(status)
	fmt.Println(body)

	fmt.Println("============")
}

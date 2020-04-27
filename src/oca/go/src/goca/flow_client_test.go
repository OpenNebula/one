package goca

import (
	"fmt"
)

var client *FlowClient

func init() {
	config := NewFlowConfig("oneadmin", "opennebula", "http://10.10.0.56:2474")
	client = NewFlowClient(config)
}

func TestClient() {
	response, e := client.Get("service")

	if e == nil {
		body := response.BodyMap()

		// fmt.Println(body)
		fmt.Println(body)

	} else {
		fmt.Println(e)
	}
}

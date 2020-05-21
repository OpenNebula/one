package goca

import (
	"testing"
)

func TestFlowClient(t *testing.T) {
	client := createRESTClient()

	response, e := client.HTTPMethod("GET", "service")

	if e != nil {
		t.Fatal(e)
	}

	if response.status == false {
		t.Error(response.Body())
	}
}

func createRESTClient() *RESTClient {
	config := NewFlowConfig("", "", "")
	return NewRESTClient(config)
}

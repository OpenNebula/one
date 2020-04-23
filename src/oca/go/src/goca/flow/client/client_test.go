package client

import (
	"fmt"
)

var client Client

func init() {
	client = New("oneadmin", "opennebula", "http://10.10.0.56:2474")
}

func TestClient() {
	response := Get(client, "service")
	body := Btostr(response)

	fmt.Println(body)

}

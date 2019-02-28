package main

import (
	"fmt"
	"log"

	"github.com/OpenNebula/one/src/oca/go/src/goca"
)

// This example shows one way to retrieve the raft status for each server of the HA
// at end it displays the name of the leader.
func main() {
	conf := goca.NewConfig("", "", "")

	zoneName := "zone_name"

	// Store the endpoint of each front server of the HA
	clients := make([]*goca.Client, 0)

	// Create first client to bootstrap
	client := goca.NewClient(conf)
	controller := goca.NewController(client)

	// Retrieve the id of the zone
	id, err := controller.ZoneByName(zoneName)
	if err != nil {
		log.Fatal(err)
	}

	// Retrieve zone informations
	zone, err := controller.Zone(id).Info()
	if err != nil {
		log.Fatal(err)
	}

	// For each server of the zone
	for _, server := range zone.ServerPool {

		// Initialize a client per endpoint
		conf.Endpoint = server.Endpoint
		client = goca.NewClient(conf)
		clients = append(clients, client)

		// Pass it to the controller
		controller.Client = client

		// Fetch the raft status of the server behind the endpoint
		status, err := controller.Zones().ServerRaftStatus()
		if err != nil {
			log.Fatal(err)
		}

		state := goca.ZoneServerRaftState(status.StateRaw)
		fmt.Printf("server: %s, state: %s\n", server.Name, state.String())
	}
}

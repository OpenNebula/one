/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/*--------------------------------------------------------------------------- */

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

	zoneName := "zname"

	// Create first client on the floating ip to
	// retrieve the global zone informations
	client := goca.NewDefaultClient(conf)
	controller := goca.NewController(client)

	// Retrieve the id of the zone
	id, err := controller.Zones().ByName(zoneName)
	if err != nil {
		log.Fatalf("Zone name %s: %s", zoneName, err)
	}

	// Retrieve zone informations
	zone, err := controller.Zone(id).Info(false)
	if err != nil {
		log.Fatalf("Zone id %d: %s", id, err)
	}

	// Each server of the zone has it's own endpoint,
	// we create a new client for each.
	for _, server := range zone.ServerPool {

		// Create a client
		conf.Endpoint = server.Endpoint
		client = goca.NewDefaultClient(conf)

		// Pass it to the controller
		controller.Client = client

		// Fetch the raft status of the server behind the endpoint
		status, err := controller.Zones().ServerRaftStatus()
		if err != nil {
			log.Fatalf("Server raft status endpoint %s: %s", server.Endpoint, err)
		}

		// Display the Raft state of the server: Leader, Follower, Candidate, Error
		state, err := status.State()
		if err != nil {
			log.Fatalf("Server raft state %d: %s", status.StateRaw, err)
		}
		fmt.Printf("server: %s, state: %s\n", server.Name, state.String())
	}
}

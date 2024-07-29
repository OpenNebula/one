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

    "github.com/OpenNebula/one/src/oca/go/src/goca"
    srv_tmpl "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/service_template"
)

func main() {
    // Get a Flow client
    client := goca.NewDefaultFlowClient(
        goca.NewFlowConfig("", "", ""),
    )

    // Get a Flow controller
    controller := goca.NewControllerFlow(client)

	// Create a basic Service Template
    tmpl := srv_tmpl.ServiceTemplate{
                Template: srv_tmpl.Template {
                    Body: srv_tmpl.Body {
                        Name: "NewTemplate",
                        Deployment: "straight",
                        Roles: []srv_tmpl.Role {
                            {
                                Name: "master",
                                Cardinality: 1,
                                VMTemplate: 0, //VM Template 0 needs to exists
                                MinVMs: 1,
                            },
                        },
                    },
                },
             }

	// Allocates a new serive template from tmpl
    _, err := controller.STemplates().Create(&tmpl)
    if err != nil {
        return
	}

	// Print allocated service template
    fmt.Printf("%+v\n",tmpl)
}

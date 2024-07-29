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

func main() {
    // Get a Flow client
    client := goca.NewDefaultFlowClient(
        goca.NewFlowConfig("", "", ""),
    )

    // Get a Flow controller
    controller := goca.NewControllerFlow(client)

    service_pool, err := controller.Services().Info();
    if err != nil {
        log.Fatal(err)
    }

    for i := 0; i < len(service_pool.Services); i++ {
        service, err := controller.Service(service_pool.Services[i].ID).Info()
        if err != nil {
            log.Fatal(err)
        }

        fmt.Println(service.Name)
    }
}

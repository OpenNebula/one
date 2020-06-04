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

[![Build Status](https://travis-ci.org/OpenNebula/goca.svg?branch=master)](https://travis-ci.org/OpenNebula/goca)
[![Coverage Status](https://coveralls.io/repos/github/OpenNebula/goca/badge.svg?branch=master)](https://coveralls.io/github/OpenNebula/goca?branch=master)

# goca

Go bindings for OpenNebula (incomplete).

## Description

This is the Go API for OpenNebula that is being used in the [Docker Machine OpenNebula Driver](https://github.com/OpenNebula/docker-machine-opennebula).

It does not cover all the OpenNebula resources but if has the necessary foundations so that adding new resources should be a simple task.

Currently only these components have been developed:

* **goca**: Main abstraction for the XML objects and XML-RPC client
* **VM**: Virtual Machine Management
* **Image**: Image Management
* **Template**: Template Management
* **TemplateBuilder**: Template Building (creates an OpenNebula template string)

## Examples

This example demonstrates how get the information of a running VM, print its name, and power it off. It then builds a new OpenNebula template and prints its string representation.

```go
    package main

    import (
        "fmt"
        "github.com/OpenNebula/goca"
        "log"
        "os"
        "strconv"
    )

    func main() {
        id, _ := strconv.Atoi(os.Args[1])

        vm := goca.NewVM(uint(id))

        err := vm.Info()
        if err != nil {
            log.Fatal(err)
        }

        name, _ := vm.XPath("/VM/NAME")
        if err != nil {
            log.Fatal(err)
        }

        fmt.Println(name)

        // Poweroff the VM
        err = vm.PoweroffHard()
        if err != nil {
            log.Fatal(err)
        }

        // Create a new Template
        template := goca.NewTemplateBuilder()

        template.AddValue("cpu", 1)
        template.AddValue("memory", "64")
        vector := template.NewVector("disk")
        vector.AddValue("image_id", "119")
        vector.AddValue("dev_prefix", "vd")
        vector = template.NewVector("nic")
        vector.AddValue("network_id", "3")
        vector.AddValue("model", "virtio")
        template.AddValue("vcpu", "2")

        fmt.Println(template)
    }
```

package main

    import (
        "fmt"
        "github.com/OpenNebula/one/src/oca/go/src/goca"
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
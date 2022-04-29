Metal provisions uses bare-metal instances to allocate resources. The Cloud providers feature the following characteristics:

* Hosts are provisioned as metal instances in the selected provider.
* Supported virtualization technologies: QEMU/KVM and LXC
* The provision includes a public network (Internet reachable IPs)
* It also includes a virtual network template to create private VLANs. You need to instantiate this network template.

The onprem provider uses on premises infrastructure. This provision is useful for automate the datacenter configuration and operation.

More information [about](about) using this provision can be found in the [OpenNebula documentation](https://opennebula.io)

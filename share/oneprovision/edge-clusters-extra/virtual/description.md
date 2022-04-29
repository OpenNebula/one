The virtual provision uses virtual instances (VMs) to build a Provision. This provision is useful for developing and testing or light workloads. It features the following characteristics:

* Hosts are provisioned as VM instances in the selected provider.
* Supported virtualization technologies: QEMU (nested virtualization) and LXC (system containers)
* The provision includes a public network (Internet reachable IPs)
* It also includes a virtual network template to create private VLANs. You need to instantiate this network template.

More information [about](about) using this provision can be found in the [OpenNebula documentation](https://opennebula.io)

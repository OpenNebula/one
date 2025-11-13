output "id" {
    value = [for instance in equinix_metal_device.host : instance.id]
}

output "public_ip" {
    value = [for instance in equinix_metal_device.host : instance.network[0].address]
}

output "id" {
    value = [for instance in scaleway_baremetal_server.host : instance.id]
}

output "public_ip" {
    value = [for instance in scaleway_baremetal_server.host : instance.ipv4[0].address]
}
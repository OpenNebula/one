output "id" {
  	value = [for instance in i3dnet_flexmetal_server.host : instance.uuid]
}

output "public_ip" {
  	value = [for instance in i3dnet_flexmetal_server.host : instance.ip_addresses[0].ip_address]
}

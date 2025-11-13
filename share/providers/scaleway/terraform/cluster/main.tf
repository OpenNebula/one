resource "scaleway_vpc" "scaleway_vpc_device" {
    name             = "provision_vpc_${var.provision_id}"
    enable_routing   = true
    tags             = [for key, value in var.scaleway_tags : "${key}=${value}"]
}

resource "scaleway_vpc_private_network" "scaleway_vpc_private_network_device" {
    name   = "provision_private_network_${var.provision_id}"
    vpc_id = scaleway_vpc.scaleway_vpc_device.id
    ipv4_subnet {
        subnet = var.cidr_block
    }
    tags  = [for key, value in var.scaleway_tags : "${key}=${value}"]
}

resource "scaleway_vpc_public_gateway" "scaleway_vpc_public_gateway_device" {
    name             = "provision_internet_gateway_${var.provision_id}"
    type             = "VPC-GW-S"
    bastion_enabled  = true
    bastion_port     = 61000
    tags             = [for key, value in var.scaleway_tags : "${key}=${value}"]

}

resource "scaleway_vpc_gateway_network" "scaleway_vpc_gateway_network_device" {
    gateway_id         = scaleway_vpc_public_gateway.scaleway_vpc_public_gateway_device.id
    private_network_id = scaleway_vpc_private_network.scaleway_vpc_private_network_device.id
    ipam_config {
        push_default_route = true
    }
}

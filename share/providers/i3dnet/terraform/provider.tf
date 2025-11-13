terraform {
	required_providers {
		i3dnet = {
			source = "registry.terraform.io/i3D-net/i3dnet"
		}
	}
}

variable "i3dnet_api_key" {
    sensitive = true
    type      = string
    description = "API key for i3D.net"
}

variable "region" {
    type = string
    description = "Region for i3D.net"
}

provider "i3dnet" {
  	api_key = var.i3dnet_api_key
}

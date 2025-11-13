terraform {
    required_providers {
        equinix = {
            source = "equinix/equinix"
        }
    }
}

variable "auth_token" {
    type      = string
    sensitive = true
    description = "Equinix Auth Token"
}

variable "project_id" {
    type      = string
    sensitive = true
    description = "Equinix Project ID"
}

variable "region" {
    type = string
    description = "Equinix Region"
}

provider "equinix" {
    auth_token = var.auth_token
}

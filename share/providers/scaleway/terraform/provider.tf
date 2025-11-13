terraform {
    required_providers {
        scaleway = {
            source = "scaleway/scaleway"
        }
    }
    required_version = ">= 0.13"
}

variable "access_key" {
    type      = string
    sensitive = true
    description = "Scaleway access key"
}

variable "secret_key" {
    type      = string
    sensitive = true
    description = "Scaleway secret key"
}

variable "project_id" {
    type      = string
    sensitive = true
    description = "Scaleway project ID"
}

variable "region" {
    type      = string
    description = "Scaleway region"
    default   = "fr-par"
}

variable "zone" {
    type      = string
    description = "Scaleway zone"
    default   = "fr-par-1"
}

provider "scaleway" {
    access_key = var.access_key
    secret_key = var.secret_key
    project_id = var.project_id
    zone       = var.zone
    region     = var.region
}
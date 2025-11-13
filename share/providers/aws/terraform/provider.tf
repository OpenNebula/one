terraform {
    required_providers {
        aws = {
            source  = "hashicorp/aws"
            version = "~> 5.0"
        }
    }
}

variable "access_key" {
    type      = string
    sensitive = true
    description = "AWS Access Key"
}

variable "secret_key" {
    type      = string
    sensitive = true
    description = "AWS Secret Key"
}

variable "region" {
    type = string
    description = "AWS Region"
    default = "eu-central-1"
}

provider "aws" {
    access_key = var.access_key
    secret_key = var.secret_key
    region     = var.region
}

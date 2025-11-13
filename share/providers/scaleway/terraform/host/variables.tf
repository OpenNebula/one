variable "oneform_hosts" {
    description = "Number of instances to create"
    type        = number
}

variable "instance_os_name" {
    description = "Operating system to use for the instance"
    type        = string
}

variable "instance_offer" {
    description = "Scaleway offer to use for the instance"
    type        = string
}

variable "scaleway_tags" {
    description = "Tags for Scaleway resources"
    type        = map(string)
}

variable "provision_id" {
    description = "Provision ID for the host"
}
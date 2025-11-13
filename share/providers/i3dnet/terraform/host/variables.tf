variable "oneform_hosts" {
    description = "Number of instances to create"
    type        = number
}

variable "instance_type" {
    description = "Instance type to use for the instance"
    type        = string
}

variable "instance_os_name" {
    description = "Operating system to use for the instance"
    type        = string
}

variable "i3dnet_region" {
    description = "Region to use for the instance"
    type        = string
}

variable "i3dnet_tags" {
    description = "value of the tags to assign to the instance"
    type        = map(string)
}

variable "provision_id" {
    description = "Provision ID for the host"
}
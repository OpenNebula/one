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

variable "instance_disk_size" {
    description = "Root disk size to use for the instance"
    type        = number
    default     = null
}

variable "vpc_subnet_id" {
    description = "ID of the subnet to deploy the instance"
    type        = string
}

variable "vpc_security_group_id" {
    description = "Set of IDs of the security groups to assign to the instance"
    type        = string
}

variable "provision_id" {
    description = "Provision ID for the host"
}

variable "aws_tags" {
    description = "value of the tags to assign to the instance"
    type        = map(string)
}

variable "cidr_block" {
    description = "CIDR block for the VPC"
    type        = string
    default     = "10.0.0.0/16"
}

variable "oneform_hosts" {
    description = "Number of instances to create"
    type        = number
    default     = 1
}

variable "instance_type" {
    description = "Instance type to use for the instance"
    type        = string
    default     = "c5.metal"
}

variable "instance_os_name" {
    description = "Operating system to use for the instance"
    type        = string
    default     = "ubuntu_2204"
}

variable "instance_disk_size" {
    description = "Root disk size to use for the instance"
    type        = number
    default     = 128
}

variable "oneform_tags" {
    description = "value of the tags to assign to the instance"
    type        = map(string)
    default     = {}
}

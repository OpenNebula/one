variable "oneform_hosts" {
    description = "Number of instances to create"
    type        = number
    default     = 1
}

variable "instance_type" {
    description = "Size of the instance to create"
    type        = string
    default     = "em_a116x_ssd"
}

variable "instance_os_name" {
    description = "Operating system to use for the instance"
    type        = string
    default     = "ubuntu_2204"
}

variable "cidr_block" {
    description = "CIDR block for the VPC"
    type        = string
    default     = "172.18.0.0/24"
}

variable "oneform_tags" {
    description = "value of the tags to assign to the instance"
    type        = map(string)
    default     = {}
}
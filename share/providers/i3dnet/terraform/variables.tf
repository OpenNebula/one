variable "oneform_hosts" {
    description = "Number of instances to create"
    type        = number
    default     = 1
}

variable "instance_type" {
    description = "Instance type to use for the instance"
    type        = string
    default     = "bm7.std.8"
}

variable "instance_os_name" {
    description = "Operating system to use for the instance"
    type        = string
    default     = "ubuntu-2404-lts"
}

variable "oneform_tags" {
    description = "value of the tags to assign to the instance"
    type        = map(string)
    default     = {}
}

variable "oneform_onprem_hosts" {
    description = "Host IPs"
    type = list(string)
    default = []
}

variable "oneform_tags" {
    description = "value of the tags to assign to the instance"
    type        = map(string)
    default     = {}
}

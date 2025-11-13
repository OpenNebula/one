variable "cidr_block" {
    description = "CIDR block for the VPC"
    type = string
}

variable "scaleway_tags" {
    description = "Tags for Scaleway resources"
    type = map(string)
}

variable "provision_id" {
    description = "Provision ID for the host"
}
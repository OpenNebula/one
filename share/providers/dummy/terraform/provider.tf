variable "access_key" {
    type      = string
    sensitive = true
    description = "Dummy Access Key"
}

variable "secret_key" {
    type      = string
    sensitive = true
    description = "Dummy Secret Key"
}

variable "region" {
    type = string
    description = "Dummy Region"
    default = "region-1"
}

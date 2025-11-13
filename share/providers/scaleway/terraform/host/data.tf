data "scaleway_baremetal_os" "ubuntu_2204" {
    name = "Ubuntu"
    version = "22.04 LTS (Jammy Jellyfish)"
}

data "scaleway_baremetal_os" "ubuntu_2404" {
    name = "Ubuntu"
    version = "24.04 LTS (Noble Numbat)"
}

data "scaleway_baremetal_offer" "em_a116x_ssd" {
    name = "EM-A116X-SSD"
}
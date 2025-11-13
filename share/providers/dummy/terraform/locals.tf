resource "random_id" "key_suffix" {
    byte_length = 4
}

locals {
    provision_id = (
        contains(keys(var.oneform_tags), "provision_id") ?
        var.oneform_tags["provision_id"] : random_id.key_suffix.id
    )

    generated_ips = {
        for i in range(1, var.oneform_hosts + 1) :
        "host-${i}" =>"${local.provision_id}.${i}.${i}.${i}"
    }
}
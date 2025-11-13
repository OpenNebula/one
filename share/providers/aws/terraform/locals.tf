resource "random_id" "key_suffix" {
    byte_length = 6
}

locals {
    provision_id = (
        contains(keys(var.oneform_tags), "provision_id") ?
        var.oneform_tags["provision_id"] : random_id.key_suffix.id
    )
}

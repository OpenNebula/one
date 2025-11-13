module "cluster" {
    source        = "./cluster"
    provision_id  = local.provision_id
    cidr_block    = var.cidr_block
    scaleway_tags = var.oneform_tags
}

module "host" {
    source       = "./host"
    provision_id = local.provision_id

    oneform_hosts    = var.oneform_hosts
    instance_os_name = var.instance_os_name
    instance_offer   = var.instance_type
    scaleway_tags    = var.oneform_tags
}

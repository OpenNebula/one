module "host" {
    source       = "./host"
    provision_id = local.provision_id

    i3dnet_region    = var.region
    oneform_hosts    = var.oneform_hosts
    instance_type    = var.instance_type
    instance_os_name = var.instance_os_name
    i3dnet_tags      = var.oneform_tags
}

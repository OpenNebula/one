module "host" {
    source       = "./host"
    provision_id = local.provision_id

    # Equinix info
    equinix_region     = var.region
    equinix_project_id = var.project_id
    equinix_tags       = var.oneform_tags

    # Host info
    oneform_hosts    = var.oneform_hosts
    instance_type    = var.instance_type
    instance_os_name = var.instance_os_name
}

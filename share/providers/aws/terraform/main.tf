module "cluster" {
    source       = "./cluster"
    provision_id = local.provision_id
    cidr_block   = var.cidr_block
}

module "host" {
    source       = "./host"
    provision_id = local.provision_id

    oneform_hosts      = var.oneform_hosts
    instance_type      = var.instance_type
    instance_os_name   = var.instance_os_name
    instance_disk_size = var.instance_disk_size

    aws_tags = var.oneform_tags

    vpc_subnet_id         = module.cluster.vpc_subnet_id
    vpc_security_group_id = module.cluster.vpc_security_group_id
}

output "provisioned_hosts" {
    value = [
        for idx in range(length(module.host.id)) : {
            instance_id  = module.host.id[idx]
            instance_ip  = module.host.public_ip[idx]
        }
    ]
}

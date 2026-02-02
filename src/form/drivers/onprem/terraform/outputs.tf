output "provisioned_hosts" {
    value = [
        for host in null_resource.onprem_host : {
            instance_id = host.triggers.instance_id
            instance_ip = host.triggers.instance_ip
        }
    ]
}

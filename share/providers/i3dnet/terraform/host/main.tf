resource "i3dnet_flexmetal_server" "host" {
    count         = var.oneform_hosts
    name          = "provision_${var.provision_id}_host_${count.index}"
    location      = var.i3dnet_region
    instance_type = var.instance_type
    os = {
        slug = var.instance_os_name
    }
    ssh_key = [file("~/.ssh/id_rsa.pub")]
}

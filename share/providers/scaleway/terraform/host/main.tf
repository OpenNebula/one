resource "scaleway_iam_ssh_key" "oneadmin_pubkey" {
    name       = "provision_key_${var.provision_id}"
    public_key = file(pathexpand("~/.ssh/id_rsa.pub"))
}

data "scaleway_baremetal_os" "scw_baremetal_os" {
    name    = lookup(local.registred_instance_os_name, var.instance_os_name).name
    version = lookup(local.registred_instance_os_name, var.instance_os_name).version
}

data "scaleway_baremetal_offer" "scw_offer" {
    name = lookup(local.instance_offer, var.instance_offer).name
}

resource "scaleway_baremetal_server" "host" {
    count = var.oneform_hosts
    name  = "provision_${var.provision_id}_host_${count.index}"
    offer = data.scaleway_baremetal_offer.scw_offer.offer_id
    os    = data.scaleway_baremetal_os.scw_baremetal_os.os_id

    ssh_key_ids = [
        scaleway_iam_ssh_key.oneadmin_pubkey.id
    ]

    tags = [for key, value in var.scaleway_tags : "${key}=${value}"]
}
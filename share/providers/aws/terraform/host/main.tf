resource "aws_key_pair" "oneadmin_pubkey" {
    key_name   = "provision_key_${var.provision_id}"
    public_key = file(pathexpand("~/.ssh/id_rsa.pub"))
}

resource "aws_instance" "host" {
    ami           = lookup(local.registred_instance_os_name, var.instance_os_name)
    instance_type = var.instance_type
    count         = var.oneform_hosts

    vpc_security_group_ids = [var.vpc_security_group_id]
    subnet_id              = var.vpc_subnet_id

    root_block_device {
        volume_size = var.instance_disk_size
    }

    key_name = aws_key_pair.oneadmin_pubkey.key_name

    tags = merge(
        var.aws_tags,
        {
            Name = "provision_${var.provision_id}_host_${count.index}"
        }
    )

    timeouts {
        delete = "30m"
    }
}

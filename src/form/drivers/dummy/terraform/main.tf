resource "null_resource" "dummy_host" {
    for_each = local.generated_ips

    triggers = {
        instance_id = "dummy-${replace(each.value, ".", "-")}"
        instance_ip = each.value
    }

    provisioner "local-exec" {
        command = "sleep 5s"
    }

    provisioner "local-exec" {
        when    = destroy
        command = "sleep 5s"
    }
}

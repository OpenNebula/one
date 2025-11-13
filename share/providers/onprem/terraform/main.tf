resource "null_resource" "onprem_host" {
    for_each = toset(var.oneform_onprem_hosts)

    triggers = {
        instance_id = "onprem-${replace(each.value, ".", "-")}"
        instance_ip = each.value
    }
}

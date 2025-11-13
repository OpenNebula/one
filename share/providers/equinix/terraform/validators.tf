locals {
	# Equinix provider validators
    validators = {
        instance_type = {
            type   = "list"
            values = ["c3.small"]
        }

        oneform_hosts = {
            type   = "number"
            values = {
                min = 1
                max = 10
            }
        }

        instance_os_name = {
            type   = "list"
            values = ["ubuntu_22_04", "ubuntu_24_04"]
        }

        region = {
            type   = "list"
            values = ["am", "ty", "sv", "ny"]
        }
    }
}

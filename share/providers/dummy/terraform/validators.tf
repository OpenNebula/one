locals {
    # Dummy provider validators
    validators = {
        instance_type = {
            type   = "list"
            values = ["dummy.metal", "dummy.virtual"]
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
            values = ["ubuntu_2204", "ubuntu_2404"]
        }

        region = {
            type   = "list"
            values = ["region-1", "region-2"]
        }

        zone = {
            type       = "map"
            grouped_by = "region"
            values = {
                region-1 = ["zone-1", "zone-2", "zone-3"]
                region-2 = ["zone-4", "zone-5", "zone-6"]
            }
        }
    }
}

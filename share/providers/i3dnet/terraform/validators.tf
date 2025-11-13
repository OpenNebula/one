locals {
	# I3D provider validators
    validators = {
        instance_type = {
            type   = "list"
            values = ["bm7.std.8"]
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
            values = ["ubuntu-2404-lts"]
        }

        region = {
            type   = "list"
            values = ["EU: Rotterdam"]
        }
    }
}

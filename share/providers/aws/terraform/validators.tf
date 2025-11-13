locals {
	# AWS provider validators
    validators = {
        instance_type = {
            type   = "list"
            values = ["c5.metal", "m5.metal"]
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

        instance_disk_size = {
            type   = "number"
            values = {
                min = 32
                max = 1024
            }
        }

        region = {
            type   = "list"
            values = ["eu-central-1", "eu-west-1", "us-east-1", "us-west-1"]
        }
    }
}

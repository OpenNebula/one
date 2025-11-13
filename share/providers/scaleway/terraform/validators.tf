locals {
	# Scaleway provider validators
    validators = {
        instance_type = {
            type   = "list"
            values = ["em_a116x_ssd"]
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
            values = ["fr-par", "nl-ams", "pl-waw"]
        }

        zone = {
            type       = "map"
            grouped_by = "region"
            values = {
                fr-par = ["fr-par-1", "fr-par-2", "fr-par-3"]
                nl-ams = ["nl-ams-1", "nl-ams-2", "nl-ams-3"]
                pl-waw = ["pl-waw-1", "pl-waw-2", "pl-waw-3"]
            }
        }
    }
}

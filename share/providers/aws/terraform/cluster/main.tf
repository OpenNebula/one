resource "aws_vpc" "aws_vpc_device" {
    cidr_block = var.cidr_block

    tags = merge(
        var.aws_tags,
        {
            Name = "provision_vpc_${var.provision_id}"
        }
    )
}

resource "aws_subnet" "aws_subnet_device" {
    vpc_id     = aws_vpc.aws_vpc_device.id
    cidr_block = var.cidr_block

    map_public_ip_on_launch = true

    tags = merge(
        var.aws_tags,
        {
            Name = "provision_subnet_${var.provision_id}"
        }
    )

    timeouts {
        delete = "30m"
    }
}

resource "aws_internet_gateway" "aws_internet_gateway_device" {
    vpc_id = aws_vpc.aws_vpc_device.id

    tags = merge(
        var.aws_tags,
        {
            Name = "provision_internet_gateway_${var.provision_id}"
        }
    )

    timeouts {
        delete = "30m"
    }
}

resource "aws_route" "aws_route_device" {
    route_table_id         = aws_vpc.aws_vpc_device.main_route_table_id
    destination_cidr_block = "0.0.0.0/0"
    gateway_id             = aws_internet_gateway.aws_internet_gateway_device.id

    timeouts {
        delete = "30m"
    }
}

resource "aws_security_group" "aws_security_group_device_all" {
    name        = "allow_all"
    description = "Allow all traffic"
    vpc_id      = aws_vpc.aws_vpc_device.id

    tags = merge(
        var.aws_tags,
        {
            Name = "provision_security_group_${var.provision_id}"
        }
    )

	ingress {
		from_port   = 0
		to_port     = 0
		protocol    = "-1"
		cidr_blocks = ["0.0.0.0/0"]
	}

	egress {
		from_port   = 0
		to_port     = 0
		protocol    = "-1"
		cidr_blocks = ["0.0.0.0/0"]
	}
}
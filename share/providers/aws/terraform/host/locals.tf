locals {
	registred_instance_os_name = {
		"ubuntu_2204" = data.aws_ami.ubuntu_2204.id
		"ubuntu_2004" = data.aws_ami.ubuntu_2004.id
	}
}

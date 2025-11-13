output "vpc_device_id" {
    value = aws_vpc.aws_vpc_device.id
}

output "vpc_subnet_id" {
    value = aws_subnet.aws_subnet_device.id
}

output "vpc_security_group_id" {
    value = aws_security_group.aws_security_group_device_all.id
}
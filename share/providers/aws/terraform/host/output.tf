output "id" {
    value = [for instance in aws_instance.host : instance.id]
}

output "public_ip" {
    value = [for instance in aws_instance.host : instance.public_ip]
}

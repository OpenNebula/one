#!/bin/bash

# Create oneadmin user
useradd -m oneadmin
usermod -aG sudo oneadmin
echo "oneadmin ALL=(ALL) NOPASSWD: /usr/bin/qemu-nbd" >> /etc/sudoers
setenforce 0

# Update system and install dependencies
dnf config-manager --set-enabled crb
dnf update -y
dnf install -y gcc make ruby-devel libyaml-devel ruby qemu-img curl dnf-utils httpd

# Install Passenger and its dependencies
curl --fail -sSLo /etc/yum.repos.d/passenger.repo https://oss-binaries.phusionpassenger.com/yum/definitions/el-passenger.repo
dnf install -y passenger mod_passenger mod_ssl || { dnf config-manager --enable cr && dnf install -y passenger mod_passenger mod_ssl; }
systemctl restart httpd
systemctl stop httpd

# Install gem dependencies
cat << "EOT" > /etc/yum.repos.d/opennebula.repo
[opennebula]
name=OpenNebula Community Edition
baseurl=https://downloads.opennebula.io/repo/6.10/AlmaLinux/$releasever/$basearch
enabled=1
gpgkey=https://downloads.opennebula.io/repo/repo2.key
gpgcheck=1
repo_gpgcheck=1
EOT
yum makecache -y
dnf install -y opennebula-rubygems opennebula-common opennebula-libs

# Generate certificate
mkdir -p /etc/one/ovirtapi
openssl req -newkey rsa:2048 -nodes -keyout /etc/one/ovirtapi/ovirtapi-ssl.key -x509 -days 365 -out /etc/one/ovirtapi/ovirtapi-ssl.crt -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=example.com"

# Enable NBD
modprobe nbd
mkdir -p /etc/modules-load.d
echo "nbd" > /etc/modules-load.d/nbd.conf
chown oneadmin:oneadmin /dev/nbd*

# Install the service
bash ./install.sh

systemctl start ovirtapi-server

echo "Operation completed successfully."

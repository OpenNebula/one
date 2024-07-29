#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

if [ -z "${ONE_LOCATION}" ]; then
    LIB_LOCATION=/usr/lib/one
    VAR_LOCATION=/var/lib/one
else
    LIB_LOCATION=$ONE_LOCATION/lib
    VAR_LOCATION=$ONE_LOCATION/var
fi

. $LIB_LOCATION/sh/scripts_common.sh

#-------------------------------------------------------------------------------
# Downloader configuration attributes
#-------------------------------------------------------------------------------
DRIVER_PATH=$(dirname $0)
MARKET_URL=$1

# URL with the context releases
CONTEXT_API="https://api.github.com/repos/OpenNebula/one-apps/releases"
CONTEXT_URL="https://github.com/OpenNebula/one-apps/releases/download"

PKG_RPM="util-linux bash curl bind-utils cloud-utils-growpart parted ruby rubygem-json sudo shadow-utils openssh-server qemu-guest-agent gawk virt-what"
PKG_el7=$PKG_RPM
PKG_el8="${PKG_RPM} network-scripts"
PKG_el9=$PKG_RPM
PKG_FEDORA=$PKG_el8
PKG_ORACLE="oracle-epel-release-el" #suffix
PKG_DEB="util-linux bash curl bind9-host cloud-utils parted ruby sudo passwd dbus openssh-server open-vm-tools qemu-guest-agent gawk virt-what" # ifupdown|ifupdown2 acpid|systemd
PKG_APK="util-linux bash curl udev sfdisk parted e2fsprogs-extra sudo shadow ruby ruby-json bind-tools openssh open-vm-tools qemu-guest-agent gawk virt-what"
PKG_SUSE="util-linux bash curl bind-utils growpart parted parted ruby sudo shadow openssh open-vm-tools qemu-guest-agent gawk virt-what"
PKG_ALT="bind-utils btrfs-progs cloud-utils-growpart curl e2fsprogs iproute2 openssl parted passwd qemu-guest-agent open-vm-tools ruby-json-pure sudo systemd-services wget which xfsprogs gawk virt-what"


#Default DNS server to download the packages
DNS_SERVER="8.8.8.8"

#Directory used to download packages
TMP_DIR=/var/tmp

#Curl command and options used to download container image
CURL="curl -L"

#-------------------------------------------------------------------------------
# This function returns the associated context packages version to the installed
# OpenNebula version
#-------------------------------------------------------------------------------
function get_tag_name {
    local version=`oned -v | grep -E "OpenNebula [0-9]+.[0-9]+.[0-9]+" | cut -d " " -f 2 | tr -d .`

    if [ `echo $version | wc -c` -eq 4 ]; then
        version=$(($version * 10))
    fi

    local creleases=`curl -sSL $CONTEXT_API | grep "\"tag_name\":" | \
         awk '{print $2}' | cut -d 'v' -f 2 | cut -d '"' -f 1`

    for tag in `echo $creleases`; do
        local cversion=`echo $tag | tr -d .`

        if [ `echo $cversion | wc -c` -eq 4 ]; then
            cversion=$(($cversion * 10))
        fi

        if [ $cversion -le $version ]; then
            echo "$tag"
            break
        fi
    done
}

#-------------------------------------------------------------------------------
# Main container build script
#-------------------------------------------------------------------------------

# Container Image & Context Package Data. First argument is a URL from the
# market place like:
# lxd://https://images.linuxcontainers.org/images/ubuntu/xenial/amd64/default/\
#    ./20181214_07:42/rootfs.tar.xz?size=5120&filesystem=ext4&format=raw
#
# rootfs: https://images.linuxcontainers.org/.../rootfs.tar.xz
# arguments: URL args size=5120&filesystem=ext4&format=raw
# distro:  ubuntu
# version: xenial
# release_date: 20181214_07:42
# output:       /var/tmp/8be34ae7-260e-4677-ba38-bbe756a2912d.tar.xz
# output_raw:   /var/tmp/8be34ae7-260e-4677-ba38-bbe756a2912d.raw
#-------------------------------------------------------------------------------
id=`uuidgen`

url=`echo $MARKET_URL | grep -oP "^"lxd://"\K.*"`
rootfs_url=`echo $url | cut -d '?' -f 1`
arguments=`echo $url | cut -d '?' -f 2`

selected_tag=`get_tag_name`

#Create a shell variable for every argument (size=5219, format=raw...)
for p in ${arguments//&/ }; do
    kvp=( ${p/=/ } );
    k=${kvp[0]};v=${kvp[1]};
    [ -n "$k" -a -n "$v" ] && eval $k=$v;
done

second_extension=`echo $rootfs_url | rev | cut -d "." -f 2 | rev`
if [ "$second_extension" == "tar" ]; then
    extension=`echo $rootfs_url | rev | cut -d "." -f 1,2 | rev`
else
    extension=`echo $rootfs_url | rev | cut -d "." -f 1 | rev`
    if [ ${#extension} -ge 4 ]; then exit 1
    fi
fi

distro=`echo $rootfs_url | cut -d '/' -f 5`
version=`echo $rootfs_url | cut -d '/' -f 6`
release_date=`echo $rootfs_url | cut -d '/' -f 9`

output="$TMP_DIR/$id.$extension"
output_raw="$TMP_DIR/$id.raw"
output_qcow="$TMP_DIR/$id.qcow2"

#Download the Linux Container Appliance and create a filesystem to dump its
#contents
#-------------------------------------------------------------------------------
$CURL $rootfs_url --output $output --silent

qemu-img create -f raw $output_raw ${size}M  > /dev/null 2>&1

case $filesystem in
    "ext4")
        mkfs.ext4 -F $output_raw > /dev/null 2>&1
        ;;
    "xfs")
        mkfs.xfs -f $output_raw > /dev/null 2>&1
        ;;
    *)
        mkfs.ext4 -F $output_raw > /dev/null 2>&1
        ;;
esac

mkdir $TMP_DIR/$id

# Generate contextualization procedure per supported platform.
# The Goal is to install the required context package for each distro
#--------------------------------------------------------------------
# Overview:
# 1- Setup name resolution
# 2- Setup randomness
# 3- Download and install context package
#--------------------------------------------------------------------
terminal="/bin/sh"

case "$rootfs_url" in
*opensuse*)
    commands=$(cat <<EOC
[ -h /etc/resolv.conf ] && rm /etc/resolv.conf
echo "nameserver $DNS_SERVER" > /etc/resolv.conf

[ ! -e /dev/tty ] && mknod /dev/tty c 5 0  >> /var/log/chroot.log 2>&1

zypper clean >> /var/log/chroot.log 2>&1
zypper ref >> /var/log/chroot.log 2>&1

zypper install -ny $PKG_SUSE >> /var/log/chroot.log 2>&1

systemctl enable sshd >> /var/log/chroot.log 2>&1

$CURL $CONTEXT_URL/v$selected_tag/one-context-$selected_tag-1.suse.noarch.rpm -Lfo /root/context.rpm >> /var/log/chroot.log 2>&1
zypper install -ny  --allow-unsigned-rpm /root/context.rpm >> /var/log/chroot.log 2>&1
rm /root/context.rpm

rm /dev/tty
EOC
)
    ;;
*alpine*)
    terminal="/bin/ash"
    commands=$(cat <<EOC
echo "nameserver $DNS_SERVER" > /etc/resolv.conf

[ ! -e /dev/random ] && mknod -m 666 /dev/random c 1 8  >> /var/log/chroot.log 2>&1
[ ! -e /dev/urandom ] && mknod -m 666 /dev/urandom c 1 9  >> /var/log/chroot.log 2>&1

apk add $PKG_APK >> /var/log/chroot.log 2>&1

rc-update add sshd >> /var/log/chroot.log 2>&1

$CURL $CONTEXT_URL/v$selected_tag/one-context-$selected_tag-r1.apk -Lfo /root/context.apk >> /var/log/chroot.log 2>&1
apk add --allow-untrusted /root/context.apk >> /var/log/chroot.log 2>&1
rm /root/context.apk

rm /dev/random /dev/urandom
EOC
)
    ;;
*alt*)
    commands=$(cat <<EOC
export PATH=/sbin:/usr/sbin:/bin:/usr/bin

rm -f /etc/resolv.conf >> /var/log/chroot.log 2>&1
echo "nameserver $DNS_SERVER" > /etc/resolv.conf

[ ! -e /dev/random ] && mknod -m 666 /dev/random c 1 8  >> /var/log/chroot.log 2>&1
[ ! -e /dev/urandom ] && mknod -m 666 /dev/urandom c 1 9  >> /var/log/chroot.log 2>&1

apt-get update >> /var/log/chroot.log 2>&1
apt-get install $PKG_ALT -y >> /var/log/chroot.log 2>&1

$CURL $CONTEXT_URL/v$selected_tag/one-context-$selected_tag-alt1.noarch.rpm -Lfo /root/context.rpm >> /var/log/chroot.log 2>&1
apt-get install /root/context.rpm -y >> /var/log/chroot.log 2>&1
rm /root/context.rpm

rm /dev/random /dev/urandom
EOC
)
    ;;
*ubuntu*|*debian*|*devuan*)
    commands=$(cat <<EOC
export PATH=\$PATH:/bin:/sbin

rm -f /etc/resolv.conf >> /var/log/chroot.log 2>&1
echo "nameserver $DNS_SERVER" > /etc/resolv.conf

[ ! -e /dev/random ] && mknod -m 666 /dev/random c 1 8  >> /var/log/chroot.log 2>&1
[ ! -e /dev/urandom ] && mknod -m 666 /dev/urandom c 1 9  >> /var/log/chroot.log 2>&1

apt-get update >> /var/log/chroot.log 2>&1
apt-get install $PKG_DEB -y >> /var/log/chroot.log 2>&1

$CURL $CONTEXT_URL/v$selected_tag/one-context_$selected_tag-1.deb -Lfo /root/context.deb >> /var/log/chroot.log 2>&1
apt-get install -y /root/context.deb >> /var/log/chroot.log 2>&1
rm /root/context.deb

rm /dev/random /dev/urandom
EOC
)
    ;;
*centos/7*)
    commands=$(cat <<EOC
echo "nameserver $DNS_SERVER" > /etc/resolv.conf

[ ! -e /dev/random ] && mknod -m 666 /dev/random c 1 8  >> /var/log/chroot.log 2>&1
[ ! -e /dev/urandom ] && mknod -m 666 /dev/urandom c 1 9  >> /var/log/chroot.log 2>&1

yum install $PKG_el7 -y >> /var/log/chroot.log 2>&1

$CURL $CONTEXT_URL/v$selected_tag/one-context-$selected_tag-1.el7.noarch.rpm -Lfo /root/context.rpm >> /var/log/chroot.log 2>&1
yum install /root/context.rpm -y >> /var/log/chroot.log 2>&1
rm /root/context.rpm

rm /dev/random /dev/urandom
EOC
)
    ;;
*oracle/7*)
    commands=$(cat <<EOC
echo "nameserver $DNS_SERVER" > /etc/resolv.conf

[ ! -e /dev/random ] && mknod -m 666 /dev/random c 1 8  >> /var/log/chroot.log 2>&1
[ ! -e /dev/urandom ] && mknod -m 666 /dev/urandom c 1 9  >> /var/log/chroot.log 2>&1

yum install ${PKG_ORACLE}7 -y >> /var/log/chroot.log 2>&1
yum install $PKG_el7 -y >> /var/log/chroot.log 2>&1

$CURL $CONTEXT_URL/v$selected_tag/one-context-$selected_tag-1.el7.noarch.rpm -Lfo /root/context.rpm >> /var/log/chroot.log 2>&1
yum install /root/context.rpm -y >> /var/log/chroot.log 2>&1
rm /root/context.rpm

rm /dev/random /dev/urandom
EOC
)
    ;;
*centos/8*|*almalinux/8*|*rockylinux/8*)
    commands=$(cat <<EOC
echo "nameserver $DNS_SERVER" > /etc/resolv.conf

[ ! -e /dev/random ] && mknod -m 666 /dev/random c 1 8  >> /var/log/chroot.log 2>&1
[ ! -e /dev/urandom ] && mknod -m 666 /dev/urandom c 1 9  >> /var/log/chroot.log 2>&1

yum install $PKG_RPM -y >> /var/log/chroot.log 2>&1

$CURL $CONTEXT_URL/v$selected_tag/one-context-$selected_tag-1.el8.noarch.rpm -Lfo /root/context.rpm >> /var/log/chroot.log 2>&1
yum install /root/context.rpm -y >> /var/log/chroot.log 2>&1
rm /root/context.rpm

rm /dev/random /dev/urandom
EOC
)
    ;;
*oracle/8*)
    commands=$(cat <<EOC
echo "nameserver $DNS_SERVER" > /etc/resolv.conf

[ ! -e /dev/random ] && mknod -m 666 /dev/random c 1 8  >> /var/log/chroot.log 2>&1
[ ! -e /dev/urandom ] && mknod -m 666 /dev/urandom c 1 9  >> /var/log/chroot.log 2>&1

yum install ${PKG_ORACLE}8 -y >> /var/log/chroot.log 2>&1
yum install $PKG_el8 -y >> /var/log/chroot.log 2>&1
dnf makecache >> /var/log/chroot.log 2>&1

$CURL $CONTEXT_URL/v$selected_tag/one-context-$selected_tag-1.el8.noarch.rpm -Lfo /root/context.rpm >> /var/log/chroot.log 2>&1
yum install /root/context.rpm -y >> /var/log/chroot.log 2>&1
rm /root/context.rpm

rm /dev/random /dev/urandom
EOC
)
    ;;
*fedora*)
    commands=$(cat <<EOC
[ -h /etc/resolv.conf ] && rm /etc/resolv.conf
echo "nameserver $DNS_SERVER" > /etc/resolv.conf

[ ! -e /dev/random ] && mknod -m 666 /dev/random c 1 8  >> /var/log/chroot.log 2>&1
[ ! -e /dev/urandom ] && mknod -m 666 /dev/urandom c 1 9  >> /var/log/chroot.log 2>&1

yum install $PKG_FEDORA -y >> /var/log/chroot.log 2>&1

$CURL $CONTEXT_URL/v$selected_tag/one-context-$selected_tag-1.el8.noarch.rpm -Lfo /root/context.rpm >> /var/log/chroot.log 2>&1
yum install /root/context.rpm -y >> /var/log/chroot.log 2>&1
rm /root/context.rpm

rm /dev/random /dev/urandom
EOC
)
    ;;
*almalinux/9*|*rockylinux/9*|*amazonlinux*)
    commands=$(cat <<EOC
[ -h /etc/resolv.conf ] && rm /etc/resolv.conf
echo "nameserver $DNS_SERVER" > /etc/resolv.conf

[ ! -e /dev/random ] && mknod -m 666 /dev/random c 1 8  >> /var/log/chroot.log 2>&1
[ ! -e /dev/urandom ] && mknod -m 666 /dev/urandom c 1 9  >> /var/log/chroot.log 2>&1

yum install $PKG_el9 -y >> /var/log/chroot.log 2>&1

$CURL $CONTEXT_URL/v$selected_tag/one-context-$selected_tag-1.el9.noarch.rpm -Lfo /root/context.rpm >> /var/log/chroot.log 2>&1
yum install /root/context.rpm -y >> /var/log/chroot.log 2>&1
rm /root/context.rpm

rm /dev/random /dev/urandom
EOC
)
    ;;
*oracle/9*)
    commands=$(cat <<EOC
echo "nameserver $DNS_SERVER" > /etc/resolv.conf

[ ! -e /dev/random ] && mknod -m 666 /dev/random c 1 8  >> /var/log/chroot.log 2>&1
[ ! -e /dev/urandom ] && mknod -m 666 /dev/urandom c 1 9  >> /var/log/chroot.log 2>&1

yum install ${PKG_ORACLE}9 -y >> /var/log/chroot.log 2>&1
yum install $PKG_el9 -y >> /var/log/chroot.log 2>&1
dnf makecache >> /var/log/chroot.log 2>&1

$CURL $CONTEXT_URL/v$selected_tag/one-context-$selected_tag-1.el9.noarch.rpm -Lfo /root/context.rpm >> /var/log/chroot.log 2>&1
yum install /root/context.rpm -y >> /var/log/chroot.log 2>&1
rm /root/context.rpm

rm /dev/random /dev/urandom
EOC
)
    ;;
*)

    commands=$(cat <<EOC
echo "$distro-$version is not supported by OpenNebula context" > /root/opennebula_context.log
EOC
)
    ;;
esac

# Create raw image with container and context
#-------------------------------------------------------------------------------
MK_CONTAINER=$LIB_LOCATION/sh/create_container_image.sh

cat << EOF | sudo -n $MK_CONTAINER $TMP_DIR $id $extension $terminal
$commands
EOF


if [ "$format" == "qcow2" ]; then
    qemu-img convert -f raw -O qcow2 $output_raw $output_qcow > /dev/null 2>&1
    cat $output_qcow
else
    cat $output_raw
fi

# Clean up files & dirs
#-------------------------------------------------------------------------------
[ -f $output ] && rm -f $output > /dev/null 2>&1
[ -n "$id" -a -d $TMP_DIR/$id ] && rm -rf $TMP_DIR/$id > /dev/null 2>&1
[ -f $output_raw ] && rm -f $output_raw > /dev/null 2>&1
[ -f $output_qcow ] && rm -f $output_qcow > /dev/null 2>&1

exit 0

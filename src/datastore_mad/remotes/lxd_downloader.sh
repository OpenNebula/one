#!/bin/bash

tmp_dir=/var/tmp
common_dir=/var/tmp/common
id=`uuidgen`
url=$1
rootfs_url=`echo $url | grep -oP "^"lxd://"\K.*"`
if [[ $rootfs_url == *"turnkeylinux.org"* ]]; then
    untar_options="xvzpf"
    extension="tar.gz"
    distro=`echo $rootfs_url | cut -d '-' -f 1 | cut -d '/' -f 7`
    version_number=`echo $rootfs_url | cut -d '-' -f 2`
    if [[ $version_number == "9" ]]; then
        version="Stretch"
    elif [[ $version_number == "8" ]]; then
        version="Jessie"
    else
        version="undefined"
    fi
    release_date=""
elif [[ $rootfs_url == *"linuxcontainers.org"* ]]; then
    untar_options="xvJpf"
    extension="tar.xz"
    distro=`echo $rootfs_url | cut -d '/' -f 5`
    version=`echo $rootfs_url | cut -d '/' -f 6`
    release_date=`echo $rootfs_url | cut -d '/' -f 9`
fi

output=$tmp_dir/$id.$extension

curl $rootfs_url --output $output --silent
qemu-img create -f raw $tmp_dir/$id.raw 5G  > /dev/null 2>&1
mkfs.ext4 -F $tmp_dir/$id.raw > /dev/null 2>&1
mkdir $tmp_dir/$id
sudo mount $tmp_dir/$id.raw $tmp_dir/$id
sudo chown oneadmin:oneadmin $tmp_dir/$id
##sudo mkdir $tmp_dir/$id/rootfs
#mkdir $tmp_dir/$id/rootfs
##sudo chown oneadmin:oneadmin $tmp_dir/$id/rootfs
#echo "sudo tar $untar_options $output -C $tmp_dir/$id" >> /tmp/log
sudo tar $untar_options $output -C $tmp_dir/$id > /dev/null 2>&1
sync

#cp $common_dir/metadata.yaml $tmp_dir/$id/metadata.yaml
#cp -r $common_dir/templates $tmp_dir/$id/templates

#sed -i -e "s/description_goes_here/$distro $version ($date)/g" $tmp_dir/$id/metadata.yaml
#sed -i -e "s/distro_goes_here/$distro/g" $tmp_dir/$id/metadata.yaml
#sed -i -e "s/version_goes_here/$version/g" $tmp_dir/$id/metadata.yaml

case "$rootfs_url" in
*ubuntu*|*debian*)
    terminal="/bin/bash"
    read -r -d '' commands << EOT
        export PATH=$PATH:/bin:/sbin
        rm -f /etc/resolv.conf > /dev/null 2>&1
        echo "nameserver 8.8.8.8" > /etc/resolv.conf
        apt-get update > /dev/null
        apt-get install curl -y > /dev/null 2>&1
        curl https://github.com/OpenNebula/addon-context-linux/releases/download/v5.6.0/one-context_5.6.0-1.deb -Lsfo /root/context.deb
        apt-get install /root/context.deb -y > /dev/null 2>&1
EOT
    ;;
*centos/6*)
    terminal="/bin/bash"
    read -r -d '' commands << EOT
        export PATH=$PATH:/bin:/sbin
        echo "nameserver 8.8.8.8" > /etc/resolv.conf
        curl https://github.com/OpenNebula/addon-context-linux/releases/download/v5.6.0/one-context-5.6.0-1.el6.noarch.rpm -Lsfo /root/context.rpm
        yum install /root/context.rpm -y > /dev/null 2>&1
EOT
    ;;
*centos/7*)
    terminal="/bin/bash"
    read -r -d '' commands << EOT
        echo "nameserver 8.8.8.8" > /etc/resolv.conf
        curl https://github.com/OpenNebula/addon-context-linux/releases/download/v5.6.0/one-context-5.6.0-1.el7.noarch.rpm -Lsfo /root/context.rpm
        yum install /root/context.rpm -y > /dev/null 2>&1
EOT
    ;;
*alpine*)
    terminal="/bin/bash"
    read -r -d '' commands << EOT
        echo "nameserver 8.8.8.8" > /etc/resolv.conf
        curl https://github.com/OpenNebula/addon-context-linux/releases/download/v5.6.0/one-context-5.6.0-1.el7.noarch.rpm -Lsfo /root/context.rpm
        yum install /root/context.rpm -y > /dev/null 2>&1
EOT
    ;;
*opensuse*)
    terminal="/bin/ash"
    read -r -d '' commands << EOT
        echo "OpenSuse is not yet supported" > /root/opennebula_context.log
EOT
    ;;
*)
    terminal="/bin/bash"
    read -r -d '' commands << EOT
        echo "This distro is not supported by OpenNebula context" > /root/opennebula_context.log
EOT
    ;;
esac

cat << EOF | sudo chroot $tmp_dir/$id $terminal
$commands
EOF
sync

rm -f $output
sudo umount $tmp_dir/$id

#######Temporal
#qemu-img convert -f raw -O qcow2 $tmp_dir/$id.raw $tmp_dir/$id.qcow2 > /dev/null 2>&1

rmdir $tmp_dir/$id
cat $tmp_dir/$id.raw && rm -f $tmp_dir/$id.raw
#cat $tmp_dir/$id.qcow2 && rm -f $tmp_dir/$id.qcow2

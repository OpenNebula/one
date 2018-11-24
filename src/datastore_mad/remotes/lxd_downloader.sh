#!/bin/bash

get_tag_name () {
    version=`oned -v | grep "is distributed" | awk '{print $2}'`
    version_numbers=`echo $version | tr -d .`
    version_length=`echo $version_numbers | wc -c`
    if [ $version_length -eq "4" ]; then
        version_numbers=$(($version_numbers * 10))
    fi
        
    selected_tag="none"
    for tag in `curl -sSL https://api.github.com/repos/OpenNebula/addon-context-linux/releases | 
grep "\"tag_name\":" | awk '{print $2}' | cut -d 'v' -f 2 | cut -d '"' -f 1`; do
        tag_numbers=`echo $tag | tr -d .`
        tag_length=`echo $tag_numbers | wc -c`
        if [ $tag_length -eq "4" ]; then
            tag_numbers=$(($tag_numbers * 10))
        fi
        if [ $tag_numbers -le $version_numbers ]; then
            selected_tag=$tag
            break
        fi
    done
}

dns_server="8.8.8.8"
tmp_dir=/var/tmp
common_dir=/var/tmp/common
id=`uuidgen`
url=$1
url_and_arguments=`echo $url | grep -oP "^"lxd://"\K.*"`
rootfs_url=`echo $url_and_arguments | cut -d '?' -f 1`
arguments=`echo $url_and_arguments | cut -d '?' -f 2`
get_tag_name
#Create a shell variable for every parameter and# 
#sets it to the correspondig value              #
for p in ${arguments//&/ };do 
    kvp=( ${p/=/ } ); 
    k=${kvp[0]};v=${kvp[1]};
    eval $k=$v;
done

rootfs_url=`echo $url | grep -oP "^"lxd://"\K.*"`
curl="curl -L"
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

$curl $rootfs_url --output $output --silent
qemu-img create -f raw $tmp_dir/$id.raw ${size}M  > /dev/null 2>&1

case $filesystem in
    "ext4")
        mkfs.ext4 -F $tmp_dir/$id.raw > /dev/null 2>&1
        ;;
    "xfs")
        mkfs.xfs -f $tmp_dir/$id.raw > /dev/null 2>&1
        ;;
    *)
        mkfs.ext4 -F $tmp_dir/$id.raw > /dev/null 2>&1
        ;;
esac


mkdir $tmp_dir/$id
sudo mount $tmp_dir/$id.raw $tmp_dir/$id
sudo chown oneadmin:oneadmin $tmp_dir/$id
sudo tar $untar_options $output -C $tmp_dir/$id > /dev/null 2>&1
sync

context_url="https://github.com/OpenNebula/addon-context-linux/releases/download"

case "$rootfs_url" in
*ubuntu*|*debian*)
    terminal="/bin/bash"
    read -r -d '' commands << EOT
        export PATH=$PATH:/bin:/sbin
        rm -f /etc/resolv.conf > /dev/null 2>&1
        echo "nameserver $dns_server" > /etc/resolv.conf
        apt-get update > /dev/null
        apt-get install curl -y > /dev/null 2>&1
        $curl $context_url/v$selected_tag/one-context_$selected_tag-1.deb -Lsfo /root/context.deb
        apt-get install /root/context.deb -y > /dev/null 2>&1
EOT
    ;;
*centos/6*)
    terminal="/bin/bash"
    read -r -d '' commands << EOT
        export PATH=$PATH:/bin:/sbin
        echo "nameserver $dns_server" > /etc/resolv.conf
        $curl $context_url/v$selected_tag/one-context-$selected_tag-1.el6.noarch.rpm -Lsfo /root/context.rpm
        yum install /root/context.rpm -y > /dev/null 2>&1
EOT
    ;;
*centos/7*)
    terminal="/bin/bash"
    read -r -d '' commands << EOT
        echo "nameserver $dns_server" > /etc/resolv.conf
        $curl $context_url/v$selected_tag/one-context-$selected_tag-1.el7.noarch.rpm -Lsfo /root/context.rpm
        yum install /root/context.rpm -y > /dev/null 2>&1
EOT
    ;;
*alpine*)
    terminal="/bin/bash"
    read -r -d '' commands << EOT
        echo "nameserver $dns_server" > /etc/resolv.conf
        $curl $context_url/v$selected_tag/one-context-$selected_tag-r1.apk -Lsfo /root/context.apk
        apk add --allow-untrusted /root/context.apk > /dev/null 2>&1
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
echo "#This file is modified by OpenNebula. Don't write in here" > /etc/resolv.conf
EOF
sync

rm -f $output
sudo umount $tmp_dir/$id
rmdir $tmp_dir/$id

if [ "$format" == "qcow2" ]; then
    qemu-img convert -f raw -O qcow2 $tmp_dir/$id.raw $tmp_dir/$id.qcow2 > /dev/null 2>&1
    cat $tmp_dir/$id.qcow2 && rm -f $tmp_dir/$id.qcow2
else
    cat $tmp_dir/$id.raw 
fi

rm -f $tmp_dir/$id.raw


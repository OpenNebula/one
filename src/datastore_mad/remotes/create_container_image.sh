#!/bin/bash

tmp_dir=$1
id=$2
extension=$3
terminal=$4

commands=$(cat /dev/stdin)

#echo "tmpdir=$tmp_dir"
#echo "\n"
#echo "id=$id"
#echo "\n"
#echo "ext = $extension"
#echo "\n"
#echo "ter = $terminal"
#echo "\n"
#
#echo "commands = $commands"

case $extension in
    "tar.xz")
        untar_options="xvJpf"
        ;;
    "tar.gz")
        untar_options="xvzpf"
        ;;
esac

mount $tmp_dir/$id.raw $tmp_dir/$id
chown oneadmin:oneadmin $tmp_dir/$id
tar $untar_options $tmp_dir/$id.$extension -C $tmp_dir/$id > /dev/null 2>&1

sync

cat << EOF | chroot $tmp_dir/$id $terminal
$commands
echo "#This file is modified by OpenNebula. Don't write in here" > /etc/resolv.conf
rm -f /etc/ssh/ssh_host_* > /dev/null 2>&1
usermod -p '*' root > /dev/null 2>&1
EOF
sync

umount $tmp_dir/$id

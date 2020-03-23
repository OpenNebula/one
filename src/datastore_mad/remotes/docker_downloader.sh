#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
CONTEXT_API="https://api.github.com/repos/OpenNebula/addon-context-linux/releases"
CONTEXT_URL="https://github.com/OpenNebula/addon-context-linux/releases/download"

PKG_APK="curl openssh"
PKG_DEB="curl "
PKG_RPM="openssh-server"
PKG_CENTOS6="epel-release $PKG_RPM"
PKG_FEDORA="network-scripts $PKG_RPM"

#Default DNS server to download the packages
DNS_SERVER="1.1.1.1"

#Directory used to download packages
TMP_DIR=/var/tmp

#Curl command and options used to download container image
CURL="curl -L"

#-------------------------------------------------------------------------------
# This function returns the associated context packages version to the installed
# OpenNebula version
#-------------------------------------------------------------------------------
function get_tag_name {
    local version=`oned -v | grep "is distributed" | awk '{print $2}' | tr -d .`

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
# This function takes care of removing all temporary directories in case
# something fails
#-------------------------------------------------------------------------------
function clean_err {

    docker rm -f $container_id  > /dev/null 2>&1 || true
    docker image rm -f one$sid  > /dev/null 2>&1

    # Unmount mnt directory (if necessary)
    if  grep -qs "$dockerdir/mnt" /proc/mounts; then
        sudo umount "$dockerdir/mnt"
    fi

    rm -rf $dockerdir
}

#-------------------------------------------------------------------------------
# This function takes care of checking if the container FS will fit in the size
# passed as parameter, if not it will used the size of the container FS + 200MB
#-------------------------------------------------------------------------------
function get_size {
    # Get tarbal size
    tar_size=$(stat -c%s $tarball | awk '{ byte =$1 /1024/1024; print byte}' | cut -d '.' -f 1)

    if [ "$tar_size" -ge "$size" ]; then
        size=$(($tar_size + 200))
    fi
}

set -e -o pipefail

#-------------------------------------------------------------------------------
# Parse downloader URL
#-------------------------------------------------------------------------------
#  URL is in the form
#  docker://<conatiner_name>[:tags]?size=&filesystem=&format=&distro=
#
#  consinter_name:tags : As listed in docker hub. e.g. alpine:3.9
#  size: in MB for the resulting image
#  filesystem: filesystem type e.g. ext4
#  format: image format e.g. raw or qcow2
#  distro: base image distro to install contents
#-------------------------------------------------------------------------------
id=`uuidgen`
sid=`echo $id | cut -d '-' -f 1`

url=`echo $MARKET_URL | grep -oP "^"docker://"\K.*"`
docker_hub=`echo $url | cut -d '?' -f 1`
arguments=`echo $url | cut -d '?' -f 2`

selected_tag=`get_tag_name`

#Create a shell variable for every argument (size=5219, format=raw...)
for p in ${arguments//&/ }; do
    kvp=( ${p/=/ } );
    k=${kvp[0]};v=${kvp[1]};
    [ -n "$k" -a -n "$v" ] && eval $k=$v;
done

docker_image=`echo $docker_hub | cut -f1 -d':'``echo $id |cut -f1 -d'-'`

dockerdir=$TMP_DIR/$id
dockerfile=$dockerdir/dockerfile
tarball=$dockerdir/fs.tar
img_raw=$dockerdir/img.raw
img_qcow=$dockerdir/img.qcow

# Trap for cleaning temporary directories
trap clean_err ERR

mkdir -p $dockerdir
mkdir -p $dockerdir/mnt

#-------------------------------------------------------------------------------
# Create a DockerFile
#-------------------------------------------------------------------------------

case "$distro" in
debian|ubuntu)
    contextpkg=$dockerdir/context.deb
    contexturl=$CONTEXT_URL/v$selected_tag/one-context_$selected_tag-1.deb
    commands=$(cat <<EOC
COPY context.deb /root/context.deb
RUN apt-get update
RUN apt-get update && apt-get install -y \
      curl \
      dbus \
      kmod \
      iproute2 \
      iputils-ping \
      net-tools \
      openssh-server \
      sudo \
      systemd \
      udev \
      vim-tiny \
      wget
RUN apt-get install -y /root/context.deb
RUN rm /root/context.deb
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/*
EOC
)
    ;;
redhat)
    terminal="/bin/bash"
    commands=$(cat <<EOC
EOC
)
    ;;
alpine)
    terminal="/bin/ash"
    contextpkg=$dockerdir/context.apk
    contexturl=$CONTEXT_URL/v$selected_tag/one-context-$selected_tag-r1.apk
    commands=$(cat <<EOC
COPY context.apk /root/context.apk
RUN apk add coreutils \
            openrc \
            udev \
            openssh

RUN rc-update add sysfs boot && \
    rc-update add devfs boot && \
    rc-update add procfs boot && \
    rc-update add hostname boot

RUN echo "ttyS0::respawn:/sbin/getty -L ttyS0 115200 vt100" >> /etc/inittab

RUN apk add --allow-untrusted /root/context.apk
RUN rm /root/context.apk
RUN rc-update del one-context boot && \
    rc-update add one-context default

RUN rc-update add sshd default && \
    rc-update add udev default && \
    rc-update add networking default

RUN echo 'rc_sys=""' >> /etc/rc.conf

RUN sed -e '159a dev_context=/dev/vdb' \
        -e '169s/.*/\t\tmount -o ro \/dev\/vdb \${MOUNT_DIR} 2\>\/dev\/null/' \
        -i /usr/sbin/one-contextd
EOC
)
    ;;
*)
    ;;
esac

cat > $dockerfile <<EOC
FROM $docker_hub
$commands
RUN echo "#Generated by OpenNebula" > /etc/resolv.conf
RUN rm -f /etc/ssh/ssh_host_* > /dev/null 2>&1
RUN usermod -p '*' root > /dev/null 2>&1
EOC

$CURL $contexturl -Lsfo $contextpkg  > /dev/null 2>&1

docker build -t one$sid -f $dockerfile $dockerdir > /dev/null 2>&1

image_id=`docker images -q one$sid`

#-------------------------------------------------------------------------------
# Flatten container image
#-------------------------------------------------------------------------------
container_id=$(docker run -d $image_id /bin/true)

docker export -o $tarball $container_id > /dev/null 2>&1

docker rm $container_id  > /dev/null 2>&1
docker image rm one$sid  > /dev/null 2>&1

#-------------------------------------------------------------------------------
# Dump container FS and create image
#-------------------------------------------------------------------------------

# Ensure $size have a good value
get_size

qemu-img create -f raw $img_raw ${size}M  > /dev/null 2>&1

case $filesystem in
    "ext4")
        mkfs.ext4 -F $img_raw > /dev/null 2>&1
        ;;
    "xfs")
        mkfs.xfs -f $img_raw > /dev/null 2>&1
        ;;
    *)
        mkfs.ext4 -F $img_raw > /dev/null 2>&1
        ;;
esac

#-------------------------------------------------------------------------------
# Mount container disk image and untar rootfs contents to it
#-------------------------------------------------------------------------------
sudo mount $img_raw $dockerdir/mnt > /dev/null 2>&1
sudo chmod o+w $dockerdir/mnt
sudo tar xpf $tarball -C $dockerdir/mnt > /dev/null 2>&1

sync

sudo umount $dockerdir/mnt

if [ "$format" == "qcow2" ]; then
    qemu-img convert -f raw -O qcow2 $img_raw $img_qcow > /dev/null 2>&1
    cat $img_qcow
else
    cat $img_raw
fi

#-------------------------------------------------------------------------------
# Clean up files & dirs
#-------------------------------------------------------------------------------
rm -rf $dockerdir

exit 0

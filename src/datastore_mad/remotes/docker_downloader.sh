#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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
    SHARE_LOCATION=/usr/share/one
else
    LIB_LOCATION=$ONE_LOCATION/lib
    VAR_LOCATION=$ONE_LOCATION/var
    SHARE_LOCATION=$ONE_LOCATION/share
fi

. $LIB_LOCATION/sh/scripts_common.sh

#-------------------------------------------------------------------------------
# Downloader configuration attributes
#-------------------------------------------------------------------------------
DRIVER_PATH=$(dirname $0)
MARKET_URL=$1

MK_DOCKER=$LIB_LOCATION/sh/create_docker_image.sh

#Default DNS server to download the packages
DNS_SERVER="1.1.1.1"

#Directory used to download packages
TMP_DIR=/var/tmp

#Context location
CONTEXT_PATH="$SHARE_LOCATION/context"

#-------------------------------------------------------------------------------
# This function takes care of removing all temporary directories in case
# something fails
#-------------------------------------------------------------------------------
function clean {

    docker rm -f $container_id  > /dev/null 2>&1 || true
    docker image rm -f one$sid  > /dev/null 2>&1

    rm -rf $dockerdir
}

set -e -o pipefail

#-------------------------------------------------------------------------------
# Parse downloader URL
#-------------------------------------------------------------------------------
#  URL is in the form
#  docker://<conatiner_name>?size=&filesystem=&format=&distro=&tag=
#
#  consinter_name: As listed in docker hub. e.g. alpine
#  size: in MB for the resulting image
#  filesystem: filesystem type e.g. ext4
#  format: image format e.g. raw or qcow2
#  distro: base image distro to install contents
#  tag: one of the image supported tags
#-------------------------------------------------------------------------------
id=`echo "$RANDOM-$RANDOM-$RANDOM-$RANDOM-$RANDOM"`
sid=`echo $id | cut -d '-' -f 1`

url=`echo $MARKET_URL | grep -oP "^"docker://"\K.*"`
arguments=`echo $url | cut -d '?' -f 2`

#Create a shell variable for every argument (size=5219, format=raw...)
for p in ${arguments//&/ }; do
    kvp=( ${p/=/ } );
    k=${kvp[0]};v=${kvp[1]};
    [ -n "$k" -a -n "$v" ] && eval $k=$v;
done

if [ -z $tag ]; then
    tag="latest"
fi

docker_hub="`echo $url | cut -d '?' -f 1`:${tag}"
docker_image=`echo $docker_hub | cut -f1 -d':'``echo $id |cut -f1 -d'-'`

dockerdir=$TMP_DIR/$id
dockerfile=$dockerdir/dockerfile
tarball=$dockerdir/fs.tar
img_raw=$dockerdir/img.raw
img_qcow=$dockerdir/img.qcow

# Trap for cleaning temporary directories
trap clean EXIT

mkdir -p $dockerdir
mkdir -p $dockerdir/mnt

# Check distro
if [ -z $distro ]; then
distro=`docker run --rm --entrypoint cat \
        -e "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
        $docker_hub /etc/os-release | grep "^ID=.*\n" | cut -d= -f 2 | xargs`
fi

if [ -z $distro ]; then
    echo "Cannot identified $docker_hub distribution" 1>&2
    exit 1
fi

#-------------------------------------------------------------------------------
# Create a DockerFile
#-------------------------------------------------------------------------------

case "$distro" in
debian|ubuntu)
    commands=$(cat <<EOC
RUN [ ! -e /sbin/init ] && ln -s /lib/systemd/systemd /sbin/init
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
      wget \
      haveged
RUN apt-get install -y /root/context/one-context_*.deb
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/*
RUN systemctl enable haveged
EOC
)
    ;;
centos)
    commands=$(cat <<EOC
RUN yum update -y
RUN yum install -y epel-release
RUN yum install -y initscripts \
                   e2fsprogs \
                   haveged
RUN yum localinstall -y \`find /root/context -type f \( ! -iname "*ec2*" -iname "*el7.noarch.rpm" \)\`
RUN systemctl enable haveged
EOC
)
    ;;
alpine)
    commands=$(cat <<EOC
RUN apk add coreutils \
            openrc \
            udev \
            openssh
RUN apk -U add haveged

RUN rc-update add sysfs boot && \
    rc-update add devfs boot && \
    rc-update add procfs boot && \
    rc-update add hostname boot && \
    rc-update add haveged boot

RUN echo "ttyS0::respawn:/sbin/getty -L ttyS0 115200 vt100" >> /etc/inittab
RUN apk add --allow-untrusted /root/context/*.apk
RUN rc-update del one-context boot && \
    rc-update add one-context default

RUN rc-update add sshd default && \
    rc-update add udev default && \
    rc-update add networking default

RUN echo 'rc_sys=""' >> /etc/rc.conf
EOC
)
    ;;
*)
    ;;
esac

cat > $dockerfile <<EOC
FROM $docker_hub
USER root
COPY context /root/context
$commands
RUN rm -rf /root/context
RUN echo "#Generated by OpenNebula" > /etc/resolv.conf
RUN rm -f /etc/ssh/ssh_host_* > /dev/null 2>&1
RUN usermod -p '*' root > /dev/null 2>&1
EOC

cp -rL $CONTEXT_PATH $dockerdir

docker build -t one$sid -f $dockerfile $dockerdir > /dev/null 2>&1

image_id=`docker images -q one$sid`

#-------------------------------------------------------------------------------
# Flatten container image
#-------------------------------------------------------------------------------
container_id=$(docker run -d $image_id /bin/true)

docker export -o $tarball $container_id > /dev/null 2>&1

#-------------------------------------------------------------------------------
# Dump container FS and create image
#-------------------------------------------------------------------------------

# Get tarbal size
tar_size=$(stat -c%s $tarball | awk '{ byte =$1 /1024/1024; print byte}' | cut -d '.' -f 1)

# Ensure $size is enough to fit the fs
if [ "$tar_size" -ge "$size" ]; then
    echo "Not enough space, image size must be at least ${tar_size}Mb" 1>&2
    exit 1
fi

qemu-img create -f raw $img_raw ${size}M  > /dev/null 2>&1

case $filesystem in
    "ext4")
        mkfs.ext4 -F $img_raw > /dev/null 2>&1
        ;;
    "ext3")
        mkfs.ext3 -F $img_raw > /dev/null 2>&1
        ;;
    "ext2")
        mkfs.ext2 -F $img_raw > /dev/null 2>&1
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

sudo -n $MK_DOCKER -d $dockerdir -i $img_raw -t $tarball

if [ "$format" == "qcow2" ]; then
    qemu-img convert -f raw -O qcow2 $img_raw $img_qcow > /dev/null 2>&1
    cat $img_qcow
else
    cat $img_raw
fi

exit 0

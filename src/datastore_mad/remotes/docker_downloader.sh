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

#Dockerfiles templates directory
DOCKERFILES="$SHARE_LOCATION/dockerhub/dockerfiles"
DOCKERFILE="$SHARE_LOCATION/dockerhub"

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
    commands=$(cat "$DOCKERFILES/debian")
    ;;
centos)
    commands=$(cat "$DOCKERFILES/centos")
    ;;
alpine)
    commands=$(cat "$DOCKERFILES/alpine")
    ;;
*)
    ;;
esac

#Replace variables _docker_hub and _commands
dockerfile_template=$(cat "$DOCKERFILE/dockerfile")
dockerfile_template=${dockerfile_template/\%IMAGE_ID\%/$docker_hub}
dockerfile_template=${dockerfile_template/\%COMMANDS\%/$commands}

echo "$dockerfile_template" > "$dockerfile"

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

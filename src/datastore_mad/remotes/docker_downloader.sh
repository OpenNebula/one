#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

if [ -z "$ONE_LOCATION" ]; then
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
DRIVER_PATH=$(dirname "$0")
MARKET_URL=$1

MK_DOCKER="$LIB_LOCATION/sh/create_docker_image.sh"

#Default DNS server to download the packages
DNS_SERVER="1.1.1.1"

#Directory used to download packages
TMP_DIR="/var/tmp"

#Context location
CONTEXT_PATH="$SHARE_LOCATION/context"

#Dockerfiles templates directory
DOCKERFILES="$SHARE_LOCATION/dockerhub/dockerfiles"
DOCKERFILE="$SHARE_LOCATION/dockerhub"

#Docker image name for deletion
image_name=$(echo "$MARKET_URL" | cut -d "/" -f3 | cut -d "?" -f1)

#-------------------------------------------------------------------------------
# This function takes care of removing all temporary directories in case
# something fails
#-------------------------------------------------------------------------------
function clean {
    docker rm -f "$container_id" > /dev/null 2>&1 || true

    if [ -n "${image_name}" ]; then
        docker rmi -f "${image_name}"
    fi

    docker image rm -f one"$sid" > /dev/null 2>&1

    rm -rf "$dockerdir"
}

set -e -o pipefail

id=$(echo "$RANDOM-$RANDOM-$RANDOM-$RANDOM-$RANDOM")
sid=$(echo "$id" | cut -d '-' -f 1)

#-------------------------------------------------------------------------------
# Parse downloader URL
#-------------------------------------------------------------------------------
#  URL is in the form
#  docker://<container_name>?size=&filesystem=&format=&distro=&tag=
#  dockerfile://<path_to_file>?size=&filesystem=&format=&distro=
#  dockerfile://?fileb64=&size=&filesystem=&format=&distro=
#
#  container_name: As listed in docker hub. e.g. alpine
#  size: in MB for the resulting image
#  filesystem: filesystem type e.g. ext4
#  format: image format e.g. raw or qcow2
#  distro: base image distro to install contents
#  tag: one of the image supported tags
#  fileb64: dockerfile in base 64
#  context: yes to generate image with context packages, falso otherwise
#-------------------------------------------------------------------------------

if [[ $MARKET_URL == dockerfile* ]]; then
    url=$(echo "$MARKET_URL" | grep -oP "^"dockerfile://"\K.*")
    export_from="dockerfile"
elif [[ $MARKET_URL == docker* ]]; then
    url=$(echo "$MARKET_URL" | grep -oP "^"docker://"\K.*")
    export_from="dockerhub"
else
    echo "Unknown URL format" 1>&2
    exit 1
fi

arguments=$(echo "$url" | cut -d '?' -f 2)

#Create a shell variable for every argument (size=5219, format=raw...)
for p in ${arguments//&/ }; do
    kvp=( ${p/=/ } );
    k=${kvp[0]};v=${kvp[1]};
    [ -n "$k" -a -n "$v" ] && eval "$k"="$v";
done

if [ -z "$tag" ]; then
    tag="latest"
fi

dockerdir="$TMP_DIR/$id"
dockerfile="$dockerdir/dockerfile"
tarball="$dockerdir/fs.tar"
img_raw="$dockerdir/img.raw"
img_qcow="$dockerdir/img.qcow"

# Trap for cleaning temporary directories
trap clean EXIT && trap clean ERR

mkdir -p "$dockerdir"
mkdir -p "$dockerdir/mnt"

cp -rL "$CONTEXT_PATH" "$dockerdir"

if [ $export_from == "dockerhub" ]; then
    docker_hub=$(echo "$url" | cut -d '?' -f 1):"$tag"
    extra=''
else
    if [ -z "$fileb64" ]; then
        # Dockerfile is a path in the server
        d_file=$(echo "$url" | cut -d '?' -f 1)

        if [ -f "$d_file" ]; then
            extra=$(cat "$d_file")
        else
            echo "$d_file does not exist" 1>&2
            exit 1
        fi
    else
        # Dockerfile is encoded in base64
        extra=$(echo "$fileb64" | base64 -d)
    fi

    # Read image that needs to be build
    docker_hub=$(echo "$extra" | grep "^FROM" | cut -d ' ' -f2)

    if [ -z "$docker_hub" ]; then
        echo "Can\'t identify image to build" 1>&2
        exit 1
    fi

    # Remove FROM instruction from dockerfile as it will be added later
    extra=$(echo "$extra" | sed '/^FROM.*/d')
fi

# Check distro
if [ -z "$distro" ]; then
    os_info=$(docker run --rm --entrypoint cat \
        -e "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
        "$docker_hub" /etc/os-release)

    distro=$(echo "$os_info" | grep "^ID=" | cut -d= -f 2 | xargs)
    version=$(echo "$os_info" | grep "VERSION_ID=" | cut -d= -f 2 | xargs)
fi

if [ -z "$distro" ]; then
    echo "Cannot identify $docker_hub distribution" 1>&2
    exit 1
fi

#---------------------------------------------------------------------------
# Create a DockerFile
#---------------------------------------------------------------------------

case "$distro" in
debian|ubuntu)
    commands=$(cat "$DOCKERFILES/debian")
    ;;
centos)
    if [ "$version" = "8" ]; then
        commands=$(cat "$DOCKERFILES/centos8")
    else
        commands=$(cat "$DOCKERFILES/centos7")
    fi
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

# Only add context if this variable is not set or is set to yes
if [ -z "$context" -o "$context" == "yes" ]; then
    dockerfile_template=${dockerfile_template/\%COMMANDS\%/$commands}
else
    dockerfile_template=${dockerfile_template/\%COMMANDS\%/''}
fi

# Add extra commands, this is the dockerfile in case there is any
dockerfile_template=${dockerfile_template/\%EXTRA\%/$extra}

#-------------------------------------------------------------------------------
# Inspect image to get CMD, ENTRYPOINT and ENV
#
# Following Docker documentation formats:
#   https://docs.docker.com/engine/reference/builder/#cmd
#   https://docs.docker.com/engine/reference/builder/#entrypoint
#   https://docs.docker.com/engine/reference/builder/#env
#
# When having CMD and ENTRYPOINT:
#
#   The main purpose of a CMD is to provide defaults for an executing container.
#   These defaults can include an executable, or they can omit the executable,
#   in which case you must specify an ENTRYPOINT instruction as well.
#-------------------------------------------------------------------------------

if [ $export_from == "dockerhub" ]; then
    cmd=$(docker inspect "$docker_hub" | jq -r '.[0].Config.Cmd[] |= "\"" + . + "\"" | .[0].Config.Cmd')
    entrypoint=$(docker inspect "$docker_hub" | jq -r '.[0].Config.Entrypoint')
    env=$(docker inspect "$docker_hub" | jq -r '.[0].Config.Env')
else
    tmp_dockerfile_template=$dockerfile_template
    tmp_dockerfile_template=${tmp_dockerfile_template/\%ONE_ENTRYPOINT\%/''}

    echo "$tmp_dockerfile_template" > "$dockerfile"

    # Build the image with user Dockerfile to be able to inspect it
    docker build -t one"$sid" -f "$dockerfile" "$dockerdir" > /dev/null 2>&1

    image_id=$(docker images -q one"$sid")

    cmd=$(docker inspect "$docker_hub" | jq -r '.[0].Config.Cmd[] |= "\"" + . + "\"" | .[0].Config.Cmd')
    entrypoint=$(docker inspect "$image_id" | jq -r '.[0].Config.Entrypoint')
    env=$(docker inspect "$image_id" | jq -r '.[0].Config.Env')

    # Delete this image as it will need to be build after
    docker image rm -f one"$sid" > /dev/null 2>&1
fi

#-------------------------------------------------------------------------------
# Build OpenNebula entrypoint
#
#   1. Export all the variables under $env
#   2. Export user custom variables located under /var/run/one-context/one_env
#   3. Run the entrypoint:
#       if entrypoint && cmd
#           command = entrypoint + cmd
#       else if entrypoint && !cmd
#           command = entrypoint
#       else if !entrypoint && cmd
#           command = cmd
#       else
#           no OpenNebula entrypoint
#-------------------------------------------------------------------------------

if [ -n "$entrypoint" ] && ! [ "$entrypoint" == "null" ]; then
    entrypoint=$(echo "$entrypoint" | jq -r '. | join(" ")')
fi

if [ -n "$cmd" ] && ! [ "$cmd" == "null" ]; then
    cmd=$(echo "$cmd" | jq -r '. | join(" ")')
fi

cmd_is_bash=$(echo "$cmd" | grep -E '"\/.*\w+\/(sh"|bash")$' || echo '')
entrypoint_is_bash=$(echo "$entrypoint" | grep -E '\/.*\w+\/(sh|bash)$' || echo '')

if [ -n "$entrypoint" ] && ! [ "$entrypoint" == "null" ] && [ -z "$entrypoint_is_bash" ]; then
    if [ -n "$cmd" ] && ! [ "$cmd" == "null" ] && [ -z "$cmd_is_bash" ]; then
        one_entrypoint="${entrypoint} ${cmd}"
    else
        one_entrypoint="${entrypoint}"
    fi
elif [ -n "$cmd" ] && ! [ "$cmd" == "null" ] && [ -z "$cmd_is_bash" ]; then
    one_entrypoint="${cmd}"
fi

if [ -n "$one_entrypoint" ]; then
    one_env="RUN echo '#!/bin/sh\n"

    if [ -n "$env" ] && ! [ "$env" == "null" ]; then
        env=$(echo "$env" | jq -jr '.[] | "export \"" + . + "\"\\n"')
        one_env="${one_env}$env"
    fi

    one_env="${one_env}source /var/run/one-context/one_env\n"
    one_entrypoint="${one_env}${one_entrypoint}' > /one_entrypoint.sh"
    dockerfile_template=${dockerfile_template/\%ONE_ENTRYPOINT\%/$one_entrypoint}
else
    dockerfile_template=${dockerfile_template/\%ONE_ENTRYPOINT\%/''}
fi

echo "$dockerfile_template" > "$dockerfile"

docker build -t one"$sid" -f "$dockerfile" "$dockerdir" > /dev/null 2>&1

image_id=$(docker images -q one"$sid")

#-------------------------------------------------------------------------------
# Flatten container image
#-------------------------------------------------------------------------------
# rm -f /.dockerenv to avoid external tools to autodetect as docker images
container_id=$(docker run -d "$image_id" rm -f /.dockerenv)

docker export -o "$tarball" "$container_id" > /dev/null 2>&1

#-------------------------------------------------------------------------------
# Dump container FS and create image
#-------------------------------------------------------------------------------

# Get tarbal size
tar_size=$(stat -c%s "$tarball" | awk '{ byte =$1 /1024/1024; print byte}' | cut -d '.' -f 1)

# Ensure $size is enough to fit the fs
if [ "$tar_size" -ge "$size" ]; then
    echo "Not enough space, image size must be at least $tar_size MB" 1>&2
    exit 1
fi

qemu-img create -f raw "$img_raw" "$size"M  > /dev/null 2>&1

case "$filesystem" in
    "ext4")
        mkfs.ext4 -F "$img_raw" > /dev/null 2>&1
        ;;
    "ext3")
        mkfs.ext3 -F "$img_raw" > /dev/null 2>&1
        ;;
    "ext2")
        mkfs.ext2 -F "$img_raw" > /dev/null 2>&1
        ;;
    "xfs")
        mkfs.xfs -f "$img_raw" > /dev/null 2>&1
        ;;
    *)
        mkfs.ext4 -F "$img_raw" > /dev/null 2>&1
        ;;
esac

#-------------------------------------------------------------------------------
# Mount container disk image and untar rootfs contents to it
#-------------------------------------------------------------------------------

sudo -n "$MK_DOCKER" -d "$dockerdir" -i "$img_raw" -t "$tarball"

if [ "$format" == "qcow2" ]; then
    qemu-img convert -f raw -O qcow2 "$img_raw" "$img_qcow" > /dev/null 2>&1
    cat "$img_qcow"
else
    cat "$img_raw"
fi

exit 0

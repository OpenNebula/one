#!/bin/sh

set -e

# give up after two minutes
TIMEOUT=120

#
# functions
#

. /usr/share/one/supervisor/scripts/lib/functions.sh

#
# dependencies
#

# emulate dependency
for _requisite in \
    containerd \
    ;
do
    if ! is_running "$_requisite" ; then
        supervisorctl start "$_requisite"
    fi
done

#
# run service
#

for envfile in \
    /etc/sysconfig/dockerd \
    ;
do
    if [ -f "$envfile" ] ; then
        . "$envfile"
    fi
done

CONTAINERD_SOCK="${CONTAINERD_SOCK:-/run/containerd/containerd.sock}"
export CONTAINERD_SOCK

DOCKERD_SOCK="${DOCKERD_SOCK:-/var/run/docker.sock}"
export DOCKERD_SOCK

# wait for containerd socket to emerge
if ! wait_for_file "${CONTAINERD_SOCK}" ; then
    err "Timeout!"
    exit 1
fi

msg "Service started!"
exec /usr/bin/dockerd ${DOCKER_HOSTS} \
    --containerd="${CONTAINERD_SOCK}"

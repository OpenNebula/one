#!/bin/sh

set -e

#
# functions
#

. /usr/share/one/supervisor/scripts/lib/functions.sh

#
# run service
#

CONTAINERD_SOCK=/run/containerd/containerd.sock
export CONTAINERD_SOCK

# this will most likely not work inside the container
msg "Try to load overlayfs module"
/sbin/modprobe overlay || true

msg "Service started!"
exec /usr/bin/containerd --address "${CONTAINERD_SOCK}"

#!/bin/sh

set -e

# give up after two minutes
TIMEOUT=120

#
# functions
#

. /usr/share/one/supervisor/scripts/lib/functions.sh

#
# run service
#

if [ -f /var/lib/one/.one/oneflow_auth ] ; then
    msg "Found oneflow_auth - we can start service"
else
    msg "No oneflow_auth - wait for oned to create it..."
    if ! wait_for_file /var/lib/one/.one/oneflow_auth ; then
        err "Timeout!"
        exit 1
    fi
    msg "File created - continue"
fi

msg "Service started!"
exec /usr/bin/ruby /usr/lib/one/oneflow/oneflow-server.rb

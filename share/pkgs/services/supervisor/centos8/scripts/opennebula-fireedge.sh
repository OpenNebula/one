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

for envfile in \
    /etc/default/supervisor/fireedge \
    ;
do
    if [ -f "$envfile" ] ; then
        . "$envfile"
    fi
done

if [ -f /var/lib/one/.one/sunstone_auth ] ; then
    msg "Found sunstone_auth - we can start service"
else
    msg "No sunstone_auth - wait for oned to create it..."
    if ! wait_for_file /var/lib/one/.one/sunstone_auth ; then
        err "Timeout!"
        exit 1
    fi
    msg "File created - continue"
fi

msg "Service started!"
exec /usr/bin/node /usr/lib/one/fireedge/dist/index.js

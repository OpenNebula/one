#!/bin/sh

set -e

#
# functions
#

. /usr/share/one/supervisor/scripts/lib/functions.sh

#
# run service
#

for envfile in \
    /etc/default/supervisor/stunnel \
    ;
do
    if [ -f "$envfile" ] ; then
        . "$envfile"
    fi
done

msg "Service started!"
exec /usr/bin/stunnel /etc/stunnel/stunnel.conf

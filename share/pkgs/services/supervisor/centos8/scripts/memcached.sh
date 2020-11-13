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
    /etc/sysconfig/memcached \
    ;
do
    if [ -f "$envfile" ] ; then
        . "$envfile"
    fi
done

msg "Service started!"
exec /usr/bin/memcached -p ${PORT} -u ${USER} -m ${CACHESIZE} -c ${MAXCONN} $OPTIONS


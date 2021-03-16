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

#TODO: should I wait for sunstone or something?

for envfile in \
    /etc/one/guacd \
    ;
do
    if [ -f "$envfile" ] ; then
        . "$envfile"
    fi
done

LD_LIBRARY_PATH=/usr/share/one/guacd/lib
export LD_LIBRARY_PATH

msg "Service started!"
exec /usr/share/one/guacd/sbin/guacd -f $OPTS

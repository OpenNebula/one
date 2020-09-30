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
    opennebula-ssh-agent \
    ;
do
    if ! is_running "$_requisite" ; then
        supervisorctl start "$_requisite"
    fi
done

#
# run service
#

# wait for mysqld
msg "Wait for database..."
if ! wait_for_opennebula_db ; then
    err "Timeout!"
    exit 1
fi

msg "Database is running - continue"

for envfile in \
    /var/run/one/ssh-agent.env \
    ;
do
    if [ -f "$envfile" ] ; then
        . "$envfile"
    fi
done

export SSH_AUTH_SOCK

PATH=/usr/lib/one/sh/override:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PATH

msg "Service started!"
exec /usr/bin/oned -f

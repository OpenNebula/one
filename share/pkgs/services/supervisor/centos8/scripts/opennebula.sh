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

for envfile in \
    /var/run/one/ssh-agent.env \
    /etc/default/supervisor/oned \
    ;
do
    if [ -f "$envfile" ] ; then
        . "$envfile"
    fi
done

export SSH_AUTH_SOCK

PATH=/usr/lib/one/sh/override:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PATH

# wait for mysqld
msg "Wait for database..."
if ! wait_for_opennebula_db ; then
    err "Timeout!"
    exit 1
fi

msg "Database is running - continue"

# TODO: remove this once oned fix this:
# https://github.com/OpenNebula/one/issues/5189
#
# or at least improve this when oned start to store PID inside the lock file so
# you can verify that no oned process is running...
if [ -e /var/lock/one/one ] ; then
    msg "Remove stale lock: /var/lock/one/one"
    rm -f /var/lock/one/one
fi

msg "Rotate log to start with an empty one"
/usr/sbin/logrotate -s /var/lib/one/.logrotate.status \
    -f /etc/logrotate.d/opennebula || true

msg "Service started!"
exec /usr/bin/oned -f

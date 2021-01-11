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

# upgrade database if needed
msg "Check database version"

# to avoid script termination on non-zero code from command - we wrap the
# command in if-else construct
if onedb version -v ; then
    _status=0
else
    _status=$?
fi

case "$_status" in
    0)
        msg "Database is up-to-date - continue"
        ;;
    1)
        msg "Database was not created yet - continue"
        ;;
    2)
        msg "Upgrading database..."
        if is_true "${ONED_DB_BACKUP_ENABLED:-yes}" ; then
            _mysqldump="/var/lib/one/backups/db/opennebula-$(date +%Y-%m-%d-%s).sql"
            onedb upgrade --backup "${_mysqldump}"
        else
            onedb upgrade --no-backup
        fi
        ;;
    3)
        err "Database is newer than this opennebula version - ABORT"
        exit 1
        ;;
    *)
        err "Returned unknown error by onedb - ABORT"
        exit 1
        ;;
esac

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

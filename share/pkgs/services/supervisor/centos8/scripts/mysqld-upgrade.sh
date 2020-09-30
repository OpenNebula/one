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

# we are talking locally and this pollutes our env.
unset MYSQL_HOST
unset MYSQL_PORT

# wait for mysqld
msg "Wait for mysqld process..."
if ! wait_for_mysqld ; then
    err "Timeout!"
    exit 1
fi

msg "Try to upgrade the database - mysqld is running"
/usr/libexec/mysql-check-upgrade

# TODO: either this or dealing with a service in EXITED status
msg "Service finished! (entered infinity sleep)"
exec /bin/sleep infinity

#!/bin/sh

set -e

# give up after two minutes
TIMEOUT=120

#
# functions
#

. /usr/share/one/supervisor/scripts/lib/functions.sh

is_root_password_unset()
(
    _check=$(mysql -u root -s -N -e 'select CURRENT_USER();')
    case "$_check" in
        root@*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac

    return 1
)

is_root_password_valid()
(
    _check=$(mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -s -N -e 'select CURRENT_USER();')
    case "$_check" in
        root@*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac

    return 1
)

#
# run service
#

for envfile in \
    /etc/default/supervisor/mysqld \
    ;
do
    if [ -f "$envfile" ] ; then
        . "$envfile"
    fi
done

# we are talking locally and this pollutes our env.
unset MYSQL_HOST
unset MYSQL_PORT

# wait for mysqld
msg "Wait for mysqld process..."
if ! wait_for_mysqld ; then
    err "Timeout!"
    exit 1
fi

msg "Start configuration - mysqld is running"

# create password, user and database if requested

# root password
if [ -n "$MYSQL_ROOT_PASSWORD" ] ; then
    msg "Setup root password"
    if is_root_password_unset ; then
        mysql -u root <<EOF
SET GLOBAL TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET PASSWORD FOR 'root'@'localhost' = PASSWORD('${MYSQL_ROOT_PASSWORD}');
FLUSH PRIVILEGES;
EOF
    else
        if ! is_root_password_valid ; then
            # TODO: support the change of root password?
            err "The root password was already set and differs - ABORT"
            exit 1
        fi
    fi
fi

# create user and database
if [ -n "$MYSQL_USER" ] \
    && [ -n "$MYSQL_PASSWORD" ] \
    && [ -n "$MYSQL_DATABASE" ] ;
then
    msg "Setup the mysql database and its user"

    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE};
GRANT ALL PRIVILEGES on ${MYSQL_DATABASE}.* to '${MYSQL_USER}'@'%' identified by '${MYSQL_PASSWORD}';
FLUSH PRIVILEGES;
EOF
fi

# secure the mysql installation
msg "Secure the installation"
LANG=C expect -f - <<EOF
set timeout 10
spawn mysql_secure_installation

expect "Enter current password for root (enter for none):"
send "${MYSQL_ROOT_PASSWORD}\n"

expect "Set root password?"
send "n\n"

expect "Remove anonymous users?"
send "Y\n"

expect "Disallow root login remotely?"
send "Y\n"

expect "Remove test database and access to it?"
send "Y\n"

expect "Reload privilege tables now?"
send "Y\n"

expect eof
EOF

# TODO: either this or dealing with a service in EXITED status
msg "Service finished! (entered infinity sleep)"
exec /bin/sleep infinity

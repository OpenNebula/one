#!/bin/sh

# here are shared functions for all supervised services

msg()
(
    echo "$(date '+%F %T') [SUPERVISOR]: ${SUPERVISOR_PROCESS_NAME}: $*"
)

err()
(
    echo "$(date '+%F %T') [SUPERVISOR] [!] ERROR: ${SUPERVISOR_PROCESS_NAME}: $*"
)

is_running()
(
    _status=$(LANG=C supervisorctl status "$1" | awk '{print $2}')

    case "$_status" in
        RUNNING)
            return 0
            ;;
    esac

    return 1
)

check_pidfile()
(
    if [ -f "$1" ] ; then
        _pid=$(cat "$1")
    else
        return 1
    fi

    if ! kill -0 ${_pid} ; then
        return 1
    fi

    return 0
)

wait_for_oned()
(
    TIMEOUT="${TIMEOUT:-120}"

    while [ "$TIMEOUT" -gt 0 ] ; do
        if oneuser list -x \
           --endpoint "http://${ONED_HOST}:${ONED_INTERNAL_PORT}/RPC2" \
           > /dev/null 2>&1 \
           ;
        then
            return 0
        fi

        TIMEOUT=$(( TIMEOUT - 1 ))
        sleep 1
    done

    return 1
)

wait_for_memcached()
(
    TIMEOUT="${TIMEOUT:-120}"

    while [ "$TIMEOUT" -gt 0 ] ; do
        if echo stats | nc "${MEMCACHED_HOST}" "${MEMCACHED_INTERNAL_PORT}" \
           > /dev/null 2>&1 \
           ;
        then
            return 0
        fi

        TIMEOUT=$(( TIMEOUT - 1 ))
        sleep 1
    done

    return 1
)

wait_for_mysqld()
(
    TIMEOUT="${TIMEOUT:-120}"

    while [ "$TIMEOUT" -gt 0 ] ; do
        if check_pidfile /var/run/mariadb/mariadb.pid ; then
            return 0
        fi

        TIMEOUT=$(( TIMEOUT - 1 ))
        sleep 1
    done

    return 1
)

wait_for_opennebula_db()
(
    TIMEOUT="${TIMEOUT:-120}"

    while [ "$TIMEOUT" -gt 0 ] ; do
        if mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -D "$MYSQL_DATABASE" \
            -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
            -e 'exit' \
            ;
        then
            return 0
        fi

        TIMEOUT=$(( TIMEOUT - 1 ))
        sleep 1s
    done

    return 1
)

wait_for_file()
(
    TIMEOUT="${TIMEOUT:-120}"

    while [ "$TIMEOUT" -gt 0 ] ; do
        if [ -e "$1" ] ; then
            return 0
        fi

        TIMEOUT=$(( TIMEOUT - 1 ))
        sleep 1
    done

    return 1
)

is_true()
(
    _value=$(echo "$1" | tr '[:upper:]' '[:lower:]')

    case "$_value" in
        yes|true|1)
            return 0
            ;;
    esac

    return 1
)

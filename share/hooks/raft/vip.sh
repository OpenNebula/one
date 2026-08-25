#!/bin/bash

# Setup virtual IP
# usage:
#     vip.sh action interface ip [interface ip ...]
# Where action is one of:
#   leader - New raft leader, set virtual IPs
#   follower - unset virtual IPs

#
# functions
#

# test if a systemd unit from the argument can be started
# arg: <unit name>
# return:
#   0: when unit can be started (even if the unit is disabled)
#   1: in all other cases (e.g.: explicitly masked or invalid unit syntax)
is_systemd_unit_startable()
{
    _systemctl_output=$(LANG=C systemctl is-enabled "${1}" 2>&1)

    if [ $? -eq 0 ]; then
        return 0
    else
        case "$_systemctl_output" in
            linked*|disabled)
                # unit still can be started: systemctl start <unit name>
                return 0
                ;;
            *)
                # unit is invalid or explicitly masked: we will not start it
                return 1
                ;;
        esac
    fi

    # just to be safe
    return 1
}

# Start or stop a service without failing the HA transition. Service management
# is best effort because some services may not be available during a role change.
service_command()
{
    if ! sudo -n "$@"; then
        echo "Warning: Failed to execute service command: $*" >&2
    fi

    return 0
}

# (Un)set the virtual IP
function virtualip() {
    INTERFACE="$1"
    IFADDR="$2"
    IP="${IFADDR%%/*}"

    if [ -z "$INTERFACE" ]; then
        echo "Missing interface." >&2
        exit 1
    fi

    if [ -z "$IFADDR" ]; then
        echo "Missing IP." >&2
        exit 1
    fi

    ###

    case $ACTION in
    leader)
        if ! ip address show dev "$INTERFACE" | grep -qi " ${IP}/"; then
            if ! sudo -n ip address add "$IFADDR" dev "$INTERFACE"; then
                echo "Failed to add IP '$IFADDR' to interface '$INTERFACE'." >&2
                return 1
            fi
        fi

        ARPING_U_SUCCESS=no
        ARPING_A_SUCCESS=no

        for i in $(seq 5); do
            if sudo -n arping -c 1 -U -I "$INTERFACE" "$IP"; then
                ARPING_U_SUCCESS=yes
            else
                echo "Warning: Failed to send ARP update for '$IP'" \
                     "on '$INTERFACE' (attempt $i)." >&2
            fi

            if sudo -n arping -c 1 -A -I "$INTERFACE" "$IP"; then
                ARPING_A_SUCCESS=yes
            else
                echo "Warning: Failed to send ARP reply for '$IP'" \
                     "on '$INTERFACE' (attempt $i)." >&2
            fi

            sleep 1
        done

        if [ "$ARPING_U_SUCCESS" != 'yes' ] ||
           [ "$ARPING_A_SUCCESS" != 'yes' ];
        then
            echo "Failed to announce IP '$IP' on interface '$INTERFACE'." >&2
            return 1
        fi
        ;;

    follower)
        if ip address show dev $INTERFACE | grep -qi " ${IP}/"; then
            sudo -n ip address del $IFADDR dev $INTERFACE
        fi
        ;;

    *)
        echo "Unknown action '$ACTION'" >&2
        exit 1
        ;;
    esac
}

#
# main
#

if [ -z "${ONE_LOCATION}" ]; then
    LOCK_LOCATION=/var/lock/one
else
    LOCK_LOCATION=$ONE_LOCATION/var/lock
fi

LOCK_FILE="$LOCK_LOCATION/vip_sh"

ACTION="$1"
shift

# Start of critical section (opens LOCK_FILE with fd 56)
if ! exec 56>"$LOCK_FILE"; then
    echo "Failed to open lock file '$LOCK_FILE'." >&2
    exit 1
fi

if ! flock -w 60 56; then
    echo "Failed to acquire lock '$LOCK_FILE'." >&2
    exit 1
fi

EXIT_CODE=0

# Process all parameters in the form of interface:IP
while [[ $# -gt 0 ]]
do
    if ! virtualip "$1" "$2"; then
        EXIT_CODE=1
    fi

    shift
    shift
done

# Start or stop OpenNebula services

if which systemctl &>/dev/null && [ -d /etc/systemd ]; then
    IS_SYSTEMD=yes
else
    IS_SYSTEMD=no
fi

case $ACTION in
leader)
    if [ "${IS_SYSTEMD}" = 'yes' ]; then
        if systemctl is-enabled opennebula-flow >/dev/null 2>&1; then
            service_command systemctl start opennebula-flow
        fi

        if systemctl is-enabled opennebula-gate >/dev/null 2>&1; then
            service_command systemctl start opennebula-gate
        fi

        if systemctl is-enabled opennebula-form >/dev/null 2>&1; then
            service_command systemctl start opennebula-form
        fi

        # opennebula.service wants opennebula-hem.service
        if is_systemd_unit_startable opennebula-hem ; then
            # this is implicit dependency of the opennebula.service...
            service_command systemctl start opennebula-hem
        fi

        # opennebula.service wants opennebula-showback.timer
        if is_systemd_unit_startable opennebula-showback.timer ; then
            # this is implicit dependency of the opennebula.service...
            service_command systemctl start opennebula-showback.timer
        fi
    else
        if [ -e /usr/lib/one/oneflow/oneflow-server.rb ]; then
            service_command service opennebula-flow start
        fi

        if [ -e /usr/lib/one/onegate/onegate-server.rb ]; then
            service_command service opennebula-gate start
        fi

        if [ -e /usr/lib/one/oneform/oneform-server.rb ]; then
            service_command service opennebula-form start
        fi

        if [ -e /usr/lib/one/onehem/onehem-server.rb ]; then
            service_command service opennebula-hem start
        fi
        # TODO: showback timer will not work on non-systemd system - crontab?
    fi
    ;;

follower)
    if [ "${IS_SYSTEMD}" = 'yes' ]; then
        if systemctl is-enabled opennebula-flow >/dev/null 2>&1 ||
           systemctl is-active  opennebula-flow >/dev/null 2>&1;
        then
            service_command systemctl stop opennebula-flow
        fi

        if systemctl is-enabled opennebula-gate >/dev/null 2>&1 ||
           systemctl is-active  opennebula-gate >/dev/null 2>&1;
        then
            service_command systemctl stop opennebula-gate
        fi

        if systemctl is-enabled opennebula-form >/dev/null 2>&1 ||
           systemctl is-active  opennebula-form >/dev/null 2>&1;
        then
            service_command systemctl stop opennebula-form
        fi

        if systemctl is-enabled opennebula-hem >/dev/null 2>&1 ||
           systemctl is-active  opennebula-hem >/dev/null 2>&1;
        then
            service_command systemctl stop opennebula-hem
        fi

        if systemctl is-enabled opennebula-showback.timer >/dev/null 2>&1 ||
           systemctl is-active  opennebula-showback.timer >/dev/null 2>&1;
        then
            service_command systemctl stop opennebula-showback.timer
        fi
    else
        if [ -e /usr/lib/one/oneflow/oneflow-server.rb ]; then
            service_command service opennebula-flow stop
        fi

        if [ -e /usr/lib/one/onegate/onegate-server.rb ]; then
            service_command service opennebula-gate stop
        fi

        if [ -e /usr/lib/one/oneform/oneform-server.rb ]; then
            service_command service opennebula-form stop
        fi

        if [ -e /usr/lib/one/onehem/onehem-server.rb ]; then
            service_command service opennebula-hem stop
        fi
        # TODO: showback timer will not work on non-systemd system - crontab?
    fi
    ;;

*)
    echo "Unknown action '$ACTION'" >&2
    exit 1
    ;;
esac

exit $EXIT_CODE

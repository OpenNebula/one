#!/bin/bash -e

ACTION="$1"
INTERFACE="$2"
IFADDR="$3"
IP="${IFADDR%%/*}"

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

#
# main
#

if [ -z "$INTERFACE" ]; then
    echo "Missing interface." >&2
    exit 1
fi

if [ -z "$IFADDR" ]; then
    echo "Missing IP." >&2
    exit 1
fi

###

if which systemctl &>/dev/null && [ -d /etc/systemd ]; then
    IS_SYSTEMD=yes
else
    IS_SYSTEMD=no
fi

case $ACTION in
leader)
    sudo -n ip address add $IFADDR dev $INTERFACE

    for i in $(seq 5); do
        sudo -n arping -c 1 -U -I $INTERFACE ${IP}
        sleep 1
        sudo -n arping -c 1 -A -I $INTERFACE ${IP}
        sleep 1
    done

    if [ "${IS_SYSTEMD}" = 'yes' ]; then
        if systemctl is-enabled opennebula-flow >/dev/null 2>&1; then
            sudo -n systemctl start opennebula-flow
        fi

        if systemctl is-enabled opennebula-gate >/dev/null 2>&1; then
            sudo -n systemctl start opennebula-gate
        fi

        # opennebula.service wants opennebula-hem.service
        if is_systemd_unit_startable opennebula-hem ; then
            # this is implicit dependency of the opennebula.service...
            sudo -n systemctl start opennebula-hem
        fi

        # opennebula.service wants opennebula-showback.timer
        if is_systemd_unit_startable opennebula-showback.timer ; then
            # this is implicit dependency of the opennebula.service...
            sudo -n systemctl start opennebula-showback.timer
        fi
    else
        if [ -e /usr/lib/one/oneflow/oneflow-server.rb ]; then
            sudo -n service opennebula-flow start
        fi

        if [ -e /usr/lib/one/onegate/onegate-server.rb ]; then
            sudo -n service opennebula-gate start
        fi

        if [ -e /usr/lib/one/onehem/onehem-server.rb ]; then
            sudo -n service opennebula-hem start
        fi
        # TODO: showback timer will not work on non-systemd system - crontab?
    fi
    ;;

follower)
    if ip address show dev $INTERFACE | grep -qi " ${IP}/"; then
        sudo -n ip address del $IFADDR dev $INTERFACE
    fi

    if [ "${IS_SYSTEMD}" = 'yes' ]; then
        if systemctl is-enabled opennebula-flow >/dev/null 2>&1 ||
           systemctl is-active  opennebula-flow >/dev/null 2>&1;
        then
            sudo -n systemctl stop opennebula-flow
        fi

        if systemctl is-enabled opennebula-gate >/dev/null 2>&1 ||
           systemctl is-active  opennebula-gate >/dev/null 2>&1;
        then
            sudo -n systemctl stop opennebula-gate
        fi

        if systemctl is-enabled opennebula-hem >/dev/null 2>&1 ||
           systemctl is-active  opennebula-hem >/dev/null 2>&1;
        then
            sudo -n systemctl stop opennebula-hem
        fi

        if systemctl is-enabled opennebula-showback.timer >/dev/null 2>&1 ||
           systemctl is-active  opennebula-showback.timer >/dev/null 2>&1;
        then
            sudo -n systemctl stop opennebula-showback.timer
        fi
    else
        if [ -e /usr/lib/one/oneflow/oneflow-server.rb ]; then
            sudo -n service opennebula-flow stop
        fi

        if [ -e /usr/lib/one/onegate/onegate-server.rb ]; then
            sudo -n service opennebula-gate stop
        fi

        if [ -e /usr/lib/one/onehem/onehem-server.rb ]; then
            sudo -n service opennebula-hem stop
        fi
        # TODO: showback timer will not work on non-systemd system - crontab?
    fi
    ;;

*)
    echo "Unknown action '$ACTION'" >&2
    exit 1
    ;;
esac

exit 0

#!/bin/bash -e

ACTION="$1"
INTERFACE="$2"
IFADDR="$3"
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

if which systemctl &>/dev/null && [ -d /etc/systemd ]; then
    IS_SYSTEMD=yes
else
    IS_SYSTEMD=no
fi

case $ACTION in
leader)
    sudo ip address add $IFADDR dev $INTERFACE

    for i in $(seq 5); do
        sudo arping -c 1 -U -I $INTERFACE ${IP}
        sleep 1
        sudo arping -c 1 -A -I $INTERFACE ${IP}
        sleep 1
    done

    if [ "${IS_SYSTEMD}" = 'yes' ]; then
        if systemctl is-enabled opennebula-flow >/dev/null 2>&1; then
            sudo -n systemctl start opennebula-flow
        fi

        if systemctl is-enabled opennebula-gate >/dev/null 2>&1; then
            sudo -n systemctl start opennebula-gate
        fi

        if systemctl is-enabled opennebula-hem >/dev/null 2>&1; then
            sudo -n systemctl start opennebula-hem
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
    fi
    ;;

follower)
    if sudo ip address show dev $INTERFACE | grep -qi " ${IP}/"; then
        sudo ip address del $IFADDR dev $INTERFACE
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
    fi
    ;;

*)
    echo "Unknown action '$ACTION'" >&2
    exit 1
    ;;
esac

exit 0

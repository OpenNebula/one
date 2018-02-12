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

case $ACTION in
leader)
    sudo ip address add $IFADDR dev $INTERFACE

    for i in $(seq 5); do
        sudo arping -c 1 -U -I $INTERFACE ${IP}
        sleep 1
        sudo arping -c 1 -A -I $INTERFACE ${IP}
        sleep 1
    done

    if which oneflow-server &>/dev/null &&
        [ ! -e /var/run/one/oneflow.pid ];
    then
        oneflow-server start
    fi
    ;;

follower)
    if sudo ip address show dev $INTERFACE | grep -qi " ${IP}/"; then
        sudo ip address del $IFADDR dev $INTERFACE
    fi

    if which oneflow-server &>/dev/null &&
        [ -e /var/run/one/oneflow.pid ];
    then
        oneflow-server stop
    fi
    ;;

*)
    echo "Unknown action '$ACTION'" >&2
    exit 1
    ;;
esac

exit 0

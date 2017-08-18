#!/bin/bash -e

ACTION="$1"
INTERFACE="$2"
IP="$3"

if [ -z "$INTERFACE" ]; then
    echo "Missing interface." >&2
    exit 1
fi

if [ -z "$IP" ]; then
    echo "Missing IP." >&2
    exit 1
fi

case $ACTION in
leader)
    sudo ip address add $IP dev $INTERFACE
    for i in $(seq 5); do
        sudo arping -c 1 -U -I $INTERFACE ${IP%%/*}
        sleep 1
        sudo arping -c 1 -A -I $INTERFACE ${IP%%/*}
        sleep 1
    done
    ;;

follower)
    sudo ip address del $IP dev $INTERFACE
    ;;

*)
    echo "Unknown action '$ACTION'" >&2
    exit 1
    ;;
esac

exit 0

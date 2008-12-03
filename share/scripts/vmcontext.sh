#!/bin/bash
 
# Gets IP address from a given MAC
mac2ip() {
    mac=$1
 
    let ip_a=0x`echo $mac | cut -d: -f 3`
    let ip_b=0x`echo $mac | cut -d: -f 4`
    let ip_c=0x`echo $mac | cut -d: -f 5`
    let ip_d=0x`echo $mac | cut -d: -f 6`
 
    ip="$ip_a.$ip_b.$ip_c.$ip_d"
 
    echo $ip
}
 
# Gets the network part of an IP
get_network() {
    IP=$1
 
    echo $IP | cut -d'.' -f1,2,3
}
 
get_interfaces() {
    IFCMD="/sbin/ifconfig -a"
 
    $IFCMD | grep ^eth | sed 's/ *Link encap:Ethernet.*HWaddr /-/g'
}
 
get_dev() {
    echo $1 | cut -d'-' -f 1
}
 
get_mac() {
    echo $1 | cut -d'-' -f 2
}
 
gen_hosts() {
    NETWORK=$1
    echo "127.0.0.1 localhost"
    for n in `seq -w 01 99`; do
        n2=`echo $n | sed 's/^0*//'`
        echo ${NETWORK}.$n2 cluster${n}
    done
}
 
gen_exports() {
    NETWORK=$1
    echo "/images ${NETWORK}.0/255.255.255.0(rw,async,no_subtree_check)"
}
 
gen_hostname() {
    MAC=$1
    NUM=`mac2ip $MAC | cut -d'.' -f4`
    NUM2=`echo 000000$NUM | sed 's/.*\(..\)/\1/'`
    echo cluork part of an IP
get_network() {
    IP=$1
 
    echo $IP | cut -d'.' -f1,2,3
}
 
get_interfaces() {
    IFCMD="/sbin/ifconfig -a"
 
    $IFCMD | grep ^eth | sed 's/ *Link encap:Ethernet.*HWaddr /-/g'
}
 
get_dev() {
    echo $1 | cut -d'-' -f 1
}
 
get_mac() {
    echo $1 | cut -d'-' -f 2
}
 
gen_hosts()  "  gateway $NETWORK.1"
    fi
 
echo ""
}
 
 
IFACES=`get_interfaces`
 
for i in $IFACES; do
    MASTER_DEV_MAC=$i
    DEV=`get_dev $i`
    MAC=`get_mac $i`
    IP=`mac2ip $MAC`
    NETWORK=`get_network $IP`
done
 
# gen_hosts $NETWORK > /etc/hosts
 
# gen_exports $NETWORK  > /etc/exports
 
# gen_hostname $MAC  > /etc/hostname
 
(
cat <<EOT
auto lo
iface lo inet loopback
 
EOT
 
for i in $IFACES; do
    gen_interface $i
done
) > /etc/network/interfaces
 
# /bin/hostname `cat /etc/hostname`


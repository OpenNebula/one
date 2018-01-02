#!/bin/bash
# Opennebula network contextualization initscript for debian
# Copy in /etc/init.d and install:
# update-rc.d vmcontext.sh start 01 S

### BEGIN INIT INFO
# Provides:       vmcontext
# Required-Start: mountkernfs $local_fs
# Required-Stop:
# Default-Stop:
# Default-Start:  S
# X-Start-Before: ifupdown networking
# Short-Description: Start the Opennebula context.
### END INIT INFO

# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

. /lib/lsb/init-functions

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
    echo cluster$NUM2
}

gen_interface() {
    DEV_MAC=$1
    DEV=`get_dev $DEV_MAC`
    MAC=`get_mac $DEV_MAC`
    IP=`mac2ip $MAC`
    NETWORK=`get_network $IP`

    cat <<EOT
auto $DEV
iface $DEV inet static
  address $IP
  network $NETWORK.0
  netmask 255.255.255.0
EOT

    if [ $DEV == "eth0" ]; then
      echo "  gateway $NETWORK.1"
    fi

echo ""
}

case "$1" in
  start)
	log_action_msg "Starting the Opennebula contextualization network"
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
	;;
  restart|reload|force-reload)
	echo "Error: argument '$1' not supported" >&2
        exit 3
        ;;
  stop)
        ;;
  *)
        echo "Usage: $0 start|stop" >&2
        exit 3
        ;;
esac

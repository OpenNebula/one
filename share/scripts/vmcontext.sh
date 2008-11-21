#! /bin/sh

PATH=/sbin:/bin:/usr/bin

mac2ip ()
{
let ip_a=0x`echo $1 | cut -d: -f 3`
let ip_b=0x`echo $1 | cut -d: -f 4`
let ip_c=0x`echo $1 | cut -d: -f 5`
let ip_d=0x`echo $1 | cut -d: -f 6`
 
IP="$ip_a.$ip_b.$ip_c.$ip_d"
}

do_start () 
{

INTERFACES=`/sbin/ifconfig -a | grep ^eth | sed 's/\s*Link encap:Ethernet\s*HWaddr /-/g'`
rm -f /etc/network/interfaces > /dev/null 2>&1
cat > /etc/network/interfaces << EOF
auto lo
iface lo inet loopback
EOF

for i in $INTERFACES; do
        DEV=`echo $i | cut -d'-' -f 1`
        MAC=`echo $i | cut -d'-' -f 2`
        mac2ip $MAC
        NET=`echo $IP | cut -d'.' -f1,2,3`

cat >> /etc/network/interfaces << EOF
auto $DEV
iface $DEV inet static
  address $IP
  gateway $NET.1
  netmask 255.255.255.0
EOF
done

}

case "$1" in
  start|"")
	do_start
	;;
  restart|reload|force-reload)
	echo "Error: argument '$1' not supported" >&2
	exit 3
	;;
  stop)
	# No-op
	;;
  *)
	echo "Usage: vmcontext.sh [start|stop]" >&2
	exit 3
	;;
esac

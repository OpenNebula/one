#!/bin/bash

if [ -f /mnt/context.sh ]
then
  . /mnt/context.sh
fi


hostname $HOSTNAME
sed -i "s/openSUSE/$HOSTNAME/g" /etc/hosts
echo $HOSTNAME > /etc/HOSTNAME

if [ -n "$IP_PUBLIC" ]; then
	ifconfig eth0 $IP_PUBLIC
fi
 
if [ -n "$NETMASK" ]; then
	ifconfig eth0 netmask $NETMASK
fi


if [ -f /mnt/$ROOT_PUBKEY ]; then
	mkdir -p /root/.ssh
	cat /mnt/$ROOT_PUBKEY >> /root/.ssh/authorized_keys
	chmod -R 600 /root/.ssh/
fi

if [ -n "$USERNAME" ]; then
	useradd -m $USERNAME
	if [ -f /mnt/$USER_PUBKEY ]; then
		mkdir -p /home/$USERNAME/.ssh/
		cat /mnt/$USER_PUBKEY >> /home/$USERNAME/.ssh/authorized_keys
		chown -R $USERNAME:users /home/$USERNAME/.ssh
		chmod -R 600 /home/$USERNAME/.ssh/authorized_keys
	fi
fi

#!/bin/bash

if [ -f /mnt/context/context.sh ]
then
  . /mnt/context/context.sh
fi


echo $HOSTNAME > /etc/HOSTNAME
hostname $HOSTNAME

if [ -n "$IP_PUBLIC" ]; then
	ifconfig eth0 $IP_PUBLIC
fi
 
if [ -n "$NETMASK" ]; then
	ifconfig eth0 netmask $NETMASK
fi


if [ -f /mnt/context/$ROOT_PUBKEY ]; then
	cat /mnt/context/$ROOT_PUBKEY >> /root/.ssh/authorized_keys
fi

if [ -n "$USERNAME" ]; then
	adduser -s /bin/bash -D $USERNAME
	if [ -f /mnt/context/$USER_PUBKEY ]; then
		mkdir -p /home/$USERNAME/.ssh/
		cat /mnt/context/$USER_PUBKEY >> /home/$USERNAME/.ssh/authorized_keys
		chown -R $USERNAME /home/$USERNAME/.ssh
		chmod -R 600 /home/$USERNAME/.ssh
	fi
fi

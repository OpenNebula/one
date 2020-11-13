#!/bin/sh

set -e

#
# functions
#

. /usr/share/one/supervisor/scripts/lib/functions.sh

#
# run service
#

for envfile in \
    /etc/crypto-policies/back-ends/opensshserver.config \
    /etc/sysconfig/sshd \
    ;
do
    if [ -f "$envfile" ] ; then
        . "$envfile"
    fi
done

msg "Service started!"
exec /usr/sbin/sshd -D $OPTIONS $CRYPTO_POLICY

#!/bin/sh

set -e

#
# functions
#

. /usr/share/one/supervisor/scripts/lib/functions.sh

#
# run service
#

msg "Service started!"
exec /usr/bin/stunnel /etc/stunnel/stunnel.conf

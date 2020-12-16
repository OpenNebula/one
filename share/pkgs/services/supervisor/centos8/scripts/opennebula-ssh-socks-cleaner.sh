#!/bin/sh

set -e

#
# functions
#

. /usr/share/one/supervisor/scripts/lib/functions.sh

#
# run service
#

# emulate timer from systemd
msg "Service started!"
while sleep 30 ; do
    /usr/lib/one/sh/ssh-socks-cleaner 2>&1
done


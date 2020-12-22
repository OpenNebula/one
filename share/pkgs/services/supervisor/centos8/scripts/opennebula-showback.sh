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
while sleep 1d ; do
    # update showback once a day
    /usr/bin/oneshowback calculate 2>&1
done

exit $?

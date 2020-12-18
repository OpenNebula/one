#!/bin/sh

set -e

#
# functions
#

. /usr/share/one/supervisor/scripts/lib/functions.sh

#
# dependencies
#

# emulate dependency
for _requisite in \
    opennebula-ssh-agent \
    ;
do
    if ! is_running "$_requisite" ; then
        supervisorctl start "$_requisite"
    fi
done

#
# run service
#

for envfile in \
    /var/run/one/ssh-agent.env \
    /etc/default/supervisor/onehem \
    ;
do
    if [ -f "$envfile" ] ; then
        . "$envfile"
    fi
done

export SSH_AUTH_SOCK

msg "Service started!"
exec /usr/bin/ruby /usr/lib/one/onehem/onehem-server.rb

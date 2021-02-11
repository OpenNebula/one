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

# wait for ssh-agent to start
msg "Wait for ssh-agent (/var/run/one/ssh-agent.env)..."
if ! wait_for_file "/var/run/one/ssh-agent.env" ; then
    err "Timeout!"
    exit 1
fi

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

msg "Rotate log to start with an empty one"
/usr/sbin/logrotate -s /var/lib/one/.logrotate.status \
    -f /etc/logrotate.d/opennebula-hem || true

msg "Service started!"
exec /usr/bin/ruby /usr/lib/one/onehem/onehem-server.rb

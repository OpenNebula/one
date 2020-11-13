#!/bin/sh

set -e

#
# functions
#

. /usr/share/one/supervisor/scripts/lib/functions.sh

#
# run service
#

SSH_AUTH_SOCK=/var/run/one/ssh-agent.sock
export SSH_AUTH_SOCK

echo "SSH_AUTH_SOCK=${SSH_AUTH_SOCK}" > /var/run/one/ssh-agent.env

# emulate ExecStartPost from systemd service unit
if is_running opennebula-ssh-add ; then
    supervisorctl stop opennebula-ssh-add
fi
# opennebula-ssh-add will wait until the socket emerges
rm -f "$SSH_AUTH_SOCK"
supervisorctl start opennebula-ssh-add

msg "Service started!"
exec /usr/bin/ssh-agent -D -a "$SSH_AUTH_SOCK"

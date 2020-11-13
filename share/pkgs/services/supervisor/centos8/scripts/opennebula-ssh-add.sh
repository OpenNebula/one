#!/bin/sh

set -e

# give up after two minutes
TIMEOUT=120

#
# functions
#

. /usr/share/one/supervisor/scripts/lib/functions.sh

#
# run service
#

for envfile in \
    /var/run/one/ssh-agent.env \
    ;
do
    if [ -f "$envfile" ] ; then
        . "$envfile"
    fi
done

if [ -z "${SSH_AUTH_SOCK}" ] ; then
    err "Socket variable is unset ('SSH_AUTH_SOCK')"
    exit 1
fi

export SSH_AUTH_SOCK

# wait for ssh-agent socket
msg "Wait for ssh-agent (${SSH_AUTH_SOCK})..."
if ! wait_for_ssh_agent ; then
    err "Timeout!"
    exit 1
fi

msg "SSH agent is running - continue"

# just in case delete the keys if any found
/usr/bin/ssh-add -D

# add keys
/usr/bin/ssh-add

# TODO: either this or dealing with a service in EXITED status
msg "Service finished! (entered infinity sleep)"
exec /bin/sleep infinity

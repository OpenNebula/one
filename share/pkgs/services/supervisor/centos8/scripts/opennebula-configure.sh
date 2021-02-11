#!/bin/sh

set -e

# give up after two minutes
TIMEOUT=120

#
# functions
#

. /usr/share/one/supervisor/scripts/lib/functions.sh
. /usr/share/one/supervisor/scripts/lib/oned-functions.sh

#
# run service
#

for envfile in \
    /etc/default/supervisor/oned \
    ;
do
    if [ -f "$envfile" ] ; then
        . "$envfile"
    fi
done

# wait for oned
msg "Wait for oned process..."
if ! wait_for_oned "${ONED_ENDPOINT}" ; then
    err "Timeout!"
    exit 1
fi

msg "Start OpenNebula post-run configuration - oned is running"

# update the default zone endpoint or leave the default if variable is empty
if [ -n "${ONED_ENDPOINT}" ] ; then
    msg "Set the default zone endpoint to: ${ONED_ENDPOINT}"
    update_default_zone "${ONED_ENDPOINT}"
fi

# TODO: change requires restart of oned and other services - using the event
# mechanics of supervisor could solve this elegantly or inotify workaround
#
# update the oneadmin's password
#if [ -n "${ONEADMIN_PASSWORD}" ] ; then
#    msg "Set oneadmin's password"
#    update_oneadmin_password "${ONEADMIN_USERNAME:-oneadmin}" \
#        "${ONEADMIN_PASSWORD}"
#fi

# NOTE: the last action is to run user's post-run configuration if provided

# execute the custom batch file
if [ -n "${OPENNEBULA_BATCH_FILE}" ] \
    && [ -f "${OPENNEBULA_BATCH_FILE}" ] \
    && [ -x "${OPENNEBULA_BATCH_FILE}" ] ;
then
    msg "Running user's custom batch file: ${OPENNEBULA_BATCH_FILE}"
    "${OPENNEBULA_BATCH_FILE}"
fi

# TODO: either this or dealing with a service in EXITED status
msg "Service finished! (entered infinity sleep)"
exec /bin/sleep infinity

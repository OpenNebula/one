#!/bin/sh

# here are functions usable only after the oned process is running

update_default_zone()
{
    _endpoint="${1}"

    # is change required?
    if [ -z "${1}" ] ; then
        return 0
    fi

    # prepare the update file
    _tmp_file=$(mktemp "/tmp/onezone-endpoint.XXXX")
    cat > "${_tmp_file}" <<EOF
ENDPOINT="${_endpoint}"
EOF

    # TODO: find the correct zone id
    onezone update 0 -a "${_tmp_file}"

    # remove the temp file
    rm -f "${_tmp_file}"
}

# TODO: change requires restart of other services
update_oneadmin_password()
{
    _username="${1:-oneadmin}"
    _password="${2}"

    # is change required / password provided?
    if [ -z "${_password}" ] ; then
        return 0
    fi

    _old_auth=$(cat /var/lib/one/.one/one_auth)

    # was it changed?
    if [ "$_old_auth" = "${_username}:${_password}" ] ; then
        # no...do nothing
        return 0
    fi

    # otherwise setup a new password
    # TODO: find the correct id or use the username?
    oneuser passwd 0 "${_password}"

    # do not forget to update the change in one_auth
    echo "${_username}:${_password}" \
        > /var/lib/one/.one/one_auth

    # after the change you must restart oned
    supervisorctl restart opennebula
}

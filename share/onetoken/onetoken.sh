onetokenset(){
    local PASSWORD

    if [ -n "$PASSWORD_ARG" ]; then
        PASSWORD=$1
        shift
    fi

    USER=$1
    shift

    if [ -z "$USER" -o "${USER:0:1}" = "-" ]; then
        echo "Usage: onetokenset <user> [options]" >&2
        echo "  Any option understood by 'oneuser token-set' is valid." >&2
        return 1
    fi

    if [ -z "$PASSWORD" ]; then
        echo -n "Password: "
        stty -echo
        read PASSWORD
        stty echo
        echo
    fi

    OUT=$(echo "$PASSWORD" | oneuser token-set --stdin_password $USER $*)

    if echo $OUT | grep -q export; then
        eval "$OUT"

        echo "Token loaded."
        return 0
    else
        echo $OUT
        return 1
    fi
}

onetokencreate(){
    local PASSWORD PASSWORD_ARG

    USER=$1

    if [ -z "$USER" ]; then
        echo "Usage: onetokencreate <user> [options]" >&2
        echo "  Any option understood by 'oneuser token-create' is valid." >&2
        return 1
    fi

    shift

    echo -n "Password: "
    stty -echo
    read PASSWORD
    stty echo
    echo

    OUT=$(echo "$PASSWORD" | oneuser token-create --stdin_password $USER $*)
    echo $OUT

    if echo $OUT | grep -q "Authentication Token"; then
        TOKEN=$(echo $OUT|tail -n1|cut -d: -f2)
        if [ -n "$TOKEN" ]; then
            PASSWORD_ARG=true onetokenset $PASSWORD $USER --token $TOKEN
        else
            echo "Invalid token."
            return 1
        fi
    else
        return 1
    fi
}

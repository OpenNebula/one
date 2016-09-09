onetokenset(){
    USER=$1
    TOKEN=$2
    PASSWORD=$3

    if [ -z "$USER" -o -z "$TOKEN" ]; then
        echo "Usage: $0 <id|user> <token> [<password>]" >&2
        exit 1
    fi

    if [ -z "$PASSWORD" ]; then
        echo -n "Password: "
        stty -echo
        read PASSWORD
        stty echo
        echo
    fi

    OUT=$(echo "$PASSWORD" | oneuser token-set --stdin_password $USER $TOKEN)

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
    USER=$1

    if [ -z "$USER" ]; then
        echo "Usage: $0 <id|user>" >&2
        exit 1
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
            onetokenset $USER $TOKEN $PASSWORD
        else
            echo "Invalid token."
            return 1
        fi
    else
        return 1
    fi
}

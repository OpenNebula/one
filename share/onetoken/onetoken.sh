onetokenset(){
    OUT=$(oneuser token --set $1)

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
    echo -n "Password: "
    stty -echo
    read password
    stty echo
    echo

    OUT=$(echo "$password" | oneuser token --create --stdin_password $*)
    echo $OUT

    if echo $OUT | grep -q "Authentication Token"; then
        TOKEN=$(echo $OUT|tail -n1|cut -d: -f2)
        if [ -n "$TOKEN" ]; then
            onetokenset $TOKEN
        else
            echo "Invalid token."
            return 1
        fi
    else
        return 1
    fi
}

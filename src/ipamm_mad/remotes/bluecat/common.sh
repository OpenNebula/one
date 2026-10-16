#!/bin/bash

# Shared helpers for the BlueCat IPAM driver action scripts.

BLUECAT_CONFIG="${BLUECAT_CONFIG:-/etc/one/bluecat_ipam.conf}"
BLUECAT_LOG="${BLUECAT_LOG:-/tmp/bluecat-ipam.log}"

bluecat_log() {
    printf '%s\n' "$*" >> "$BLUECAT_LOG"
}

bluecat_log_block() {
    {
        printf '===== %s %s =====\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$1"
        shift
        printf '%s\n' "$@"
        printf '\n'
    } >> "$BLUECAT_LOG"
}

bluecat_log_decoded_action() {
    {
        printf '%s\n' '--- decoded XML ---'
        printf '%s' "$DRV_ACTION" | base64 -d 2>/dev/null \
            || printf '%s\n' '<failed to decode driver action>'
        printf '\n'
    } >> "$BLUECAT_LOG"
}

bluecat_fail() {
    bluecat_log "ERROR: $1"
    echo "-1"
    exit 1
}

bluecat_load_config() {
    if [ ! -r "$BLUECAT_CONFIG" ]; then
        bluecat_fail "Missing or unreadable BlueCat config: $BLUECAT_CONFIG"
    fi

    # shellcheck source=/etc/one/bluecat_ipam.conf
    . "$BLUECAT_CONFIG" \
        || bluecat_fail "Failed to source BlueCat config: $BLUECAT_CONFIG"

    BLUECAT_MOCK="${BLUECAT_MOCK:-no}"
    BLUECAT_VERIFY_TLS="${BLUECAT_VERIFY_TLS:-yes}"
    BLUECAT_URL="${BLUECAT_URL%/}"

    case "$BLUECAT_VERIFY_TLS" in
        yes|no) ;;
        *) bluecat_fail "BLUECAT_VERIFY_TLS must be yes or no" ;;
    esac
}

bluecat_require_command() {
    command -v "$1" >/dev/null 2>&1 \
        || bluecat_fail "Missing required command: $1"
}

bluecat_require_api_credentials() {
    [ -n "$BLUECAT_URL" ] \
        || bluecat_fail "Missing BLUECAT_URL in $BLUECAT_CONFIG"

    [ -n "$BLUECAT_USER" ] \
        || bluecat_fail "Missing BLUECAT_USER in $BLUECAT_CONFIG"

    [ -n "$BLUECAT_PASS" ] \
        || bluecat_fail "Missing BLUECAT_PASS in $BLUECAT_CONFIG"
}

bluecat_require_real_api_config() {
    bluecat_require_api_credentials
    bluecat_require_command curl
    bluecat_require_command jq
}

bluecat_create_session() {
    local payload response rc
    local -a curl_args

    bluecat_require_real_api_config

    payload=$(jq -cn --arg username "$BLUECAT_USER" --arg password "$BLUECAT_PASS" '{username:$username,password:$password}')
    curl_args=(-fsS)
    [ "$BLUECAT_VERIFY_TLS" = "no" ] && curl_args+=(-k)

    response=$(curl "${curl_args[@]}" -H "Content-Type: application/json" -X POST -d "$payload" "$BLUECAT_URL/api/v2/sessions" 2>/dev/null)
    rc=$?
    if [ "$rc" -ne 0 ]; then
        bluecat_log "BlueCat REST v2 session creation failed (curl rc $rc)"
        return 1
    fi

    BLUECAT_AUTH_CREDENTIALS=$(printf '%s' "$response" | jq -r '.basicAuthenticationCredentials // empty')
    if [ -z "$BLUECAT_AUTH_CREDENTIALS" ]; then
        bluecat_log "BlueCat login response did not contain basicAuthenticationCredentials"
        return 1
    fi
}

bluecat_sanitize_error_body() {
    jq -c \
        --arg password "$BLUECAT_PASS" \
        --arg credential "$BLUECAT_AUTH_CREDENTIALS" '
        def redact_values:
            if type == "object" then
                with_entries(
                    if (.key | test("password|token|authorization|credential|secret"; "i")) then
                        .value = "<redacted>"
                    else
                        .value |= redact_values
                    end)
            elif type == "array" then map(redact_values)
            elif type == "string" then
                (if $password == "" then . else split($password) | join("<redacted>") end) |
                (if $credential == "" then . else split($credential) | join("<redacted>") end)
            else .
            end;
        redact_values' 2>/dev/null
}

bluecat_api() {
    local method="$1" endpoint="$2" rc http_status response_file error_body
    local -a curl_args
    shift 2

    [ -n "$BLUECAT_AUTH_CREDENTIALS" ] || bluecat_create_session || return 1
    response_file=$(mktemp) || {
        bluecat_log "BlueCat REST v2 $method $endpoint failed to create response buffer"
        return 1
    }

    curl_args=(-sS)
    [ "$BLUECAT_VERIFY_TLS" = "no" ] && curl_args+=(-k)

    http_status=$(curl "${curl_args[@]}" \
        -X "$method" \
        -H "Authorization: Basic $BLUECAT_AUTH_CREDENTIALS" \
        -H "Accept: application/hal+json" \
        "$@" \
        -o "$response_file" \
        -w '%{http_code}' \
        "${BLUECAT_URL}${endpoint}" 2>/dev/null)
    rc=$?

    if [ "$rc" -ne 0 ] || [ "$http_status" -lt 200 ] 2>/dev/null || [ "$http_status" -ge 300 ] 2>/dev/null; then
        bluecat_log "BlueCat REST v2 $method $endpoint failed (curl rc $rc, HTTP ${http_status:-unknown})"
        error_body=$(bluecat_sanitize_error_body < "$response_file")
        [ -z "$error_body" ] || bluecat_log "BlueCat error response: $error_body"
        rm -f -- "$response_file"
        return 1
    fi

    cat "$response_file"
    rm -f -- "$response_file"
}

bluecat_api_get() { bluecat_api GET "$@"; }
bluecat_api_post() { bluecat_api POST "$1" -H "Content-Type: application/hal+json" -d "$2"; }
bluecat_api_put() { bluecat_api PUT "$1" -H "Content-Type: application/hal+json" -d "$2"; }
bluecat_api_delete() { bluecat_api DELETE "$@"; }

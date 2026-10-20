#!/bin/bash
set -e

# Default File Paths
CA_CRT="/etc/one/ovirtapi-ssl-CA.crt"
CA_KEY="/etc/one/ovirtapi-ssl-CA.key"
HOST_CRT="/etc/one/ovirtapi-ssl.crt"
HOST_KEY="/etc/one/ovirtapi-ssl.key"
HOSTNAME_ARG=""

# Usage/Help function
usage() {
    echo "Usage: $0 -n HOSTNAME [-c CA_CRT] [-k CA_KEY] [-C HOST_CRT] [-K HOST_KEY]"
    echo "  -n  Hostname/CN (Required)"
    echo "  -c  Path to CA certificate   (Default: $CA_CRT)"
    echo "  -k  Path to CA key           (Default: $CA_KEY)"
    echo "  -C  Path to Host certificate (Default: $HOST_CRT)"
    echo "  -K  Path to Host key         (Default: $HOST_KEY)"
    exit 1
}

# Parse input options
while getopts "n:c:k:C:K:h" opt; do
    case "$opt" in
        n) HOSTNAME_ARG="$OPTARG" ;;
        c) CA_CRT="$OPTARG" ;;
        k) CA_KEY="$OPTARG" ;;
        C) HOST_CRT="$OPTARG" ;;
        K) HOST_KEY="$OPTARG" ;;
        h|*) usage ;;
    esac
done

# 1. Validate mandatory parameter
if [ -z "$HOSTNAME_ARG" ]; then
    echo "Error: Hostname (-n) is required!"
    usage
fi

# Dynamic temporary paths based on hostname
CSR_FILE="/tmp/${HOSTNAME_ARG}_host.csr"
CONF_FILE="/tmp/${HOSTNAME_ARG}_cert.cnf"

# 2. Verify CA files exist
if [ ! -f "$CA_CRT" ] || [ ! -f "$CA_KEY" ]; then
    echo "Error: CA files $CA_CRT or $CA_KEY not found!"
    exit 1
fi

echo "==> Creating OpenSSL config for $HOSTNAME_ARG with SAN extensions..."
cat <<EOF > "$CONF_FILE"
[req]
default_bits       = 2048
prompt             = no
default_md         = sha256
distinguished_name = req_distinguished_name
req_extensions     = req_ext

[req_distinguished_name]
C  = US
ST = State
L  = City
O  = Organization
OU = IT
CN = ${HOSTNAME_ARG}

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${HOSTNAME_ARG}
DNS.2 = localhost
IP.1  = 10.0.1.37
IP.2  = 127.0.0.1
EOF

echo "==> Generating Host Private Key and CSR..."
openssl req -new -nodes \
    -out "$CSR_FILE" \
    -keyout "$HOST_KEY" \
    -config "$CONF_FILE"

echo "==> Signing Certificate with CA..."
openssl x509 -req \
    -in "$CSR_FILE" \
    -CA "$CA_CRT" \
    -CAkey "$CA_KEY" \
    -CAcreateserial \
    -out "$HOST_CRT" \
    -days 3650 \
    -sha256 \
    -extfile "$CONF_FILE" \
    -extensions req_ext

echo "==> Setting file permissions..."
chmod 600 "$HOST_KEY"
chmod 644 "$HOST_CRT"

echo "==> Cleaning up temporary files..."
rm -f "$CSR_FILE" "$CONF_FILE"

echo "==> Verifying certificate SANs:"
openssl x509 -in "$HOST_CRT" -noout -text | grep -A 2 "Subject Alternative Name"

echo "==> Reloading Nginx..."
nginx -t && systemctl reload nginx

echo "==> Certificate successfully generated for $HOSTNAME_ARG at:"
echo "    Key: $HOST_KEY"
echo "    Cert: $HOST_CRT"
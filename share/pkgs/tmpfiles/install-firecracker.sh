#!/bin/sh

set -e

version="v0.21.1"

# Download version version of Firecracker
curl -LOJ https://github.com/firecracker-microvm/firecracker/releases/download/${version}/firecracker-${version}-$(uname -m)
mv firecracker-${version}-$(uname -m) /usr/bin/firecracker
chmod +x /usr/bin/firecracker


# Download version version of jailer
curl -LOJ https://github.com/firecracker-microvm/firecracker/releases/download/${version}/jailer-${version}-$(uname -m)
mv jailer-${version}-$(uname -m) /usr/bin/jailer
chmod +x /usr/bin/jailer

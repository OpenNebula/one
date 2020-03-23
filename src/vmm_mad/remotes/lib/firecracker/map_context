#!/bin/bash

# Simple conversion script of ISO 9660 image into image based
# on ext2/3/4 filesytem. Completely unprivileged, without needing
# to mount both images. Free to use under Apache 2.0 License.
# 2020, Vlastimil Holer <vlastimil.holer@gmail.com>

export PATH=/usr/sbin:$PATH

set -e -o pipefail

TYPE=${TYPE:-ext4}
LABEL=${LABEL:-CONTEXT}
DISK_SRC=$1
DISK_DST=${2:-${DISK_SRC}.${TYPE}}

if [ -z "${DISK_SRC}" ]; then
    echo "SYNTAX: $0 <source image> [<dest. image>]" >&2
    exit 1
fi

if ! [ -f "${DISK_SRC}" ]; then
    echo "ERROR: File '${DISK_SRC}' not found" >&2
    exit 1
fi

###

NEW_EXTR=$(mktemp "${DISK_SRC}.XXXXXX" -d)
NEW_DISK=$(mktemp "${DISK_SRC}.XXXXXX")
NEW_DBFS=$(mktemp "${DISK_SRC}.XXXXXX")
chmod go-rwx "${NEW_EXTR}" "${NEW_DISK}" "${NEW_DBFS}"

trap 'rm -rf "${NEW_EXTR}" "${NEW_DISK}" "${NEW_DBFS}"' EXIT TERM INT HUP

debugfs_do()
{
    echo "${1}" >> "${NEW_DBFS}"
}

###

# unpack ISO file
bsdtar -xf "${DISK_SRC}" -C "${NEW_EXTR}"
find "${NEW_EXTR}" -mindepth 1 -exec chmod u+w,go+r {} \;

# create image with extX filesystem
NEW_SIZE=$(du -sk "${NEW_EXTR}" 2>/dev/null | cut -f1)
dd if=/dev/zero of="${NEW_DISK}" bs=1024 seek="$((NEW_SIZE + 1000))" count=1 status=none
mkfs -F -q -t "${TYPE}" -L "${LABEL}" "${NEW_DISK}"
tune2fs -c0 -i0 -r0 "${NEW_DISK}" >/dev/null

# generate debugfs script
while IFS= read -r -d $'\0' F; do
    REL_F=${F#${NEW_EXTR}/}
    DN=$(dirname  "${REL_F}")
    BN=$(basename "${REL_F}")

    debugfs_do "cd /${DN}"

    if [ -f "${F}" ]; then
        debugfs_do "write ${F} ${BN}"
    elif [ -d "${F}" ]; then
        debugfs_do "mkdir ${BN}"
    else
        echo "ERROR: Unsupported file type of '${REL_F}'" >&2
        exit 1
    fi
done < <(find "${NEW_EXTR}" -mindepth 1 -print0)

# run debugfs and apply prepared script
OUT=$(debugfs -w "${NEW_DISK}" -f "${NEW_DBFS}" 2>&1 >/dev/null)

# error in debugfs run is mainly detected by nearly empty output,
# which has only debugfs welcome banner and no other messages
if [ "$(echo "${OUT}" | wc -l)" -ne 1 ] || ! [[ "${OUT}" =~ ^debugfs ]]; then
    echo "ERROR: Failed to convert ISO into ${TYPE} image due to error:" >&2
    echo "${OUT}" >&2
    exit 1
fi

# success!
mv -f "${NEW_DISK}" "${DISK_DST}"

exit 0

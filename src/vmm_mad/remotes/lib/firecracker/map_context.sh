#!/bin/bash

MAP_PATH=""
SYSDS_PATH=""
CONTEXT_PATH=""
ROOTFS_ID=""
VM_ID=""

while getopts ":m:s:c:r:v:" opt; do
    case $opt in
        m) MAP_PATH="$OPTARG" ;;
        s) SYSDS_PATH="$OPTARG" ;;
        c) CONTEXT_PATH="$OPTARG" ;;
        r) ROOTFS_ID="$OPTARG" ;;
        v) VM_ID="$OPTARG" ;;
    esac
done

shift $(($OPTIND - 1))

echo "$MAP_PATH"
echo "$SYSDS_PATH"
echo "$CONTEXT_PATH"
echo "$ROOTFS_ID"
echo "$VM_ID"

if [ -z "$MAP_PATH" ] || [ -z "$SYSDS_PATH" ] || [ -z "$CONTEXT_PATH" ] || [ -z "$ROOTFS_ID" ] || [ -z "$VM_ID" ]; then
    exit -1
fi

# Create temporary directories
mkdir "$MAP_PATH"
mkdir "$MAP_PATH/context"
mkdir "$MAP_PATH/fs"

# Mount rootfs
mount "/$SYSDS_PATH/$VM_ID/disk.$ROOTFS_ID" "$MAP_PATH/fs"

# Mount context disk
mount "$CONTEXT_PATH" "$MAP_PATH/context"

# Create /context directory inside rootfs
if [ ! -d "$MAP_PATH/fs/context" ]; then
    mkdir "$MAP_PATH/fs/context"
fi

# Copy context information
cp $MAP_PATH/context/* "$MAP_PATH/fs/context"

# Clean temporary directories
umount "$MAP_PATH/fs"
umount "$MAP_PATH/context"
rm -rf "$MAP_PATH"

exit 0
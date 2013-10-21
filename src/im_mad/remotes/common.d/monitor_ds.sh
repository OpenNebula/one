#!/bin/bash

#Arguments: hypervisor ds_location collectd_port host_id hostname
HYPERVISOR=$1
DATASTORE_LOCATION=${2:-"/var/lib/one/datastores"}

LVM_VG_PREFIX="vg-one-"
LVM_SIZE_CMD="sudo vgdisplay --separator : --units m -o vg_size,vg_free --nosuffix --noheadings -C"

USED_MB=$(du -sLm $DATASTORE_LOCATION 2>/dev/null | cut -f1)
TOTAL_MB=$(df -B1M -P $DATASTORE_LOCATION 2>/dev/null | tail -n 1 | awk '{print $2}')
FREE_MB=$(df -B1M -P $DATASTORE_LOCATION 2>/dev/null | tail -n 1 | awk '{print $4}')

echo "DS_LOCATION_USED_MB=$USED_MB"
echo "DS_LOCATION_TOTAL_MB=$TOTAL_MB"
echo "DS_LOCATION_FREE_MB=$FREE_MB"

dirs=$(ls $DATASTORE_LOCATION)

for ds in $dirs; do
    echo $ds | grep -q -E '^[0123456789]+$' || continue

    dir=$DATASTORE_LOCATION/$ds

    USED_MB=$(du -sLm $dir 2>/dev/null | cut -f1)
    TOTAL_MB=$(df -B1M -P $dir 2>/dev/null | tail -n 1 | awk '{print $2}')
    FREE_MB=$(df -B1M -P $dir 2>/dev/null | tail -n 1 | awk '{print $4}')

    LVM_SIZE=$($LVM_SIZE_CMD ${LVM_VG_PREFIX}${ds} 2>/dev/null)
    LVM_STATUS=$?

    echo "DS = ["
    echo "  ID = $ds,"

    if [ $LVM_STATUS = 0 ]; then
        LVM_TOTAL=$(echo $LVM_SIZE | cut -d: -f1 | sed 's/\..*//')
        LVM_FREE=$(echo $LVM_SIZE | cut -d: -f2 | sed 's/\..*//')
        LVM_USED=$(( $LVM_TOTAL - $LVM_FREE ))

        echo "  USED_MB = $LVM_USED,"
        echo "  TOTAL_MB = $LVM_TOTAL,"
        echo "  FREE_MB = $LVM_FREE,"
        echo "  VOLATILE_USED_MB = $USED_MB,"
        echo "  VOLATILE_TOTAL_MB = $TOTAL_MB,"
        echo "  VOLATILE_FREE_MB = $FREE_MB"
    else
        echo "  USED_MB = $USED_MB,"
        echo "  TOTAL_MB = $TOTAL_MB,"
        echo "  FREE_MB = $FREE_MB"
    fi

    echo "]"
done

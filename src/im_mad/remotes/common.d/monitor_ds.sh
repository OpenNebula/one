#!/bin/bash

#Arguments: hypervisor ds_location collectd_port monitor_push_period host_id hostname
HYPERVISOR=$1
DATASTORE_LOCATION=${2:-"/var/lib/one/datastores"}

LVM_VG_PREFIX="vg-one-"

PATH=$PATH:/sbin:/bin:/usr/sbin:/usr/bin which vgdisplay &> /dev/null

if [ $? == 0 ]; then
    LVM_SIZE_CMD="sudo vgdisplay --separator : --units m -o vg_size,vg_free --nosuffix --noheadings -C"
fi

mkdir -p "$DATASTORE_LOCATION"

USED_MB=$(du -sLm $DATASTORE_LOCATION 2>/dev/null | cut -f1)
TOTAL_MB=$(df -B1M -P $DATASTORE_LOCATION 2>/dev/null | tail -n 1 | awk '{print $2}')
FREE_MB=$(df -B1M -P $DATASTORE_LOCATION 2>/dev/null | tail -n 1 | awk '{print $4}')

USED_MB=${USED_MB:-"0"}
TOTAL_MB=${TOTAL_MB:-"0"}
FREE_MB=${FREE_MB:-"0"}

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

    USED_MB=${USED_MB:-"0"}
    TOTAL_MB=${TOTAL_MB:-"0"}
    FREE_MB=${FREE_MB:-"0"}

    if [ -n "$LVM_SIZE_CMD" ]; then
        LVM_SIZE=$($LVM_SIZE_CMD ${LVM_VG_PREFIX}${ds} 2>/dev/null)
        LVM_STATUS=$?
    else
        LVM_STATUS=255
    fi

    echo "DS = ["
    echo "  ID = $ds,"

    if [ $LVM_STATUS = 0 ]; then
        LVM_TOTAL=$(echo $LVM_SIZE | cut -d: -f1 | sed 's/\..*//')
        LVM_FREE=$(echo $LVM_SIZE | cut -d: -f2 | sed 's/\..*//')
        LVM_USED=$(( $LVM_TOTAL - $LVM_FREE ))

        LVM_TOTAL=${LVM_TOTAL:-"0"}
        LVM_FREE=${LVM_FREE:-"0"}
        LVM_USED=${LVM_USED:-"0"}

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

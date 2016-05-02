#!/bin/bash

#Arguments: hypervisor ds_location collectd_port monitor_push_period host_id hostname
HYPERVISOR=$1
DATASTORE_LOCATION=${2:-"/var/lib/one/datastores"}

mkdir -p "$DATASTORE_LOCATION"

USED_MB=$(df -B1M -P $DATASTORE_LOCATION 2>/dev/null | tail -n 1 | awk '{print $3}')
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

    USED_MB=$(df -B1M -P $dir 2>/dev/null | tail -n 1 | awk '{print $3}')
    TOTAL_MB=$(df -B1M -P $dir 2>/dev/null | tail -n 1 | awk '{print $2}')
    FREE_MB=$(df -B1M -P $dir 2>/dev/null | tail -n 1 | awk '{print $4}')

    USED_MB=${USED_MB:-"0"}
    TOTAL_MB=${TOTAL_MB:-"0"}
    FREE_MB=${FREE_MB:-"0"}

    echo "DS = ["
    echo "  ID = $ds,"
    echo "  USED_MB = $USED_MB,"
    echo "  TOTAL_MB = $TOTAL_MB,"
    echo "  FREE_MB = $FREE_MB"
    echo "]"

    # Skip if datastore is not marked for monitoring (ssh)
    [ -e "${dir}/.monitor" ] || continue

    vms=$(ls "$dir" | grep '^[0-9]\+$')

    for vm in $vms; do
        vmdir="${dir}/${vm}"
        disks=$(ls "$vmdir" | grep '^disk\.[0-9]\+$')

        [ -z "$disks" ] && continue

        echo -n "VM=[ID=$vm,POLL=\""

        for disk in $disks; do
            disk_id="$(echo "$disk" | cut -d. -f2)"
            disk_size="$(du -mL "${vmdir}/${disk}" | awk '{print $1}')"
            snap_dir="${vmdir}/${disk}.snap"

            echo -n "DISK_SIZE=[ID=${disk_id},SIZE=${disk_size}] "

            if [ -e "$snap_dir" ]; then
                snaps="$(ls "$snap_dir" | grep '^[0-9]$')"

                for snap in $snaps; do
                    snap_size="$(du -mL "${snap_dir}/${snap}" | awk '{print $1}')"
                    echo -n "SNAPSHOT_SIZE=[ID=${snap},DISK_ID=${disk_id},SIZE=${snap_size}] "
                done
            fi
        done

        echo "\"]"
    done
done

#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

# Helpers for host live migration of fs_lvm_ssh thin volumes.
# Source after tm_common.sh, with the migration arguments and TEMPLATE_64 set.

# Detect thin-volume host live migration and initialize domain/device variables.
# No arguments; reads TEMPLATE_64, DRIVER_PATH and the migration argument variables.
function fs_lvm_migration_init
{
    local xpath="${DRIVER_PATH}/../../datastore/xpath.rb"
    local -a values=()
    local value thin disk_id original_ds
    local has_thin=false

    while IFS= read -r -d '' value; do
        values+=("$value")
    done < <(set -o pipefail; printf '%s' "$TEMPLATE_64" | base64 -d | "$xpath" --stdin \
        /VM/LCM_STATE /VM/DEPLOY_ID \
        '%m%/VM/TEMPLATE/DISK[TM_MAD="fs_lvm_ssh"]/LVM_THIN_ENABLE' \
        '%m%/VM/TEMPLATE/DISK[TM_MAD="fs_lvm_ssh"]/DISK_ID')

    local xpath_pid=$!
    wait "$xpath_pid" || { echo 'Cannot read fs_lvm_ssh migration XML' >&2; exit 1; }

    FS_LVM_LIVE_MIGRATION=false

    [ "$SRC_HOST" != "$DST_HOST" ] && [ "${values[0]}" = '4' ] || return 0

    for thin in ${values[2]}; do
        if [ "${thin,,}" = 'yes' ]; then
            has_thin=true
            break
        fi
    done

    $has_thin || return 0

    # Get the full VM history
    IFS= read -r -d '' original_ds < <(set -o pipefail; onevm show -x "$VMID" | \
        "$xpath" --stdin '/VM/HISTORY_RECORDS/HISTORY[last()-1]/DS_ID')

    local history_pid=$!
    wait "$history_pid" || { echo 'Cannot read fs_lvm_ssh migration history' >&2; exit 1; }

    [ "$original_ds" = "$DSID" ] || return 0

    FS_LVM_LIVE_MIGRATION=true

    [ -n "${values[1]}" ] || { echo 'Missing VM domain ID' >&2; exit 1; }

    source "${DRIVER_PATH}/../../etc/vmm/kvm/kvmrc"

    printf -v FS_LVM_DOMAIN '%q' "${values[1]}"
    printf -v FS_LVM_URI '%q' "${LIBVIRT_URI:-qemu:///system}"
    printf -v FS_LVM_PATH '%q' "$DST_PATH"

    [[ "$DSID" =~ ^[0-9]+$ && "$VMID" =~ ^[0-9]+$ ]] || exit 1

    FS_LVM_DEVICES=()
    for disk_id in ${values[3]}; do
        [[ "$disk_id" =~ ^[0-9]+$ ]] || exit 1
        FS_LVM_DEVICES+=("/dev/vg-one-$DSID/lv-one-$VMID-$disk_id")
    done

    [ "${#FS_LVM_DEVICES[@]}" -gt 0 ] || exit 1
}

# Print a remote script that changes domain state, accepting an already completed action.
# Arguments: virsh action, state requiring the action, state indicating completion.
function fs_lvm_domain_sh
{
    local action=$1
    local expected=$2
    local completed=$3

    cat <<EOF
        set -e -o pipefail
        state=\$(LC_ALL=C virsh -c $FS_LVM_URI domstate $FS_LVM_DOMAIN)
        case "\$state" in
            $expected) virsh -c $FS_LVM_URI $action $FS_LVM_DOMAIN ;;
            $completed) ;;
            *) echo "Cannot $action domain: \$state" >&2; exit 1 ;;
        esac
EOF
}

# Flush source disk writes and thin-pool metadata before destination activation.
# No arguments; uses SRC_HOST and FS_LVM_DEVICES initialized above.
function fs_lvm_flush
{
    local cmd
    cmd=$(cat <<EOF
        set -e -o pipefail
        for device in ${FS_LVM_DEVICES[*]}; do
            $SYNC -- "\$device"
        done
EOF
)

    ssh_exec_and_log "$SRC_HOST" "$cmd" 'Error syncing fs_lvm_ssh disks'
}

# Deactivate the VM's disk volumes, thin pools and pool data/metadata volumes.
# Arguments: Host to clean up; uses FS_LVM_DEVICES initialized above.
function fs_lvm_deactivate
{
    local host=$1
    local cmd

    # Use the XML disk IDs: another TM driver may already have removed the
    # source directory, and a failed premigrate may not have copied it at all.
    cmd=$(cat <<EOF
        set -e -o pipefail

        $SUDO $LVSCAN

        pools=()

        for device in ${FS_LVM_DEVICES[*]}; do
            metadata=\$($SUDO $LVS --noheadings -o vg_name,pool_lv "\$device")
            read -r vg pool <<< "\$metadata"
            [ -z "\$pool" ] || pools+=("\$vg/\$pool")
            $SUDO $LVCHANGE -an "\$device"
        done

        for pool in "\${pools[@]}"; do
            $SUDO $LVCHANGE -an "\$pool"
            $SUDO $LVCHANGE -an "\${pool}_tmeta"
            $SUDO $LVCHANGE -an "\${pool}_tdata"
        done
EOF
)

    ssh_exec_and_log "$host" "$cmd" 'Error deactivating fs_lvm_ssh migration volumes'
}

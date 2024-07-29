# ----------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project (OpenNebula.org), C12G Labs           #
#                                                                               #
# Licensed under the Apache License, Version 2.0 (the "License"); you may       #
# not use this file except in compliance with the License. You may obtain       #
# a copy of the License at                                                      #
#                                                                               #
# http://www.apache.org/licenses/LICENSE-2.0                                    #
#                                                                               #
# Unless required by applicable law or agreed to in writing, software           #
# distributed under the License is distributed on an "AS IS" BASIS,             #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.      #
# See the License for the specific language governing permissions and           #
# limitations under the License.                                                #
#------------------------------------------------------------------------------ #

#--------------------------------------------------------------------------------
# Make a base @snap for image clones
#  @param $1 the volume
#--------------------------------------------------------------------------------
rbd_make_snap() {
    if [ "$(rbd_format $1)" = "2" ]; then
        $RBD info "$1@snap" >/dev/null 2>&1

        if [ "$?" != "0" ]; then
            $RBD snap create  "$1@snap"
            $RBD snap protect "$1@snap"
        fi
    fi
}

#--------------------------------------------------------------------------------
# Remove the base @snap for image clones
#  @param $1 the volume
#  @param $2 (Optional) the snapshot name. If empty it defaults to 'snap'
#--------------------------------------------------------------------------------
rbd_rm_snap() {
    local snap
    snap=${2:-snap}

    if [ "$(rbd_format $1)" = "2" ]; then
        $RBD info "$1@$snap" >/dev/null 2>&1

        if [ "$?" = "0" ]; then
            $RBD snap unprotect "$1@$snap"
            $RBD snap rm "$1@$snap"
        fi
    fi
}

#--------------------------------------------------------------------------------
# Find the snapshot in current volume or any of the snapshot volumes
#   @param $1 volume base, i.e. <pool>/one-<image_id>[-<vm_id>-<disk_id>]
#   @param $2 snapshot id
#   @return volume name, exits if not found
#--------------------------------------------------------------------------------
rbd_find_snap() {
    local rbd_tgt pool vol

    $RBD --format json snap ls $1 2>/dev/null | grep -q "\"name\":\"$2\""

    if [ "$?" = "0" ]; then
        rbd_tgt=$1
    else
        pool=$(echo $1 | cut -f1 -d'/')
        vol=$(echo $1 | cut -f2 -d'/')

        rbd_tgt=$($RBD ls $pool | grep -E "$vol-(.+:)?$2(:|$)")

        if [ -z "${rbd_tgt}" ]; then
            echo "Could not find a volume with snapshot $2" >&2
            exit 1
        fi

        rbd_tgt=$pool/$rbd_tgt
    fi

    echo $rbd_tgt
}

#--------------------------------------------------------------------------------
# Rename the target volume to include the snapshot list or remove it if it has
# no snapshots
#   @param $1 volume base, i.e. <pool>/one-<image_id>[-<vm_id>-<disk_id>]
#   @param $2 volume to rename or remove
#--------------------------------------------------------------------------------
rbd_rename_rm() {
    local snapids

    snapids=$($RBD --format json snap ls $2 | \
           grep -Po '(?<="name":")\d+' | \
           paste -d: -s)

    if [ -z "$snapids" ]; then
        $RBD rm $2
    else
        $RBD rename $2 $1-$snapids
    fi
}

#--------------------------------------------------------------------------------
# Return format of rbd volume
#   @param $1 the volume
#   @return the format of the volume
#--------------------------------------------------------------------------------
rbd_format() {
    $RBD info $1 | sed -n 's/.*format: // p'
}

#--------------------------------------------------------------------------------
# Check if given volume id formta 2, exits otherwise
#   @param $1 the volume
#--------------------------------------------------------------------------------
rbd_check_2() {
    if [ "$(rbd_format $1)" != "2" ]; then
        echo "Only RBD Format 2 is supported for this operation" >&2
        exit 1
    fi
}

#--------------------------------------------------------------------------------
# Remove snapshot suffixes (if exists)
#   @param the volume
#     example: one-2-39-0-0:1:2 or one/one-2-39-0-0:1:2
#   @return volume without snapshot suffixes
#     example: one-2-39-0 or one/one-2-39-0
#--------------------------------------------------------------------------------
trim_snapshot_suffix() {
    echo $1 | sed  's/\([^-]*-[0-9]*-[0-9]*-[0-9]*\).*/\1/'
}

#--------------------------------------------------------------------------------
# Get volume parent volume (if exists)
#   @param the volume including pool in format pool/volume
#   @return parent volume in same format
#--------------------------------------------------------------------------------
rbd_get_parent() {
    parent_snap=$($RBD info $1 | grep parent: | awk '{print $2}')
    echo $parent_snap | sed 's/@.*//' # remove @snap string
}

#--------------------------------------------------------------------------------
# Get top parent of a snapshot hierarchy if the volume has snapshots.
#   @param $1 the volume
#   @return the top parent or volume in no snapshots found
#--------------------------------------------------------------------------------
rbd_top_parent() {
    local volume
    volume=$1 # format: pool/volume; such as one/one-2-38-0
    volume_no_snapshots=$(trim_snapshot_suffix $1)

    while true; do
        parent=$(rbd_get_parent $volume)

        # until there is no parent or the parent is the original image
        # like `one-0` which is not matching the `one-x-y-z` volume pattern
        if echo $parent | grep -q $volume_no_snapshots > /dev/null 2>&1; then
            volume=$parent
        else
            echo $volume
            return 0
        fi
    done

    echo $1
}

#--------------------------------------------------------------------------------
# Remove all the images and snapshots from a given volume
#   if $2 is yes/true the rbd volume is moved to ceph
#   trash instead, before that it is flattend
#
#   @param $1 the volume (or snapshot to delete)
#   @param $2 [yes|no] if move img to ceph trash instead
#--------------------------------------------------------------------------------
rbd_rm_r() {
    local rbd rbd_base children snaps

    rbd=$1
    move_to_trash=$2
    rbd_base=${rbd%%@*}

    if [ "$rbd" != "$rbd_base" ]; then
        children=$($RBD children $rbd 2>/dev/null)

        for child in $children; do
            rbd_rm_r $child
        done

        $RBD snap unprotect $rbd
        $RBD snap rm $rbd
    else
        if [[ $move_to_trash =~ ^(yes|YES|true|TRUE)$ ]]; then
            $RBD flatten $rbd
            $RBD trash move $rbd
        else
            snaps=$($RBD snap ls $rbd 2>/dev/null| awk 'NR > 1 {print $2}')

            for snap in $snaps; do
                rbd_rm_r $rbd@$snap
            done

            $RBD rm $rbd
        fi
    fi
}

#--------------------------------------------------------------------------------
# Parse the output of rbd df in xml format and generates a monitor string for a
# Ceph pool. You **MUST** define XPATH util before using this function
#   @param $1 the xml output of the command
#   @param $2 the pool name
#--------------------------------------------------------------------------------
rbd_df_monitor() {

    local monitor_data i j xpath_elements pool_name
    local quota_bytes free bytes_used stored

    monitor_data=$1
    pool_name=$2

    while IFS= read -r -d '' element; do
        xpath_elements[i++]="$element"
    done < <(echo $monitor_data | $XPATH \
                "/stats/pools/pool[name = \"${pool_name}\"]/stats/quota_bytes" \
                "/stats/pools/pool[name = \"${pool_name}\"]/stats/max_avail" \
                "/stats/pools/pool[name = \"${pool_name}\"]/stats/bytes_used" \
                "/stats/pools/pool[name = \"${pool_name}\"]/stats/stored")

    quota_bytes="${xpath_elements[j++]:-0}"
    free="${xpath_elements[j++]:-0}"
    bytes_used="${xpath_elements[j++]:-0}"
    stored="${xpath_elements[j++]:-0}"

    # https://docs.ceph.com/docs/master/releases/nautilus/
    # ‘BYTES USED’ column renamed to ‘STORED’. Represents amount of data stored by the user.
    [ $stored = "0" ] && stored=$bytes_used

    if [ $quota_bytes -ne 0 ]; then
        if [ $quota_bytes -lt $free ]; then
            export free=$quota_bytes
        fi
    fi

    cat << EOF | tr -d '[:blank:][:space:]'
        USED_MB=$(($stored / 1024**2))\n
        TOTAL_MB=$((($stored + $free) / 1024**2))\n
        FREE_MB=$(($free / 1024**2))\n
EOF
}


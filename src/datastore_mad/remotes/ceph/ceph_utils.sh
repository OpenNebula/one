# ----------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project (OpenNebula.org), C12G Labs           #
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
# Get top parent of a snapshot hierarchy if the volume has snapshots.
#   @param $1 the volume
#   @return the top parent or volume in no snapshots found
#--------------------------------------------------------------------------------
rbd_top_parent() {
    local pool volume vsnaps

    pool=$(echo $1 | cut -f1 -d'/')
    volume=$(echo $1 | cut -f2 -d'/')

    vsnaps=$($RBD ls -p $pool | grep $volume)
    volume=""

    for vol in $vsnaps; do
       $RBD snap ls -p $pool --format json $vol | grep -Eq '"name":"0"'

       if [ $? -eq 0 ]; then
           volume=$pool/$vol
           break
       fi
    done

    if [ -z "$volume" ]; then
        volume=$1
    fi

    echo $volume
}

#--------------------------------------------------------------------------------
# Remove all the images and snapshots from a given volume
#   @param $1 the volume (or snapshot to delete)
#--------------------------------------------------------------------------------
rbd_rm_r() {
    local rbd rbd_base children snaps

    rbd=$1
    rbd_base=${rbd%%@*}

    if [ "$rbd" != "$rbd_base" ]; then
        children=$($RBD children $rbd 2>/dev/null)

        for child in $children; do
            rbd_rm_r $child
        done

        $RBD snap unprotect $rbd
        $RBD snap rm $rbd
    else
        snaps=$($RBD snap ls $rbd 2>/dev/null| awk 'NR > 1 {print $2}')

        for snap in $snaps; do
            rbd_rm_r $rbd@$snap
        done

        $RBD rm $rbd
    fi
}

#--------------------------------------------------------------------------------
# Parse the output of rbd df in xml format and generates a monitor string for a
# Ceph pool. You **MUST** define XPATH util before using this function
#   @param $1 the xml output of the command
#   @param $2 the pool name
#--------------------------------------------------------------------------------
rbd_df_monitor() {

    local monitor_data i j xpath_elements pool_name bytes_used free

    monitor_data=$1
    pool_name=$2

    while IFS= read -r -d '' element; do
        xpath_elements[i++]="$element"
    done < <(echo $monitor_data | $XPATH \
                "/stats/pools/pool[name = \"${pool_name}\"]/stats/bytes_used" \
                "/stats/pools/pool[name = \"${pool_name}\"]/stats/max_avail")

    bytes_used="${xpath_elements[j++]:-0}"
    free="${xpath_elements[j++]:-0}"

    cat << EOF | tr -d '[:blank:][:space:]'
        USED_MB=$(($bytes_used / 1024**2))\n
        TOTAL_MB=$((($bytes_used + $free) / 1024**2))\n
        FREE_MB=$(($free / 1024**2))\n
EOF
}


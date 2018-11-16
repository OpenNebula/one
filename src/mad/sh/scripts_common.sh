# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

export LANG=C

# Paths for utilities
export PATH=/bin:/sbin:/usr/bin:$PATH
AWK=${AWK:-awk}
BASH=${BASH:-bash}
CUT=${CUT:-cut}
CEPH=${CEPH:-ceph}
DATE=${DATE:-date}
DD=${DD:-dd}
DF=${DF:-df}
DU=${DU:-du}
GREP=${GREP:-grep}
ISCSIADM=${ISCSIADM:-iscsiadm}
LVCREATE=${LVCREATE:-lvcreate}
LVREMOVE=${LVREMOVE:-lvremove}
LVCHANGE=${LVCHANGE:-lvchange}
LVSCAN=${LVSCAN:-lvscan}
LVEXTEND=${LVEXTEND:-lvextend}
LVS=${LVS:-lvs}
LN=${LN:-ln}
MD5SUM=${MD5SUM:-md5sum}
MKFS=${MKFS:-mkfs}
MKISOFS=${MKISOFS:-genisoimage}
MKSWAP=${MKSWAP:-mkswap}
QEMU_IMG=${QEMU_IMG:-qemu-img}
RADOS=${RADOS:-rados}
RBD=${RBD:-rbd}
READLINK=${READLINK:-readlink}
RM=${RM:-rm}
CP=${CP:-cp}
SCP=${SCP:-scp}
SED=${SED:-sed}
SSH=${SSH:-ssh}
SUDO=${SUDO:-sudo}
SYNC=${SYNC:-sync}
TAR=${TAR:-tar}
TGTADM=${TGTADM:-tgtadm}
TGTADMIN=${TGTADMIN:-tgt-admin}
TGTSETUPLUN=${TGTSETUPLUN:-tgt-setup-lun-one}
TR=${TR:-tr}
VGDISPLAY=${VGDISPLAY:-vgdisplay}
VMKFSTOOLS=${VMKFSTOOLS:-vmkfstools}
WGET=${WGET:-wget}

if [ "x$(uname -s)" = "xLinux" ]; then
    SED="$SED -r"
else
    SED="/usr/bin/sed -E"
fi

# Used for log messages
SCRIPT_NAME=`basename $0`

# ------------------------------------------------------------------------------
# Path manipulation functions
# ------------------------------------------------------------------------------

# Takes out unneeded slashes. Repeated and final directory slashes:
# /some//path///somewhere/ -> /some/path/somewhere
function fix_dir_slashes
{
    dirname "$1/file" | $SED 's/\/+/\//g'
}

# ------------------------------------------------------------------------------
# Log functions
# ------------------------------------------------------------------------------

# Formats date for logs
function log_date
{
    $DATE +"%a %b %d %T %Y"
}

# Logs a message, alias to log_info
function log
{
    log_info "$1"
}

# Log function that knows how to deal with severities and adds the
# script name
function log_function
{
    echo "$1: $SCRIPT_NAME: $2" 1>&2
}

# Logs an info message
function log_info
{
    log_function "INFO" "$1"
}

# Logs an error message
function log_error
{
    log_function "ERROR" "$1"
}

# Logs a debug message
function log_debug
{
    log_function "DEBUG" "$1"
}

# This function is used to pass error message to the mad
function error_message
{
    (
        echo "ERROR MESSAGE --8<------"
        echo "$1"
        echo "ERROR MESSAGE ------>8--"
    ) 1>&2
}

# Ensures the code is executed exclusively
function exclusive
{
    LOCK_FILE="/var/lock/one/$1"
    TIMEOUT=$2
    shift 2

    ( umask 0027; touch "${LOCK_FILE}" 2>/dev/null )

    # open lockfile
    { exec {FD}>"${LOCK_FILE}"; } 2>/dev/null
    if [ $? -ne 0 ]; then
        log_error "Could not create or open lock ${LOCK_FILE}"
        exit -2
    fi

    # acquire lock
    flock -w "${TIMEOUT}" "${FD}" 2>/dev/null
    if [ $? -ne 0 ]; then
        log_error "Could not acquire exclusive lock on ${LOCK_FILE}"
        exit -2
    fi

    "$@"

    EXEC_RC=$?
    eval "exec ${FD}>&-"
    return $EXEC_RC
}

# Executes a command, if it fails returns error message and exits
# If a second parameter is present it is used as the error message when
# the command fails
function exec_and_log
{
    message=$2

    EXEC_LOG_ERR=`$1 2>&1 1>/dev/null`
    EXEC_LOG_RC=$?

    if [ $EXEC_LOG_RC -ne 0 ]; then
        log_error "Command \"$1\" failed: $EXEC_LOG_ERR"

        if [ -n "$2" ]; then
            error_message "$2"
        else
            error_message "Error executing $1: $EXEC_LOG_ERR"
        fi
        exit $EXEC_LOG_RC
    fi
}

# This function executes $1 and returns stdout
# If a second parameter is present it is used as the error message when
# the command fails
function monitor_and_log
{
    EXEC_OUT="$(bash -s 2>/dev/null <<EOF
export LANG=C
export LC_ALL=C
set -xv
$1
EOF
)"
    EXEC_RC=$?

    if [ $EXEC_RC -ne 0 ]; then

        if [ -n "$2" ]; then
            log_error "Command \"$2\" failed: $EXEC_OUT"
        else
            log_error "Command \"$1\" failed: $EXEC_OUT"
        fi

        exit $EXEC_RC
    fi

    echo "$EXEC_OUT"
}

# Executes a command, if it fails returns error message and exits. Similar to
# exec_and_log, except that it allows multiline commands.
# If a second parameter is present it is used as the error message when
# the command fails.
function multiline_exec_and_log
{
    message=$2

    EXEC_LOG_ERR=`bash -s 2>&1 1>/dev/null <<EOF
export LANG=C
export LC_ALL=C
$1
EOF`
    EXEC_LOG_RC=$?

    if [ $EXEC_LOG_RC -ne 0 ]; then
        log_error "Command \"$1\" failed: $EXEC_LOG_ERR"

        if [ -n "$2" ]; then
            error_message "$2"
        else
            error_message "Error executing $1: $EXEC_LOG_ERR"
        fi
        exit $EXEC_LOG_RC
    fi
}

# Like exec_and_log but does not exit on failure. Just sets the variable
# ERROR to the error message.
function exec_and_set_error
{
    message=$2

    EXEC_LOG_ERR=$(bash -c "$1" 2>&1 1>/dev/null)
    EXEC_LOG_RC=$?

    export ERROR=""

    if [ $EXEC_LOG_RC -ne 0 ]; then
        log_error "Command \"$1\" failed: $EXEC_LOG_ERR"

        if [ -n "$2" ]; then
            export ERROR="$2"
        else
            export ERROR="Error executing $1: $EXEC_LOG_ERR"
        fi
    fi
}

# Like exec_and_log but the first argument is the number of seconds
# before here is timeout and kills the command
#
# NOTE: if the command is killed because a timeout the exit code
# will be 143 = 128+15 (SIGHUP)
function timeout_exec_and_log
{
    TIMEOUT=$1
    shift

    CMD="$1"

    exec_and_log "$CMD" &
    CMD_PID=$!

    # timeout process
    (
        sleep $TIMEOUT
        kill $CMD_PID 2>/dev/null
        log_error "Timeout executing $CMD"
        error_message "Timeout executing $CMD"
        exit -1
    ) &
    TIMEOUT_PID=$!

    # stops the execution until the command finalizes
    wait $CMD_PID 2>/dev/null
    CMD_CODE=$?

    # if the script reaches here the command finished before it
    # consumes timeout seconds so we can kill timeout process
    kill $TIMEOUT_PID 2>/dev/null 1>/dev/null
    wait $TIMEOUT_PID 2>/dev/null

    # checks the exit code of the command and exits if it is not 0
    if [ "x$CMD_CODE" != "x0" ]; then
        exit $CMD_CODE
    fi
}

# Parameters are times (seconds) and monitoring command (or function).
# Executes monitoring command until it is successful (VM is no longer
# running) or the timeout is reached.
function retry
{
    times=$1
    function=$2

    count=1

    ret=$($function)
    error=$?

    while [ $count -lt $times -a "$error" != "0" ]; do
        sleep 1
        count=$(( $count + 1 ))
        ret=$($function)
        error=$?
    done

    [ "x$error" = "x0" ]
}

# Parameters are deploy_id and cancel command. If the last command is
# unsuccessful and $FORCE_DESTROY=yes then calls cancel command
function force_shutdown {
    error=$?
    deploy_id=$1
    command=$2

    if [ "x$error" != "x0" ]; then
        if [ "$FORCE_DESTROY" = "yes" ]; then
            log_error "Timeout shutting down $deploy_id. Destroying it"
            ret=$($command)
            sleep 2
        else
            error_message "Timed out shutting down $deploy_id"
            exit -1
        fi
    fi
}

# This function will return a command that upon execution will format a
# filesystem with its proper parameters based on the filesystem type
function mkfs_command {
    DST=$1
    FSTYPE=$2
    SIZE=${3:-0}

    if [ "$FSTYPE" = "qcow2" ]; then
        QEMU_FORMAT="qcow2"
    else
        QEMU_FORMAT="raw"
    fi

    echo "$QEMU_IMG create -f ${QEMU_FORMAT} ${DST} ${SIZE}M"

    if [ "$FSTYPE" = "swap" ]; then
        echo "$MKSWAP -L swap $DST"
    fi
}

#This function executes $2 at $1 host and report error $3 but does not exit
function ssh_exec_and_log_no_error
{
    SSH_EXEC_ERR=`$SSH $1 bash -s 2>&1 1>/dev/null <<EOF
export LANG=C
export LC_ALL=C
$2
EOF`
    SSH_EXEC_RC=$?

    if [ $SSH_EXEC_RC -ne 0 ]; then
        log_error "Command \"$2\" failed: $SSH_EXEC_ERR"

        if [ -n "$3" ]; then
            error_message "$3"
        else
            error_message "Error executing $2: $SSH_EXEC_ERR"
        fi

        return $SSH_EXEC_RC
    fi

    return 0
}

#This function executes $2 at $1 host and report error $3
function ssh_exec_and_log
{
    ssh_exec_and_log_no_error "$@"
    EXEC_RC=$?

    if [ "$EXEC_RC" != "0" ]; then
        exit $EXEC_RC
    fi
}

# Remote command execution over SSH preloading a local file
# $1: HOSTNAME
# $2: COMMAND
# $3: file to be loaded into the script
# $4: ERROR_REPORT
function ssh_exec_and_log_stdin
{
    SSH_EXEC_ERR=`$SSH $1 bash -s 2>&1 1>/dev/null <<EOF
export LANG=C
export LC_ALL=C
$(cat $3)

$2
EOF`

    SSH_EXEC_RC=$?

    if [ $SSH_EXEC_RC -ne 0 ]; then
        log_error "Command \"$2\" failed: $SSH_EXEC_ERR"

        if [ -n "$4" ]; then
            error_message "$4"
        else
            error_message "Error executing $2: $SSH_EXEC_ERR"
        fi

        exit $SSH_EXEC_RC
    fi
}

# This function executes $2 at $1 host and returns stdout
# If $3 is present, it is used as the error message when
# the command fails
function ssh_monitor_and_log
{
    SSH_EXEC_OUT="$($SSH $1 bash -s 2>/dev/null <<EOF
export LANG=C
export LC_ALL=C
$2
EOF
)"
    SSH_EXEC_RC=$?

    if [ $SSH_EXEC_RC -ne 0 ]; then

        if [ -n "$3" ]; then
            log_error "Command \"$3\" failed: $SSH_EXEC_OUT"
        else
            log_error "Command \"$2\" failed: $SSH_EXEC_OUT"
        fi

        exit $SSH_EXEC_RC
    fi

    echo "$SSH_EXEC_OUT"
}

# Creates path ($2) at $1. If there is a third parameter it is writen as
# file ".monitor" in the directory. Used for local disk monitoring
function ssh_make_path
{
    SSH_EXEC_ERR=`$SSH $1 bash -s 2>&1 1>/dev/null <<EOF
set -e -o pipefail
if [ ! -d $2 ]; then
   mkdir -p $2

   if [ -n "$3" ]; then
       echo "$3" > "\$(dirname $2)/.monitor"
   fi
fi
EOF`
    SSH_EXEC_RC=$?

    if [ $SSH_EXEC_RC -ne 0 ]; then
        error_message "Error creating directory $2 at $1: $SSH_EXEC_ERR"

        exit $SSH_EXEC_RC
    fi
}

# Escape characters which could be interpreted as XML markup
function xml_esc
{
   R=${1//\'/&apos;}
   R=${R//\"/&quot;}
   R=${R//\&/&amp;}
   R=${R//\</&lt;}
   R=${R//\>/&gt;}

   echo "${R}"
}

# TODO -> Use a dynamically loaded scripts directory. Not removing this due
#         to iSCSI addon: https://github.com/OpenNebula/addon-iscsi


# ------------------------------------------------------------------------------
# iSCSI functions
# ------------------------------------------------------------------------------

#-------------------------------------------------------------------------------
# Returns the command to create a new target
#   @param $1 - ID of the image
#   @param $2 - Target Host
#   @param $3 - Device
#   @return the command to create a new target
#-------------------------------------------------------------------------------

function tgtadm_target_new {
    ID="$1"
    IQN="$2"

    echo "$TGTADM --lld iscsi --op new --mode target --tid $ID "\
        "--targetname $IQN"
}

function tgtadm_target_bind_all {
    ID="$1"
    echo "$TGTADM --lld iscsi --op bind --mode target --tid $ID -I ALL"
}

function tgtadm_logicalunit_new {
    ID="$1"
    DEV="$2"

    echo "$TGTADM --lld iscsi --op new --mode logicalunit --tid $ID "\
        "--lun 1 --backing-store $DEV"
}

function tgtadm_target_delete {
    ID="$1"
    echo "$TGTADM --lld iscsi --op delete --mode target --tid $ID"
}

function tgtadm_get_tid_for_iqn {
    IQN="$1"
    echo "$TGTADM --lld iscsi --op show --mode target | strings | \
        grep \"$IQN\" | awk '{split(\$2,tmp,\":\"); print(tmp[1]);}'"
}

function tgtadm_next_tid {
    echo "$TGTADM --lld iscsi --op show --mode target | strings | \
            $GREP \"Target\" | tail -n 1 | \
            $AWK '{split(\$2,tmp,\":\"); print tmp[1]+1;}'"
}

function tgt_admin_dump_config {
    FILE_PATH="$1"
    echo "$TGTADMIN --dump |sudo tee $FILE_PATH > /dev/null 2>&1"
}

###

function iscsiadm_discovery {
    TARGET_HOST="$1"
    echo "$ISCSIADM -m discovery -t st -p $TARGET_HOST"
}

function iscsiadm_login {
    IQN="$1"
    TARGET_HOST="$2"
    echo "$ISCSIADM -m node --targetname $IQN -p $TARGET_HOST --login"
}

function iscsiadm_logout {
    IQN="$1"
    echo "$ISCSIADM -m node --targetname $IQN --logout"
}

function is_iscsi {
    if echo "$NO_ISCSI"|grep -q "\b$1\b"; then
        return 1
    else
        return 0
    fi
}

# Checks wether $IMAGE_TYPE is CDROM
function is_cdrom {
    [ "$IMAGE_TYPE" = "1" ]
}

function iqn_get_lv_name {
    IQN="$1"
    TARGET=`echo "$IQN"|$CUT -d: -f2`
    echo $TARGET|$AWK -F. '{print $(NF)}'
}

function iqn_get_vg_name {
    IQN="$1"
    TARGET=`echo "$IQN"|$CUT -d: -f2`
    echo $TARGET|$AWK -F. '{print $(NF-1)}'
}

function tgt_setup_lun_install {
    DST_HOST="$1"
    BASE_PATH="$2"

    CHECK_FILE="$BASE_PATH/.tgt-setup-lun"

    if [ ! -f "$CHECK_FILE" ]; then
        $SSH "$DST_HOST" "$SUDO $TGTSETUPLUN" 2>&1 | \
            $GREP -q "command not found"
        if [ "$?" = "0" ]; then
            error_message "$TGTSETUPLUN is not installed in $DST_HOST."
            exit 127
        else
            touch "$CHECK_FILE"
        fi
    fi
}

function tgt_setup_lun {
    IQN="$1"
    DEV="$2"
    echo "$TGTSETUPLUN -d $DEV -n $IQN 1>&2"
}

function iqn_get_host {
    IQN="$1"
    TARGET=`echo "$IQN"|$CUT -d: -f2`
    LV_NAME=$(iqn_get_lv_name "$IQN")
    VG_NAME=$(iqn_get_vg_name "$IQN")
    echo ${TARGET%%.$VG_NAME.$LV_NAME}
}

# ------------------------------------------------------------------------------
# VMM helpers
# ------------------------------------------------------------------------------

# This function builds the XML necessary for attach-disk operations
# that require declaration of host sources
#   @param $1 - Space separated list of hosts
#   @return The XML via STDOUT
function get_source_xml {
    for host in $1 ; do
        BCK_IFS=$IFS
        IFS=':'

        unset k HOST_PARTS

        for part in $host ; do
            HOST_PARTS[k++]="$part"
        done

        SOURCE_HOST="$SOURCE_HOST<host name='${HOST_PARTS[0]}'"

        if [ -n "${HOST_PARTS[1]}" ]; then
            SOURCE_HOST="$SOURCE_HOST port='${HOST_PARTS[1]}'"
        fi

        SOURCE_HOST="$SOURCE_HOST/>"

        IFS=$BCK_IFS
    done

    echo "$SOURCE_HOST"
}

# This function extracts information about a disk. The first parameter
# is a string with the filter for disks, for example, to get the disk
# that's going to be attached use:
#
#     get_disk_information "ATTACH=YES"
#
# To get an specific disk ID use:
#
#     get_disk_information "DISK_ID=$DISK_ID"
#
# The variables set are as follows:
#
# * VMID
# * DRIVER
# * TYPE
# * READONLY
# * CACHE
# * DISCARD
# * IMG_SRC
# * DISK_ID
# * CLONE
# * CEPH_HOST
# * CEPH_SECRET
# * CEPH_USER
# * ISCSI_HOST
# * ISCSI_USAGE
# * ISCSI_USER
# * ISCSI_IQN
# * DISK_TYPE
# * POOL_NAME
# * SIZE
# * DISK_TARGET
# * DISK_IO
# * ORDER
# * TOTAL_BYTES_SEC
# * TOTAL_BYTES_SEC_MAX
# * TOTAL_BYTES_SEC_MAX_LENGTH
# * READ_BYTES_SEC
# * READ_BYTES_SEC_MAX
# * READ_BYTES_SEC_MAX_LENGTH
# * WRITE_BYTES_SEC
# * WRITE_BYTES_SEC_MAX
# * WRITE_BYTES_SEC_MAX_LENGTH
# * TOTAL_IOPS_SEC
# * TOTAL_IOPS_SEC_MAX
# * TOTAL_IOPS_SEC_MAX_LENGTH
# * READ_IOPS_SEC
# * READ_IOPS_SEC_MAX
# * READ_IOPS_SEC_MAX_LENGTH
# * WRITE_IOPS_SEC
# * WRITE_IOPS_SEC_MAX
# * WRITE_IOPS_SEC_MAX_LENGTH
# * TYPE_SOURCE: libvirt xml source name. $TYPE_SOURCE=$SOURCE => file=/my/path
# * SOURCE: disk source, can be path, ceph pool/image, device...
# * TYPE_XML
# * DEVICE
# * SOURCE_ARGS: ex. protocol='rbd'
# * SOURCE_HOST
# * AUTH: auth xml for libvirt
#
# This function was originaly in attach_disk action

function get_disk_information {
    FILTER="$1"

    DRIVER_PATH=$(dirname $0)
    XPATH="${DRIVER_PATH}/../../datastore/xpath.rb"
    CMD="$XPATH -b $DRV_ACTION"

    unset i j XPATH_ELEMENTS

    DISK_XPATH="/VMM_DRIVER_ACTION_DATA/VM/TEMPLATE/DISK[$FILTER]"

    while IFS= read -r -d '' element; do
        XPATH_ELEMENTS[i++]="$element"
    done < <($CMD       /VMM_DRIVER_ACTION_DATA/VM/ID \
                        $DISK_XPATH/DRIVER \
                        $DISK_XPATH/TYPE \
                        $DISK_XPATH/READONLY \
                        $DISK_XPATH/CACHE \
                        $DISK_XPATH/DISCARD \
                        $DISK_XPATH/SOURCE \
                        $DISK_XPATH/DISK_ID \
                        $DISK_XPATH/CLONE \
                        $DISK_XPATH/CEPH_HOST \
                        $DISK_XPATH/CEPH_SECRET \
                        $DISK_XPATH/CEPH_USER \
                        $DISK_XPATH/ISCSI_HOST \
                        $DISK_XPATH/ISCSI_USAGE \
                        $DISK_XPATH/ISCSI_USER \
                        $DISK_XPATH/ISCSI_IQN \
                        $DISK_XPATH/DISK_TYPE \
                        $DISK_XPATH/POOL_NAME \
                        $DISK_XPATH/SIZE \
                        $DISK_XPATH/TARGET \
                        $DISK_XPATH/IO \
                        $DISK_XPATH/ORDER \
                        $DISK_XPATH/TOTAL_BYTES_SEC \
                        $DISK_XPATH/TOTAL_BYTES_SEC_MAX \
                        $DISK_XPATH/TOTAL_BYTES_SEC_MAX_LENGTH \
                        $DISK_XPATH/READ_BYTES_SEC \
                        $DISK_XPATH/READ_BYTES_SEC_MAX \
                        $DISK_XPATH/READ_BYTES_SEC_MAX_LENGTH \
                        $DISK_XPATH/WRITE_BYTES_SEC \
                        $DISK_XPATH/WRITE_BYTES_SEC_MAX \
                        $DISK_XPATH/WRITE_BYTES_SEC_MAX_LENGTH \
                        $DISK_XPATH/TOTAL_IOPS_SEC \
                        $DISK_XPATH/TOTAL_IOPS_SEC_MAX \
                        $DISK_XPATH/TOTAL_IOPS_SEC_MAX_LENGTH \
                        $DISK_XPATH/READ_IOPS_SEC \
                        $DISK_XPATH/READ_IOPS_SEC_MAX \
                        $DISK_XPATH/READ_IOPS_SEC_MAX_LENGTH \
                        $DISK_XPATH/WRITE_IOPS_SEC \
                        $DISK_XPATH/WRITE_IOPS_SEC_MAX \
                        $DISK_XPATH/WRITE_IOPS_SEC_MAX_LENGTH )

    VMID="${XPATH_ELEMENTS[j++]}"
    DRIVER="${XPATH_ELEMENTS[j++]:-$DEFAULT_TYPE}"
    TYPE="${XPATH_ELEMENTS[j++]}"
    READONLY="${XPATH_ELEMENTS[j++]}"
    CACHE="${XPATH_ELEMENTS[j++]}"
    DISCARD="${XPATH_ELEMENTS[j++]}"
    IMG_SRC="${XPATH_ELEMENTS[j++]}"
    DISK_ID="${XPATH_ELEMENTS[j++]}"
    CLONE="${XPATH_ELEMENTS[j++]}"
    CEPH_HOST="${XPATH_ELEMENTS[j++]}"
    CEPH_SECRET="${XPATH_ELEMENTS[j++]}"
    CEPH_USER="${XPATH_ELEMENTS[j++]}"
    ISCSI_HOST="${XPATH_ELEMENTS[j++]}"
    ISCSI_USAGE="${XPATH_ELEMENTS[j++]}"
    ISCSI_USER="${XPATH_ELEMENTS[j++]}"
    ISCSI_IQN="${XPATH_ELEMENTS[j++]}"
    DISK_TYPE="${XPATH_ELEMENTS[j++]}"
    POOL_NAME="${XPATH_ELEMENTS[j++]}"
    SIZE="${XPATH_ELEMENTS[j++]}"
    DISK_TARGET="${XPATH_ELEMENTS[j++]}"
    DISK_IO="${XPATH_ELEMENTS[j++]}"
    ORDER="${XPATH_ELEMENTS[j++]}"
    TOTAL_BYTES_SEC="${XPATH_ELEMENTS[j++]}"
    TOTAL_BYTES_SEC_MAX="${XPATH_ELEMENTS[j++]}"
    TOTAL_BYTES_SEC_MAX_LENGTH="${XPATH_ELEMENTS[j++]}"
    READ_BYTES_SEC="${XPATH_ELEMENTS[j++]}"
    READ_BYTES_SEC_MAX="${XPATH_ELEMENTS[j++]}"
    READ_BYTES_SEC_MAX_LENGTH="${XPATH_ELEMENTS[j++]}"
    WRITE_BYTES_SEC="${XPATH_ELEMENTS[j++]}"
    WRITE_BYTES_SEC_MAX="${XPATH_ELEMENTS[j++]}"
    WRITE_BYTES_SEC_MAX_LENGTH="${XPATH_ELEMENTS[j++]}"
    TOTAL_IOPS_SEC="${XPATH_ELEMENTS[j++]}"
    TOTAL_IOPS_SEC_MAX="${XPATH_ELEMENTS[j++]}"
    TOTAL_IOPS_SEC_MAX_LENGTH="${XPATH_ELEMENTS[j++]}"
    READ_IOPS_SEC="${XPATH_ELEMENTS[j++]}"
    READ_IOPS_SEC_MAX="${XPATH_ELEMENTS[j++]}"
    READ_IOPS_SEC_MAX_LENGTH="${XPATH_ELEMENTS[j++]}"
    WRITE_IOPS_SEC="${XPATH_ELEMENTS[j++]}"
    WRITE_IOPS_SEC_MAX="${XPATH_ELEMENTS[j++]}"
    WRITE_IOPS_SEC_MAX_LENGTH="${XPATH_ELEMENTS[j++]}"

    TYPE=$(echo "$TYPE"|tr A-Z a-z)
    READONLY=$(echo "$READONLY"|tr A-Z a-z)

    NAME="$SOURCE"

    case "$TYPE" in
    block)
        TYPE_SOURCE="dev"
        TYPE_XML="block"
        DEVICE="disk"
        ;;
    iscsi)
        TYPE_SOURCE="name"
        TYPE_XML="network"
        DEVICE="disk"

        if [ -n "$ISCSI_IQN" ]; then
            SOURCE="${ISCSI_IQN}"
        else
            SOURCE="${IMG_SRC}"
        fi

        SOURCE_ARGS="protocol='iscsi'"
        SOURCE_HOST=$(get_source_xml "$ISCSI_HOST")

        if [ -n "$ISCSI_USAGE" -a -n "$ISCSI_USER" ]; then
            AUTH="<auth username='$ISCSI_USER'>\
                    <secret type='iscsi' usage='$ISCSI_USAGE'/>\
                  </auth>"
        fi
        ;;
    cdrom)
        TYPE_SOURCE="file"
        TYPE_XML="file"
        DEVICE="cdrom"
        ;;
    rbd*)
        TYPE_SOURCE="name"
        TYPE_XML="network"

        if [ "$TYPE" = "rbd_cdrom" ]; then
            DEVICE="cdrom"
        else
            DEVICE="disk"
        fi

        if [ "$CLONE" = "YES" ]; then
            SOURCE="${IMG_SRC}-${VMID}-${DISK_ID}"
        else
            SOURCE="${IMG_SRC}"
        fi

        SOURCE_ARGS="protocol='rbd'"
        SOURCE_HOST=$(get_source_xml "$CEPH_HOST")

        if [ -n "$CEPH_USER" -a -n "$CEPH_SECRET" ]; then
            AUTH="<auth username='$CEPH_USER'>\
                    <secret type='ceph' uuid='$CEPH_SECRET'/>\
                  </auth>"
        fi
        ;;
    *)
        #NOTE: This includes TYPE=FS and TYPE=SWAP
        case "$DISK_TYPE" in
        RBD)
            TYPE_SOURCE="name"
            TYPE_XML="network"
            DEVICE="disk"

            SOURCE="${POOL_NAME}/one-sys-${VMID}-${DISK_ID}"

            NAME="${RBD_SOURCE}"
            SOURCE_ARGS="protocol='rbd'"

            SOURCE_HOST=$(get_source_xml $CEPH_HOST)

            if [ -n "$CEPH_USER" -a -n "$CEPH_SECRET" ]; then
                AUTH="<auth username='$CEPH_USER'>\
                        <secret type='ceph' uuid='$CEPH_SECRET'/>\
                      </auth>"
            fi
            ;;
        *)
            TYPE_SOURCE="file"
            TYPE_XML="file"
            DEVICE="disk"
            ;;
        esac

        ;;
    esac
}


# This function extracts information about a NIC. The first parameter
# is a string with the filter for NICs, for example, to get the interface
# that's going to be attached, use:
#
#     get_nic_information "ATTACH=YES"
#
# To get an specific interface ID use:
#
#     get_nic_information "NIC_ID=$NIC_ID"
#
# The variables set are as follows:
#
# * VMID
# * NIC_ID
# * BRIDGE
# * VN_MAD
# * MAC
# * NIC_TARGET
# * SCRIPT
# * MODEL
# * IP
# * FILTER
# * VIRTIO_QUEUES
# * VROUTER_IP
# * INBOUND_AVG_BW
# * INBOUND_PEAK_BW
# * INBOUND_PEAK_KB
# * OUTBOUND_AVG_BW
# * OUTBOUND_PEAK_BW
# * OUTBOUND_PEAK_KB
# * ORDER

function get_nic_information {
    FILTER="$1"

    DRIVER_PATH=$(dirname $0)
    XPATH="${DRIVER_PATH}/../../datastore/xpath.rb"
    CMD="$XPATH --stdin"

    unset i j XPATH_ELEMENTS

    NIC_XPATH="/VMM_DRIVER_ACTION_DATA/VM/TEMPLATE/NIC[$FILTER]"

    while IFS= read -r -d '' element; do
        XPATH_ELEMENTS[i++]="$element"
    done < <($CMD       /VMM_DRIVER_ACTION_DATA/VM/ID \
                        $NIC_XPATH/NIC_ID \
                        $NIC_XPATH/BRIDGE \
                        $NIC_XPATH/VN_MAD \
                        $NIC_XPATH/MAC \
                        $NIC_XPATH/TARGET \
                        $NIC_XPATH/SCRIPT \
                        $NIC_XPATH/MODEL \
                        $NIC_XPATH/IP \
                        $NIC_XPATH/FILTER \
                        $NIC_XPATH/VIRTIO_QUEUES \
                        $NIC_XPATH/VROUTER_IP \
                        $NIC_XPATH/INBOUND_AVG_BW \
                        $NIC_XPATH/INBOUND_PEAK_BW \
                        $NIC_XPATH/INBOUND_PEAK_KB \
                        $NIC_XPATH/OUTBOUND_AVG_BW \
                        $NIC_XPATH/OUTBOUND_PEAK_BW \
                        $NIC_XPATH/OUTBOUND_PEAK_KB \
                        $NIC_XPATH/ORDER)

    VMID="${XPATH_ELEMENTS[j++]}"
    NIC_ID="${XPATH_ELEMENTS[j++]}"
    BRIDGE="${XPATH_ELEMENTS[j++]}"
    VN_MAD="${XPATH_ELEMENTS[j++]}"
    MAC="${XPATH_ELEMENTS[j++]}"
    NIC_TARGET="${XPATH_ELEMENTS[j++]}"
    SCRIPT="${XPATH_ELEMENTS[j++]}"
    MODEL="${XPATH_ELEMENTS[j++]}"
    IP="${XPATH_ELEMENTS[j++]}"
    FILTER="${XPATH_ELEMENTS[j++]}"
    VIRTIO_QUEUES="${XPATH_ELEMENTS[j++]}"
    VROUTER_IP="${XPATH_ELEMENTS[j++]}"
    INBOUND_AVG_BW="${XPATH_ELEMENTS[j++]}"
    INBOUND_PEAK_BW="${XPATH_ELEMENTS[j++]}"
    INBOUND_PEAK_KB="${XPATH_ELEMENTS[j++]}"
    OUTBOUND_AVG_BW="${XPATH_ELEMENTS[j++]}"
    OUTBOUND_PEAK_BW="${XPATH_ELEMENTS[j++]}"
    OUTBOUND_PEAK_KB="${XPATH_ELEMENTS[j++]}"
    ORDER="${XPATH_ELEMENTS[j++]}"
}

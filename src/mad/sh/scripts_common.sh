# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
AWK=awk
BASH=bash
CUT=cut
CEPH=ceph
DATE=date
DD=dd
DF=df
DU=du
GREP=grep
ISCSIADM=iscsiadm
LVCREATE=lvcreate
LVREMOVE=lvremove
LVRENAME=lvrename
LVS=lvs
LN=ln
MD5SUM=md5sum
MKFS=mkfs
MKISOFS=genisoimage
MKSWAP=mkswap
QEMU_IMG=qemu-img
RADOS=rados
RBD=rbd
READLINK=readlink
RM=rm
SCP=scp
SED=sed
SSH=ssh
SUDO=sudo
SYNC=sync
TAR=tar
TGTADM=tgtadm
TGTADMIN=tgt-admin
TGTSETUPLUN=tgt-setup-lun-one
TR=tr
VGDISPLAY=vgdisplay
VMKFSTOOLS=vmkfstools
WGET=wget

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
    EXEC_OUT=`bash -s 2>/dev/null <<EOF
export LANG=C
export LC_ALL=C
set -xv
$1
EOF`
    EXEC_RC=$?

    if [ $EXEC_RC -ne 0 ]; then

        if [ -n "$2" ]; then
            log_error "Command \"$2\" failed: $EXEC_OUT"
        else
            log_error "Command \"$1\" failed: $EXEC_OUT"
        fi

        exit $EXEC_RC
    fi

    echo $EXEC_OUT
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
            $($command)
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
    FSTYPE=${2:-ext3}
    SIZE=${3:-0}

    # Specific options for different FS
    case "$FSTYPE" in
        "ext2"|"ext3"|"ext4"|"ntfs")
            OPTS="-F"
            ;;

        "reiserfs"|"xfs")
            OPTS="-f -q"
            ;;

        "jfs")
            OPTS="-q"
            ;;
        "raw"|"")
            echo ""
            return 0
            ;;
        "swap")
            echo "$MKSWAP -L swap $DST"
            return 0
            ;;
        "qcow2")
            echo "$QEMU_IMG create -f qcow2 $DST ${SIZE}M"
            return 0
            ;;
        "vmdk_"*)
            VMWARE_DISK_TYPE=`echo $FSTYPE|cut -d'_' -f 2`

            echo "$VMWARE_DISK_TYPE" | \
            grep '\<thin\>\|\<zeroedthic\>\|\<eagerzeroedthick\>' 2>&1 /dev/null

            if [ $? -eq 1 ] ; then
                VMWARE_DISK_TYPE="thin"
            fi

            echo "$VMKFSTOOLS -U $DST/disk.vmdk; \
                  rm -f $DST/*; \
                  $VMKFSTOOLS -c ${SIZE}M -d ${VMWARE_DISK_TYPE} $DST/disk.vmdk"
            return 0
            ;;
        *)
            echo ""
            echo "Filesystem '$FSTYPE' not valid." 1>&2
            return 1
            ;;
    esac

    echo "$MKFS -t $FSTYPE $OPTS $DST"
}

#This function executes $2 at $1 host and report error $3
function ssh_exec_and_log
{
    SSH_EXEC_ERR=`$SSH $1 sh -s 2>&1 1>/dev/null <<EOF
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

        exit $SSH_EXEC_RC
    fi
}

# This function executes $2 at $1 host and returns stdout
# If $3 is present, it is used as the error message when
# the command fails
function ssh_monitor_and_log
{
    SSH_EXEC_OUT=`$SSH $1 sh -s 2>/dev/null <<EOF
export LANG=C
export LC_ALL=C
$2
EOF`
    SSH_EXEC_RC=$?

    if [ $SSH_EXEC_RC -ne 0 ]; then

        if [ -n "$3" ]; then
            log_error "Command \"$3\" failed: $SSH_EXEC_OUT"
        else
            log_error "Command \"$2\" failed: $SSH_EXEC_OUT"
        fi

        exit $SSH_EXEC_RC
    fi

    echo $SSH_EXEC_OUT
}

#Creates path ($2) at $1
function ssh_make_path
{
    SSH_EXEC_ERR=`$SSH $1 sh -s 2>&1 1>/dev/null <<EOF
if [ ! -d $2 ]; then
   mkdir -p $2
fi
EOF`
    SSH_EXEC_RC=$?

    if [ $? -ne 0 ]; then
        error_message "Error creating directory $2 at $1: $SSH_EXEC_ERR"

        exit $SSH_EXEC_RC
    fi
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

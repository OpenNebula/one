# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

# Paths for utilities
export PATH=/bin:/sbin:/usr/bin:$PATH
AWK=awk
BASH=bash
CUT=cut
DATE=date
DD=dd
DU=du
LVCREATE=lvcreate
LVREMOVE=lvremove
LVS=lvs
MD5SUM=md5sum
MKFS=mkfs
MKISOFS=mkisofs
MKSWAP=mkswap
QEMU_IMG=qemu-img
READLINK=readlink
SCP=scp
SED=sed
SSH=ssh
SUDO=sudo
WGET=wget
GREP=grep

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

# This function will return a command that upon execution will format a
# filesystem with its proper parameters based on the filesystem type
function mkfs_command {
    DST=$1
    FSTYPE=${2:-ext3}

    # Specific options for different FS
    case "$FSTYPE" in
        "ext2"|"ext3"|"ext4"|"ntfs")
            OPTS="-F"
            ;;

        "reiserfs")
            OPTS="-f -q"
            ;;

        "jfs")
            OPTS="-q"
            ;;
        "raw")
            echo ""
            return 0
            ;;
        "swap")
            echo "$MKSWAP $DST"
            return 0
            ;;
        *)
            OPTS=""
            ;;
    esac

    echo "$MKFS -t $FSTYPE $OPTS $DST"
}

#This function executes $2 at $1 host and report error $3
function ssh_exec_and_log
{
    SSH_EXEC_ERR=`$SSH $1 bash -s 2>&1 1>/dev/null <<EOF
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

#Creates path ($2) at $1
function ssh_make_path
{
    SSH_EXEC_ERR=`$SSH $1 bash -s 2>&1 1>/dev/null <<EOF
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

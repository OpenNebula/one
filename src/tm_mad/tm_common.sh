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

export LANG=C

# ------------------------------------------------------------------------------
# Set enviroment for the tm drivers (bash-based)
# ------------------------------------------------------------------------------
if [ -z "$ONE_LOCATION" ]; then
    ONE_LOCAL_VAR=/var/lib/one
    ONE_LIB=/usr/lib/one
    DS_DIR=/var/lib/one/datastores
else
    ONE_LOCAL_VAR=$ONE_LOCATION/var
    ONE_LIB=$ONE_LOCATION/lib
    DS_DIR=$ONE_LOCATION/var/datastores
fi

ONE_SH=$ONE_LIB/sh

. $ONE_SH/scripts_common.sh

# ------------------------------------------------------------------------------
# Function to get hosts and paths from arguments
# ------------------------------------------------------------------------------

# Gets the host from an argument
function arg_host
{
    echo $1 | $SED 's/^([^:]*):.*$/\1/'
}

# Gets the path from an argument
function arg_path
{
    ARG_PATH=`echo $1 | $SED 's/^[^:]*:(.*)$/\1/'`
    fix_dir_slashes "$ARG_PATH"
}

#Return the DATASTORE_LOCATION from OpenNebula configuration
function set_ds_location
{
    RMT_DS_DIR=`$GREP '^DATASTORE_LOCATION=' $ONE_LOCAL_VAR/config | cut -d= -f2`
    RMT_DS_DIR=`fix_dir_slashes $DS_LOCATION`

    export RMT_DS_DIR
}

#Return 1 if the first argument is a disk
function is_disk
{
    echo "$1" | $GREP '/disk\.[0-9]\+' > /dev/null 2>&1 

    if [ $? -eq 0 ]; then
        echo "1"
    else
        echo "0"
    fi
}

# ------------------------------------------------------------------------------
# Function to get hosts and paths from arguments
# ------------------------------------------------------------------------------

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

#Transform a system data store path from its remote location to the local one
#$1 remote path
function remote2local_path
{
    if [ -z "$RMT_DS_DIR" ]; then
        set_ds_location
    fi

    echo "$ONE_LOCAL_VAR/datastores/${1##"$RMT_DS_DIR/"}"
}

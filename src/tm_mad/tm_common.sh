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

if [ -z "$ONE_LOCATION" ]; then
    ONE_LOCAL_VAR=/var/lib/one
    ONE_LIB=/usr/lib/one
else
    ONE_LOCAL_VAR=$ONE_LOCATION/var
    ONE_LIB=$ONE_LOCATION/lib
fi

ONE_SH=$ONE_LIB/sh

. $ONE_SH/scripts_common.sh



if [ "x$(uname -s)" = "xLinux" ]; then
    SED="$SED -r"
else
    SED="/usr/bin/sed -E"
fi

function get_vmdir
{
    VMDIR=`grep '^VM_DIR=' $ONE_LOCAL_VAR/config | cut -d= -f2`
    fix_var_slashes
}

# Takes out uneeded slashes. Repeated and final directory slashes:
# /some//path///somewhere/ -> /some/path/somewhere
function fix_dir_slashes
{
    dirname "$1/file" | $SED 's/\/+/\//g'
}

function get_compare_target
{
    echo "$1" | $SED 's/\/+/\//g' | $SED 's/\/images$//'
}

function full_src_and_dst_equal
{
    s=`get_compare_target "$SRC"`
    d=`get_compare_target "$DST"`

    [ "$s" == "$d" ]

}

function fix_var_slashes
{
    ONE_LOCAL_VAR=`fix_dir_slashes "$ONE_LOCAL_VAR"`
    VMDIR=`fix_dir_slashes "$VMDIR"`
}

function fix_paths
{
    if [ "x$ONE_LOCAL_VAR" != "x$VMDIR" ]; then
        SRC_PATH=`fix_dir_slashes "$SRC_PATH"`
        SRC_PATH=${SRC_PATH/$VMDIR/$ONE_LOCAL_VAR}
        DST_PATH=`fix_dir_slashes "$DST_PATH"`
        DST_PATH=${DST_PATH/$VMDIR/$ONE_LOCAL_VAR}
    fi
}

function fix_src_path
{
    if [ "x$ONE_LOCAL_VAR" != "x$VMDIR" ]; then
        SRC_PATH=`fix_dir_slashes "$SRC_PATH"`
        SRC_PATH=${SRC_PATH/$VMDIR/$ONE_LOCAL_VAR}
    fi
}

function fix_dst_path
{
    if [ "x$ONE_LOCAL_VAR" != "x$VMDIR" ]; then
        DST_PATH=`fix_dir_slashes "$DST_PATH"`
        DST_PATH=${DST_PATH/$VMDIR/$ONE_LOCAL_VAR}
    fi
}

# Gets the host from an argument
function arg_host
{
    echo $1 | $SED 's/^([^:]*):.*$/\1/'
}

# Gets the path from an argument
function arg_path
{
    echo $1 | $SED 's/^[^:]*:(.*)$/\1/'
}




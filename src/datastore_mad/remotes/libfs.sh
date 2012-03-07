#!/bin/bash

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

#------------------------------------------------------------------------------
#  Set up environment variables
#    @param $1 - Datastore base_path
#    @param $2 - Restricted directories
#    @param $3 - Safe dirs
#    @param $4 - Umask for new file creation (default: 0007)
#    @return sets the following environment variables
#      - RESTRICTED_DIRS: Paths that can not be used to register images
#      - SAFE_DIRS: Paths that are safe to specify image paths
#      - BASE_PATH: Path where the images will be stored
#------------------------------------------------------------------------------
function set_up_datastore {
	#
	# Load the default configuration for FS datastores
	#
	BASE_PATH="$1"
	RESTRICTED_DIRS="$2"
	SAFE_DIRS="$3"
	UMASK="$4"

	if [ -z "${ONE_LOCATION}" ]; then
	    VAR_LOCATION=/var/lib/one/
	    ETC_LOCATION=/etc/one/
	else
	    VAR_LOCATION=$ONE_LOCATION/var/
	    ETC_LOCATION=$ONE_LOCATION/etc/
	fi

	#
	# RESTRICTED AND SAFE DIRS (from default configuration)
	#
	RESTRICTED_DIRS="$VAR_LOCATION $ETC_LOCATION $HOME/ $RESTRICTED_DIRS"

	export BASE_PATH
	export RESTRICTED_DIRS
	export SAFE_DIRS

	if [ -n "$UMASK" ]; then
		umask $UMASK
	else
		umask 0007
	fi
}

#-------------------------------------------------------------------------------
# Generates an unique image path. Requires BASE_PATH to be set
#   @return path for the image (empty if error)
#-------------------------------------------------------------------------------
function generate_image_path {

	CANONICAL_STR="`$DATE +%s`:$ID"

	CANONICAL_MD5=$($MD5SUM - << EOF
$CANONICAL_STR
EOF
)
	echo "${BASE_PATH}/`echo $CANONICAL_MD5 | cut -d ' ' -f1`"
}

#-------------------------------------------------------------------------------
# Computes the size of an image
#   @param $1 - Path to the image
#   @return size of the image in Mb
#-------------------------------------------------------------------------------
function fs_du {
	if [ -d "$1" ]; then
		SIZE=`du -sb "$1" | cut -f1`
		error=$?
	else
		SIZE=`stat -c %s "$1"`
		error=$?
	fi

	if [ $error -ne 0 ]; then
		SIZE=0
	else
		SIZE=$((($SIZE+1048575)/1048576))
	fi

	echo "$SIZE"
}

#-------------------------------------------------------------------------------
# Computes the size of an image
#   @param $1 - Path to the image
#   @return size of the image in Mb
#-------------------------------------------------------------------------------
function qemu_size {
	DISK="$1"

	SIZE=`$QEMU_IMG info $DISK|grep "^virtual size:"|\
        sed 's/^.*(\([0-9]\+\) bytes.*$/\1/g'`

	SIZE=$((($SIZE+1048575)/1048576))

	echo "$SIZE"
}

#-------------------------------------------------------------------------------
# Checks if a path is safe for copying the image from
#   @param $1 - Path to the image
#   @return 0 if the path is safe, 1 otherwise
#-------------------------------------------------------------------------------
function check_restricted {
	for path in $SAFE_DIRS ; do
		if [ -n "`readlink -f $1 | grep -E "^$path"`" ] ; then
			echo 0
			return
		fi
	done

	for path in $RESTRICTED_DIRS ; do
		if [ -n "`readlink -f $1 | grep -E "^$path"`" ] ; then
			echo 1
			return
		fi
    done

  	echo 0
}


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

function iscsi_target_new {
    ID="$1"
    IQN="$2"

    echo "$TGTADM --lld iscsi --op new --mode target --tid $ID "\
        "--targetname $IQN"
}

function iscsi_logicalunit_new {
	ID="$1"
    DEV="$2"

	echo "$TGTADM --lld iscsi --op new --mode logicalunit --tid $ID "\
		"--lun 1 --backing-store $DEV"
}

function iscsi_target_delete {
	ID="$1"
	echo "$TGTADM --lld iscsi --op delete --mode target --tid $ID"
}

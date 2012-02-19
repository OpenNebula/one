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
#    @param $1 - template (base 64 encoded) with driver data
#    @return sets the following environment variables
#      - RESTRICTED_DIRS: Paths that can not be used to register images
#      - SAFE_DIRS: Paths that are safe to specify image paths
#      - BASE_PATH: Path where the images will be stored
#------------------------------------------------------------------------------
function set_up_datastore {
	#
	# Load the default configuration for FS datastores
	#
	if [ -z "${ONE_LOCATION}" ]; then
	    VAR_LOCATION=/var/lib/one/
	    ETC_LOCATION=/etc/one/
	else
	    VAR_LOCATION=$ONE_LOCATION/var/
	    ETC_LOCATION=$ONE_LOCATION/etc/
	fi

	CONF_FILE=$ETC_LOCATION/datastore/fs.conf

	source $CONF_FILE

	#
	# Load attributes from the Datastore
	#
	XPATH="$VAR_LOCATION/remotes/datastore/xpath.rb -b $1"
	eval "DS_BASE_PATH=`$XPATH /DS_DRIVER_ACTION_DATA/DATASTORE/BASE_PATH`"

	if [ -z "${DS_BASE_PATH}" ]; then
		if [ -z "${BASE_PATH}" ]; then
			BASE_PATH="${VAR_LOCATION}/images"
		fi
	else
		BASE_PATH=${DS_BASE_PATH}
	fi

	#
	# RESTRICTED AND SAFE DIRS (from default configuration)
	#
	RESTRICTED_DIRS="$VAR_LOCATION $ETC_LOCATION $HOME/ $RESTRICTED_DIRS"

	export BASE_PATH
	export RESTRICTED_DIRS
	export SAFE_DIRS
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
		SIZE=`du -s "$1" | cut -f1`
		error=$?
	else
		SIZE=`stat -c %s "$1"`
		error=$?
	fi

	if [ $error -ne 0 ]; then
		SIZE=0
	else
		SIZE=$(($SIZE/1048576))
	fi

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

#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
#    @return sets the following environment variables
#      - RESTRICTED_DIRS: Paths that cannot be used to register images
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
}

#-------------------------------------------------------------------------------
# Generates an unique image hash. Requires BASE_PATH to be set
#   @return hash for the image (empty if error)
#-------------------------------------------------------------------------------
function generate_image_hash {

	CANONICAL_STR="`$DATE +%s`:$ID"

	CANONICAL_MD5=$($MD5SUM - << EOF
$CANONICAL_STR
EOF
)
	IMAGE_HASH=$(echo $CANONICAL_MD5 | cut -d ' ' -f1)
	IMAGE_HASH=$(basename "$IMAGE_HASH")

	if [ -z "$IMAGE_HASH" -o -z "$BASE_PATH" ]; then
		log_error "Error generating the path in generate_image_path."
		exit 1
	fi

	echo "${IMAGE_HASH}"
}

#-------------------------------------------------------------------------------
# Generates an unique image path. Requires BASE_PATH to be set
#   @return path for the image (empty if error)
#-------------------------------------------------------------------------------
function generate_image_path {
	IMAGE_HASH=`generate_image_hash`
	echo "${BASE_PATH}/${IMAGE_HASH}"
}

#-------------------------------------------------------------------------------
# Set up the arguments for the downloader script
#   @param $1 - MD5 string
#   @param $2 - SHA1 string
#   @param $3 - NO_DECOMPRESS
#   @param $4 - BW LIMIT
#   @param $5 - SRC
#   @param $6 - DST
#   @return downloader.sh util arguments
#-------------------------------------------------------------------------------
function set_downloader_args {
	HASHES=" "

	if [ -n "$1" ]; then
	    HASHES="--md5 $1"
	fi

	if [ -n "$2" ]; then
	    HASHES="$HASHES --sha1 $2"
	fi

	if [ "$3" = "yes" -o "$3" = "Yes" -o "$3" = "YES" ]; then
	    HASHES="$HASHES --nodecomp"
	fi

	if [ -n "$4" ]; then
		HASHES="$HASHES --limit $4"
	fi

	echo "$HASHES $5 $6"
}

#------------------------------------------------------------------------------
# Gets the size in bytes of a file
#   @param $1 - Path to the image
#   @return size of the image in bytes
#------------------------------------------------------------------------------

function file_size {
	stat --version &> /dev/null

	if [ $? = 0 ]; then
		STAT_CMD="stat -c %s"
	else
		STAT_CMD="stat -f %z"
	fi

	$STAT_CMD "$*"
}

#-------------------------------------------------------------------------------
# Computes the size of an image
#   @param $1 - Path to the image
#   @return size of the image in Mb
#-------------------------------------------------------------------------------
function fs_size {

	case $1 in
	http://*/download|https://*/download)
		BASE_URL=${1%%/download}
		HEADERS=`wget -S --spider --no-check-certificate $BASE_URL 2>&1`

		echo $HEADERS | grep "market" > /dev/null 2>&1

		if [ $? -eq 0 ]; then
			#URL is from market place
			SIZE=`wget -O - -S --no-check-certificate $BASE_URL 2>&1|grep -E "^ *\"size\": \"?[0-9]+\"?.$"|tr -dc 0-9`
		else
			#Not a marketplace URL
			SIZE=`wget -S --spider --no-check-certificate $1 2>&1 | grep Content-Length  | cut -d':' -f2`
		fi
		error=$?
	    ;;
	http://*|https://*)
		SIZE=`wget -S --spider --no-check-certificate $1 2>&1 | grep Content-Length  | cut -d':' -f2`
		error=$?
	    ;;
	*)
		if [ -d "$1" ]; then
			SIZE=`du -sb "$1" | cut -f1`
			error=$?
		else
			SIZE=$(file_size "$1")
			error=$?
		fi
		;;
	esac

	if [ $error -ne 0 ]; then
		SIZE=0
	else
		SIZE=$((($SIZE+1048575)/1048576))
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

#-------------------------------------------------------------------------------
# Gets the ESX host to be used as bridge to register a VMware disk
# Implements a round robin for the bridges
#   @param $1 - Path to the list of ESX hosts to be used as bridges
#   @return host to be used as bridge
#-------------------------------------------------------------------------------
function get_destination_host {
	HOSTS_ARRAY=($BRIDGE_LIST)
    ARRAY_INDEX=`expr $1 % ${#HOSTS_ARRAY[@]}`
	echo ${HOSTS_ARRAY[$ARRAY_INDEX]}
}

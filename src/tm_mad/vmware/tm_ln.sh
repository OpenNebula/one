#!/bin/bash

# ---------------------------------------------------------------------------- #
# Copyright 2010-2011, C12G Labs S.L                                           #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

SRC=$1
DST=$2

if [ -z "${ONE_LOCATION}" ]; then
    TMCOMMON=/usr/lib/one/mads/tm_common.sh
else
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
fi

. $TMCOMMON
. "`dirname $0`/functions.sh"

get_vmdir

SRC_PATH=`arg_path $SRC`
DST_PATH=`arg_path $DST`

fix_dst_path

create_vmdir $DST_PATH

# ---------------------------------------------------------------------------- #
#  Link all files of the disk directory. Note that link paths needs to be      #
#  relative in order to be accessible from the vSphere Data Store              #
# ---------------------------------------------------------------------------- #
REL_SRC_PATH=`make_relative $SRC_PATH $DST_PATH`

log "Link all files in $SRC_PATH to $DST_PATH"

for file in `find $SRC_PATH -type f`; do
	FNAME=`basename $file`
	exec_and_log "ln -sf $REL_SRC_PATH/$FNAME $DST_PATH/$FNAME"
done

#Mark this disk persistent with a symlink for tm_mv and repo mv
exec_and_log "ln -sf ${REL_SRC_PATH#../../} $DST_PATH/.disk"


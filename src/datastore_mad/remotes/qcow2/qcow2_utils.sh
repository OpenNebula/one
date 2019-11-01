# ----------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project (OpenNebula.org), C12G Labs           #
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
# Rebase backing files of snapshots in current directory
#  @param $1 name of the backing_file symlink used internally
#--------------------------------------------------------------------------------

rebase_backing_files() {
    local DST_FILE=$1

    for SNAP_ID in $(find * -maxdepth 0 -type f -print); do
        INFO=$(qemu-img info --output=json $SNAP_ID)

        if [[ $INFO =~ "backing-filename" ]]; then
            BACKING_FILE=${INFO/*backing-filename\": \"/}
            BACKING_FILE=${BACKING_FILE/\"*/}
            BACKING_FILE=$(basename ${BACKING_FILE})
            qemu-img rebase -f qcow2 -u -b "${DST_FILE}.snap/$BACKING_FILE" $SNAP_ID
        fi
    done
}

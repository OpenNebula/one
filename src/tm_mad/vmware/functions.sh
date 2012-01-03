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

#Symlinks the dst_path to dst_path.iso if it is an ISO file
function fix_iso {
	dst_path=$1	

	if [ -f $dst_path ]; then
	    file -b $dst_path | grep "ISO 9660" > /dev/null 2>&1

	    if [ $? -eq 0 ]; then
	        bname=`basename $dst_path`
	        exec_and_log "ln -s $bname $dst_path/$bname.iso" \
	                     "Can not link ISO file."
	    fi
	fi
}

#Creates the VM dir
function create_vmdir {
	dst_path=$1

	log "Creating directory `basename $dst_path`"
	exec_and_log "mkdir -p $dst_path"
	exec_and_log "chmod a+rw $dst_path"
}

#Makes path src ($1) relative to dst ($2)
function make_relative {
	src=$1
	dst=$2

	common=$dst

	while [ -z "`echo $src | grep -E "^$common"`" ]; do
	    common=`dirname $common`
	    dots="../$dots"
	done

	echo $dots${src#$common/}
}

#Test if the source file is a disk (and not the image dir for the VM)
function is_disk {
	echo $1 | grep -q 'disk\.[0-9]\+$' > /dev/null 2>&1
	echo $?
}


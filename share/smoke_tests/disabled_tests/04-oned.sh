# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

# install oned system wide

sudo ./install.sh -u travis

# Set credentials
mkdir $HOME/.one
echo "oneadmin:opennebula" > $HOME/.one/one_auth

# Install gems
source /home/travis/.rvm/scripts/rvm
rvm repair wrappers

rvmsudo /usr/share/one/install_gems --yes

# Enable dummy drivers
sudo chmod o+w /etc/one/oned.conf
#echo 'IM_MAD = [ NAME="dummy", SUNSTONE_NAME="Dummy", EXECUTABLE="one_im_sh", ARGUMENTS="-r 3 -t 15 -w 90 dummy", THREADS=0]' >> /etc/one/monitord.conf
echo 'VM_MAD = [ NAME="dummy", SUNSTONE_NAME="Testing", EXECUTABLE="one_vmm_dummy",TYPE="xml" ]' >> /etc/one/oned.conf

# start oned
one start

# start oneflow
oneflow-server start

# check it's up
timeout 60 sh -c 'until nc -z $0 $1; do sleep 1; done' localhost 2633

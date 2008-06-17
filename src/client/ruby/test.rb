# -------------------------------------------------------------------------- #
# Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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


require 'one'
require 'pp'

template='
DISK=[image="/local/xen/domains/xen-etch/disk.img",dev="sda1",mode=w]
DISK=[image="/local/xen/domains/xen-etch/swap.img",dev="sda2",mode=w]
KERNEL=/boot/vmlinuz-2.6.18-4-xen-amd64
RAMDISK=/boot/initrd.img-2.6.18-4-xen-amd64
MEMORY=64
CPU=1
'

server=ONE::Server.new("aquila")
vm=ONE::VM.new(server)
host=ONE::Host.new(server)

#pp vm.allocate(template)


#db=ONE::Database.new

#pp db.select_table_with_names("vmpool")

pp h=host.info(0)

puts h[1]


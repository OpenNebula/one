# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'spec_common'

require 'client_mock'
require 'one_usage'

describe "OneUsage" do
    before(:all) do
        mock_data=YAML::load(File.read('spec/oca_vms.yaml'))
        client=ClientMock.new(mock_data)
        @one_usage=OneUsage.new(client)
    end
    
    it "should get information about vm users" do
        @one_usage.update_user(0)
        vms=@one_usage.vms(0)
        
        vms.size.should == 2
        vms[0].cpu.should == 0.5
        vms[0].memory.should == 64
        vms[1].cpu.should == 1.0
        vms[1].memory.should == 256
        
        usage=@one_usage.total(0)
        usage.cpu.should == 1.5
        usage.memory.should == 64+256
        
        @one_usage.update_user(1)
        vms=@one_usage.vms(1)
        
        vms.size.should == 2
        vms[2].cpu.should == 1.5
        vms[2].memory.should == 512
        vms[3].cpu.should == 2.0
        vms[3].memory.should == 1024
        
        usage=@one_usage.total(1)
        usage.cpu.should == 3.5
        usage.memory.should == 512+1024
    end
    
    it "should update information" do
        vms=@one_usage.vms(1)
        vms[4]=VmUsage.new(4.0, 2048)
        
        usage=@one_usage.total(1)
        usage.cpu.should == 1.5 + 2.0 + 4.0
        usage.memory.should == 512+1024+2048
        
        vms.delete(3)
        usage=@one_usage.total(1)
        usage.cpu.should == 1.5 + 4.0
        usage.memory.should == 512+2048
        
        @one_usage.update_user(1)
        usage=@one_usage.total(1)
        usage.cpu.should == 1.5 + 2.0
        usage.memory.should == 512+1024
    end
end

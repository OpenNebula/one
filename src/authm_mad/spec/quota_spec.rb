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

require 'quota'

def check_quota(uid, cpu, memory, num_vms)
    quota=@quota.get(uid)
    quota.should_not == nil
    quota[:cpu].should == cpu
    quota[:memory].should == memory
    quota[:num_vms].should == num_vms
end

describe 'Quota' do
    before(:all) do
        @db=Sequel.sqlite
        mock_data=YAML::load(File.read('spec/oca_vms.yaml'))
        client=ClientMock.new(mock_data)
        @quota=Quota.new(@db, client)
    end
    
    it 'should create table' do
        @db.table_exists?(:quotas).should == true
        
        schema=@db.schema(:quotas)
        check_column(schema, :uid)
        check_column(schema, :cpu)
        check_column(schema, :memory)
        check_column(schema, :num_vms)
    end
    
    it 'should let add and retrieve quotas' do
        @quota.add(0, 10.0, 1024, 10)
        @quota.add(1, 20.0, 2048, 20)
        @quota.add(2, 40.0, 4096, 40)
        
        check_quota(0, 10.0, 1024, 10)
        check_quota(1, 20.0, 2048, 20)
        check_quota(2, 40.0, 4096, 40)
        
        @quota.get(3).should == nil
    end
    
    it 'should check for quotas' do
        @quota.update(0)
        @quota.update(1)
        @quota.check(0).should == true
        @quota.check(1).should == true
        
        vms=@quota.get_user(0)
        vms[5]=VmUsage.new(40.0, 8192)
        
        vms=@quota.get_user(1)
        vms[6]=VmUsage.new(40.0, 8192)
        
        @quota.check(0).should == false
        @quota.check(1).should == false
        
        @quota.update(0)
        @quota.update(1)
        @quota.check(0).should == true
        @quota.check(1).should == true
    end
    
end



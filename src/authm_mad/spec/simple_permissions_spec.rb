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
require 'simple_permissions'

def gen_tokens(user_, action_, options={})
    user=user_.to_s
    action=action_.to_s.upcase
    
    options={
        :vm => true,
        :host => true
    }.merge!(options)
    
    pub=(options[:public] ? '1' : '0')
    id=(options[:id] ? options[:id].to_s : '1')
    #owner=(options[:owner] ? options[:owner].to_s : '1')
    
    if action=='CREATE'
        vmowner='-'
        vmid='-'
    else
        vmowner=user
        vmid=user
    end
    
    tokens=[]
    tokens<<"VM:#{vmid}:#{action}:#{vmowner}:#{pub}" if options[:vm]
    tokens+=[
        "NET:#{id}:#{action}:#{user}:#{pub}",
        "IMAGE:#{id}:#{action}:#{user}:#{pub}"
    ]
    tokens<<"HOST:#{id}:#{action}:#{user}:#{pub}" if options[:host]
    
    #pp tokens
    
    tokens
end

describe SimplePermissions do
    before(:all) do
        @db=Sequel.sqlite
        mock_data=YAML::load(File.read('spec/oca_vms.yaml'))
        client=ClientMock.new(mock_data)
        @perm=SimplePermissions.new(@db, client)
    end
    
    it 'should let root manage everything' do
        @perm.auth(0, gen_tokens(1, :create)).should == true
        @perm.auth(0, gen_tokens(1, :delete)).should == true
        @perm.auth(0, gen_tokens(1, :manage)).should == true
        @perm.auth(0, gen_tokens(1, :use)).should == true
    end
    
    it 'should let anyone use public objects' do
        @perm.auth(2, gen_tokens(1, :delete, :public => true)).
            should_not == true
        @perm.auth(2, gen_tokens(1, :manage, :public => true)).
            should_not == true
            
        # take out vm create (the first token) as it can not be "used" by
        # other users even if public
        @perm.auth(2, gen_tokens(1, :use, :public => true, :vm => false)).
            should == true
    end
    
    it 'should let users use their own objects' do
        @perm.auth(1, gen_tokens(1, :create, :host => false)).should == true
        @perm.auth(1, gen_tokens(1, :delete, :host => false)).should == true
        @perm.auth(1, gen_tokens(1, :manage, :host => false)).should == true
        @perm.auth(1, gen_tokens(1, :use)).should == true        
    end
end



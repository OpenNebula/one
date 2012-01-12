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

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+"/cli"

require 'command_parser'
require 'ozones_helper/zones_helper.rb'
require 'ozones_helper/vdc_helper.rb'

module OZones

    describe "oZones server regarding VDCs" do
        before(:all) do
            @zonehelper = 
                   ZonesHelper.new("zone", "ozonesadmin","ozonespassword")
            @vdchelper = 
                   VDCHelper.new("vdc", "ozonesadmin","ozonespassword")                 
            
            @clientA = OpenNebula::Client.new(File.read(
                                    File.dirname(__FILE__)+"/../etc/one_auth_a"), 
                                    "http://localhost:2636/RPC2")
                                    
            @clientB = OpenNebula::Client.new(File.read(
                        File.dirname(__FILE__)+"/../etc/one_auth_b"), 
                        "http://localhost:2637/RPC2")                        
            
            hostA=OpenNebula::Host.new(OpenNebula::Host.build_xml, @clientA)
            hostA.allocate("hostA1","im_dummy","vmm_dummy","tm_dummy")
            hostA.allocate("hostA2","im_dummy","vmm_dummy","tm_dummy")
            hostA.allocate("hostA3","im_dummy","vmm_dummy","tm_dummy")
            hostA.allocate("hostA4","im_dummy","vmm_dummy","tm_dummy")            
            
            hostB=OpenNebula::Host.new(OpenNebula::Host.build_xml, @clientB)
            hostB.allocate("hostB1","im_dummy","vmm_dummy","tm_dummy")
            hostB.allocate("hostB2","im_dummy","vmm_dummy","tm_dummy")
            hostB.allocate("hostB3","im_dummy","vmm_dummy","tm_dummy")            
        end
                
        it "should be able to create a couple of zones" do
            @zonehelper.create_resource(File.dirname(__FILE__)+
                                "/../templates/zoneA.template")[0].should eql(0)
            @zonehelper.create_resource(File.dirname(__FILE__)+
                                "/../templates/zoneB.template")[0].should eql(0)                   
        end  
        
        it "should be able to create one vdc with the apropiate ONE resources" do
            @vdchelper.create_resource(File.dirname(__FILE__)+
                "/../templates/vdcA.template")[0].should eql(0)
                
            upool = OpenNebula::UserPool.new(@clientA)
            upool.info
            userExist=false
            upool.each{|user| 
                if user['NAME'] == "vdcadminA"
                    userExist=true
                end
            }
            
            userExist.should eql(true)
            
            gpool = OpenNebula::GroupPool.new(@clientA)
            gpool.info
            groupExist=false
            gpool.each{|group| 
                if group['NAME'] == "vdcA"
                    groupExist=true
                end
            }            
            
            groupExist.should eql(true)
            
            apool = OpenNebula::AclPool.new(@clientA)
            apool.info
            # TODO check ACLs
        end
            
        it "should be able to create a couple of VDCs" do             
            @vdchelper.create_resource(File.dirname(__FILE__)+
               "/../templates/vdcB.template")[0].should eql(0)
            @vdchelper.create_resource(File.dirname(__FILE__)+
               "/../templates/vdcC.template")[0].should eql(0)
        end  
        
        it "should fail when creating an existing VDC" do             
            @vdchelper.create_resource(File.dirname(__FILE__)+
               "/../templates/vdcA.template")[0].should eql(-1)
        end  
        
        it "should fail when creating a VDC upon a non existing zone" do             
            @vdchelper.create_resource(File.dirname(__FILE__)+
               "/../templates/vdc.no.zone.template")[0].should eql(-1)
        end  
        
    end
end

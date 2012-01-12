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

module OZones

    describe "oZones server regarding zones" do
        before(:all) do
            @helper    = ZonesHelper.new("zone", "ozonesadmin","ozonespassword")  
            @badhelper = ZonesHelper.new("zone", "wronguser","wrongpassword")       
        end
                
        it "should be able to create a couple of zones" do
            @helper.create_resource(File.dirname(__FILE__)+
                                "/../templates/zoneA.template")[0].should eql(0)
            @helper.create_resource(File.dirname(__FILE__)+
                                "/../templates/zoneB.template")[0].should eql(0)                   
        end  
        
        it "should fail with wrong zones templates" do
            @helper.create_resource(File.dirname(__FILE__)+
             "/../templates/zone.wrong.credentials.template")[0].should eql(-1)
            @helper.create_resource(File.dirname(__FILE__)+
                 "/../templates/zone.wrong.endpoint.template")[0].should eql(-1)                   
        end  
        
        it "should fail when creating zones with existing name" do
            @helper.create_resource(File.dirname(__FILE__)+
             "/../templates/zoneA.template")[0].should eql(-1)                 
        end  
        
        it "should refuse unauthorized requests" do
            @badhelper.create_resource(File.dirname(__FILE__)+
                                "/../templates/zoneA.template")[0].should eql(-1)                   
        end  
    end
end
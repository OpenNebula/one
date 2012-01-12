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

# Load libraries
require 'rubygems'
require 'spec'
require 'json'
require File.dirname(__FILE__) + "/../../../Client/lib/OZonesClient.rb"

EXAMPLES_PATH = File.dirname(__FILE__) + "/../examples/"

describe 'OZones Pool' do
    before(:all) do
        @client_launched = true
        
        begin
            @ozones_client = OZonesClient::Client.new("http://localhost:6121")
        rescue Exception => e
            @client_launched = false
        end
        
        @client_launched.should == true
        
        rc = @ozones_client.post_resource(
                                  "zone",EXAMPLES_PATH + '/zone/zone0.template')
        rc.class.should_not eql(OZonesClient::Error)
        
        rc = @ozones_client.post_resource(
                                  "zone",EXAMPLES_PATH + '/zone/zone1.template')
        rc.class.should_not eql(OZonesClient::Error)
        
        rc = @ozones_client.post_resource(
                                     "vdc",EXAMPLES_PATH + '/vdc/vdc0.template')
        rc.class.should_not eql(OZonesClient::Error)
      
        rc = @ozones_client.post_resource(
                                     "vdc",EXAMPLES_PATH + '/vdc/vdc1.template')
        rc.class.should_not eql(OZonesClient::Error)
    
    end

    it "should be able to retrieve the zone pool" do
        zonepool = @ozones_client.get_pool("zone")
        zonepool.class.should eql(Net::HTTPOK)
        zonepool.body.should eql(
                             File.read(EXAMPLES_PATH+'/pool/zonepool0.json'))
    end
    
    it "should be able to retrieve the vdc pool" do
        vdcpool = @ozones_client.get_pool("vdc")
        vdcpool.class.should eql(Net::HTTPOK)
        vdcpool.body.should eql(
                             File.read(EXAMPLES_PATH+'/pool/vdcpool0.json'))
    end
    
    it "should be able to retrieve a particular zone" do
        zone0 = @ozones_client.get_resource("zone",1)
        zone0.class.should eql(Net::HTTPOK)
        zone0.body.should eql(
                             File.read(EXAMPLES_PATH+'/zone/zone0.json'))
    end
    
    it "should be able to retrieve a particular vdc" do
        vdc0 = @ozones_client.get_resource("vdc",1)
        vdc0.class.should eql(Net::HTTPOK)
        vdc0.body.should eql(
                             File.read(EXAMPLES_PATH+'/vdc/vdc0.json'))
    end
    
    it "should fail on zone recreation (with the same name)" do
        rc = @ozones_client.post_resource(
                                  "zone",EXAMPLES_PATH + '/zone/zone0.template')
        rc.class.should eql(OZonesClient::Error)
    end
    
    it "should fail on vdc recreation (with the same name)" do
        rc = @ozones_client.post_resource(
                                  "vdc",EXAMPLES_PATH + '/vdc/vdc0.template')
        rc.class.should eql(OZonesClient::Error)
    end
    
    it "should fail on vdc creation with no existing zone" do
        rc = @ozones_client.post_resource(
                                  "vdc",EXAMPLES_PATH + 
                                        '/vdc/vdc2nozone.template')
        rc.class.should eql(OZonesClient::Error)
    end
    
    it "should allow deleting a zone" do
        rc = @ozones_client.delete_resource("zone",2)
        rc.class.should eql(Net::HTTPOK)
        # Zone pool shouldn't account for the deleted zone
        zonepool = @ozones_client.get_pool("zone")
        zonepool.class.should eql(Net::HTTPOK)
        zonepool.body.should eql(
                             File.read(EXAMPLES_PATH+
                                       '/pool/zonepool1deleted.json')) 
    end
    
    it "should allow deleting a vdc" do
        rc = @ozones_client.delete_resource("vdc",2)
        rc.class.should eql(Net::HTTPOK)
        # Zone pool shouldn't account for the deleted zone
        vdcpool = @ozones_client.get_pool("vdc")
        vdcpool.class.should eql(Net::HTTPOK)
        vdcpool.body.should eql(
                             File.read(EXAMPLES_PATH+
                                       '/pool/vdcpool1deleted.json')) 
    end
    
    it "should fail on non existing zone deletion" do
        rc = @ozones_client.delete_resource("zone",5)
        rc.class.should eql(OZonesClient::Error)
    end
    
    it "should fail on non existing vdc deletion" do
        rc = @ozones_client.delete_resource("vdc",5)
        rc.class.should eql(OZonesClient::Error)
    end
end

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
require 'pp'

TESTS_PATH = File.dirname(__FILE__)+"/../"

module OZones

    describe "oZones server regarding VDCs" do
        before(:all) do
            @zonehelper =
                   ZonesHelper.new("zone", "ozonesadmin","ozonespassword")
            @vdchelper =
                   VDCHelper.new("vdc", "ozonesadmin","ozonespassword")

            @clientA = OpenNebula::Client.new(File.read(
                                    TESTS_PATH+"etc/one_auth_a"),
                                    "http://localhost:2666/RPC2")

            @clientB = OpenNebula::Client.new(File.read(
                                    TESTS_PATH+"etc/one_auth_b"),
                                    "http://localhost:2667/RPC2")

            clusterA = OpenNebula::Cluster.new(OpenNebula::Cluster.build_xml,
                                              @clientA)
            clusterA.allocate("clusterA")

            sleep 1

            clusterB = OpenNebula::Cluster.new(OpenNebula::Cluster.build_xml,
                                              @clientB)
            clusterB.allocate("clusterB")

            hostA=OpenNebula::Host.new(OpenNebula::Host.build_xml, @clientA)
            hostA.allocate("hostA1","im_dummy","vmm_dummy","dummy",100)
            hostA.allocate("hostA2","im_dummy","vmm_dummy","dummy",100)
            hostA.allocate("hostA3","im_dummy","vmm_dummy","dummy",100)
            hostA.allocate("hostA4","im_dummy","vmm_dummy","dummy",100)

            hostB=OpenNebula::Host.new(OpenNebula::Host.build_xml, @clientB)
            hostB.allocate("hostB1","im_dummy","vmm_dummy","dummy",100)
            hostB.allocate("hostB2","im_dummy","vmm_dummy","dummy",100)
            hostB.allocate("hostB3","im_dummy","vmm_dummy","dummy",100)

            ds_tmpl = File.new(TESTS_PATH+"templates/datastore.template").read
            dsA = OpenNebula::Datastore.new(OpenNebula::Datastore.build_xml, @clientA)
            dsA.allocate(ds_tmpl,100)

            sleep 1

            dsB = OpenNebula::Datastore.new(OpenNebula::Datastore.build_xml, @clientB)
            dsB.allocate(ds_tmpl,100)

            sleep 1

            vnet_tmpl = File.new(TESTS_PATH+"templates/vnet.template").read
            vnetA = OpenNebula::VirtualNetwork.new(OpenNebula::VirtualNetwork.build_xml, @clientA)
            rc = vnetA.allocate(vnet_tmpl,100)
            
            sleep 1

            vnetB = OpenNebula::VirtualNetwork.new(OpenNebula::VirtualNetwork.build_xml, @clientB)
            rc = vnetB.allocate(vnet_tmpl,100)
            
        end

        it "should be able to create a couple of zones" do
            rc = @zonehelper.create_resource(TESTS_PATH+"templates/zoneA.template")
            rc[0].should eql(0)
            
            sleep 1
            
            rc = @zonehelper.create_resource(TESTS_PATH+"templates/zoneB.template")
            rc[0].should eql(0)
        end

        it "should be able to create one vdc with apropiate ONE resources" do
            rc = @vdchelper.create_resource(TESTS_PATH+"templates/vdcA.template",
                                       {:force => false})

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
            @vdchelper.create_resource(TESTS_PATH+"templates/vdcB.template",
                                       {:force => true})[0].should eql(0)
            @vdchelper.create_resource(TESTS_PATH+"templates/vdcC.template",
                                       {:force => true})[0].should eql(0)
        end

        it "should fail when creating an existing VDC" do
            @vdchelper.create_resource(TESTS_PATH+"templates/vdcA.template",
                                       {:force => true})[0].should eql(-1)
        end

        it "should fail when creating a VDC upon a non existing zone" do
            @vdchelper.create_resource(TESTS_PATH+"templates/vdc.no.zone.template",
                                       {:force => false})[0].should eql(-1)
        end

        it "should be able to retrieve the vdc pool" do
            vdcpool = @vdchelper.list_pool({:json => true})
            vdcpool[0].should eql(0)

            got = vdcpool[1]
            expected = File.read(TESTS_PATH+"examples/pool/vdcpool0.json")

            got = JSON.parser.new(got, {:symbolize_names => true}).parse
            expected = JSON.parser.new(expected, {:symbolize_names => true}).parse
            got.should eql(expected)
        end

        it "should be able to retrieve a particular vdc" do
            vdc = @vdchelper.show_resource(1, {:json => true})
            vdc[0].should eql(0)
            
            got = vdc[1]
            expected = File.read(TESTS_PATH+"examples/vdc/vdc0.json")

            got = JSON.parser.new(got, {:symbolize_names => true}).parse
            expected = JSON.parser.new(expected, {:symbolize_names => true}).parse
            got.should eql(expected)
        end

        it "should allow deleting a vdc" do
            rc = @vdchelper.delete_resource(3, {})
            rc[0].should eql(0)
            rc = @vdchelper.list_pool({:json => true})
            rc[0].should eql(0)

            got = rc[1]
            expected = File.read(TESTS_PATH+"examples/pool/vdcpool_deleted.json")

            got = JSON.parser.new(got, {:symbolize_names => true}).parse
            expected = JSON.parser.new(expected, {:symbolize_names => true}).parse
            got.should eql(expected)
        end

        it "should fail on non-existing vdc deletion" do
            rc = @vdchelper.delete_resource(7, {})
            rc[0].should eql(-1)
        end
     end
end

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

TESTS_PATH = File.dirname(__FILE__)+"/../"

module OZones

    describe "oZones server regarding zones" do
        before(:all) do
            @helper    = ZonesHelper.new("zone", "ozonesadmin","ozonespassword")
            @badhelper = ZonesHelper.new("zone", "wronguser","wrongpassword")
        end

        it "should be able to create a couple of zones" do
            rc = @helper.create_resource(TESTS_PATH+"templates/zoneA.template")
            rc[0].should eql(0)

            sleep 1

            rc = @helper.create_resource(TESTS_PATH+"templates/zoneB.template")
            rc[0].should eql(0)
        end

        it "should fail with wrong zones templates" do
            templ_path = "templates/zone.wrong.credentials.template"
            rc = @helper.create_resource(TESTS_PATH+templ_path)
            rc[0].should eql(-1)

            templ_path = "templates/zone.wrong.endpoint.template"
            rc = @helper.create_resource(TESTS_PATH+templ_path)
            rc[0].should eql(-1)
        end

        it "should fail when creating zones with existing name" do
            rc = @helper.create_resource(TESTS_PATH+"templates/zoneA.template")
            rc[0].should eql(-1)
        end

        it "should refuse unauthorized requests" do
            rc = @badhelper.create_resource(TESTS_PATH+
                                            "templates/zoneA.template")
            rc[0].should eql(-1)
        end

        it "should be able to retrieve the zone pool" do
            zonepool = @helper.list_pool({:json => true})
            zonepool[0].should eql(0)

            got = zonepool[1]
            expected = File.read(TESTS_PATH+"examples/pool/zonepool0.json")

            got = JSON.parser.new(got, {:symbolize_names => true}).parse
            expected = JSON.parser.new(expected, {:symbolize_names => true}).parse
            got.should eql(expected)
        end

        it "should be able to retrieve a particular zone" do
            zone = @helper.show_resource(1,{:json => true})
            zone[0].should eql(0)

            got = zone[1]
            expected =  File.read(TESTS_PATH+"examples/zone/zone0.json")

            got = JSON.parser.new(got, {:symbolize_names => true}).parse
            expected = JSON.parser.new(expected, {:symbolize_names => true}).parse
            got.should eql(expected)
        end

        it "should allow deleting a zone" do
            rc = @helper.delete_resource(2, {})
            rc[0].should eql(0)
            rc = @helper.list_pool({:json => true})
            rc[0].should eql(0)

            got = rc[1]
            expected = File.read(TESTS_PATH+"examples/pool/zonepool_deleted.json")

            got = JSON.parser.new(got, {:symbolize_names => true}).parse
            expected = JSON.parser.new(expected, {:symbolize_names => true}).parse
            got.should eql(expected)
        end

        it "should fail on non existing zone deletion" do
            rc = @helper.delete_resource(7, {})
            rc[0].should eql(-1)
        end

    end
end

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

require File.expand_path(File.dirname(__FILE__) + '/spec_helper')

describe 'Host tests NOKOGIRI' do
    before(:all) do
        basic_authorize('oneadmin','opennebula')
        post '/login'
        last_response.status.should eql(204)

        @host0_s = File.read(EXAMPLES_PATH + '/host/host0.json')
        @host0_h = JSON.parse(@host0_s)

        @host1_s = File.read(EXAMPLES_PATH + '/host/host1.json')
        @host1_h = JSON.parse(@host1_s)

        @action_enable  = File.read(EXAMPLES_PATH + '/host/enable.json')
        @action_disable = File.read(EXAMPLES_PATH + '/host/disable.json')
        @wrong_action   = File.read(EXAMPLES_PATH + '/error/wrong_action.json')
    end

    it "should get empty host_pool information" do
        get '/host'

        last_response.body.should eql(File.read(FIXTURES_PATH + '/host/empty.json'))
        last_response.status.should eql(200)

        #json_response = JSON.parse(last_response.body)
        #json_response['HOST_POOL'].empty?.should eql(true)
    end

    it "should create a first host" do
        post '/host', @host0_s

        last_response.body.should eql(File.read(FIXTURES_PATH + '/host/host0.json'))
        last_response.status.should eql(201)
    end

    it "should create a second host" do
        post '/host', @host1_s

        last_response.body.should eql(File.read(FIXTURES_PATH + '/host/host1.json'))
        last_response.status.should eql(201)
    end

    it "should get host 0 information" do
        url = '/host/0'
        get url

        last_response.body.should eql(File.read(FIXTURES_PATH + '/host/host0.json'))
        last_response.status.should eql(200)
    end

    it "should disable host 0" do
        url = '/host/0/action'
        post url, @action_disable

        last_response.status.should eql(204)
    end

    it "should get host 0 information after disabling it" do
        url = '/host/0'
        get url

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['HOST']['STATE'].should eql("4")
    end

    it "should enable host 0" do
        url = '/host/0/action'
        post url, @action_enable

        last_response.status.should eql(204)
    end

    it "should get host 0 information after enabling it" do
        url = '/host/0'
        get url

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['HOST']['STATE'].should eql("0")
    end

    it "should get host 1 information" do
        url = '/host/1'
        get url

        last_response.body.should eql(File.read(FIXTURES_PATH + '/host/host1.json'))
        last_response.status.should eql(200)
    end

    it "should get host_pool information" do
        get '/host'

        last_response.body.should eql(File.read(FIXTURES_PATH + '/host/host_pool.json'))
        last_response.status.should eql(200)
    end

    it "should try to get host 3 information and check the error, because " <<
        "it does not exist" do
        get '/host/3'

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to enable host 3 and check the error, because " <<
        "it does not exist" do
        post '/host/3/action',  @action_enable
        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to disable a third host and check the error, because " <<
        "it does not exist" do
        post '/host/3/action',  @action_disable
        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to perform a wrong action and check the error" do
        post '/host/0/action', @wrong_action

        last_response.status.should eql(500)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should delete host 1" do
        url = '/host/1'
        delete url

        last_response.status.should eql(204)
    end

    it "should try to get the deleted host information and check the error" do
        url = '/host/1'
        get url

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end
end


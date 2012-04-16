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

describe 'VirtualNetwork tests' do
    before(:all) do
        basic_authorize('oneadmin','opennebula')
        post '/login'
        last_response.status.should eql(204)

        @ranged_vnet_s = File.read(EXAMPLES_PATH + '/vnet/ranged_vnet.json')
        @ranged_vnet_h = JSON.parse(@ranged_vnet_s)

        @fixed_vnet_s = File.read(EXAMPLES_PATH + '/vnet/fixed_vnet.json')
        @fixed_vnet_h = JSON.parse(@fixed_vnet_s)

        @action_publish   = File.read(EXAMPLES_PATH + '/vnet/publish.json')
        @action_unpublish = File.read(EXAMPLES_PATH + '/vnet/unpublish.json')
        @wrong_action     = File.read(EXAMPLES_PATH + '/error/wrong_action.json')
    end

    it "should get empty host_pool information" do
        get '/vnet'

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['VNET_POOL'].empty?.should eql(true)
    end

    it "should create a ranged VirtualNetwork" do
        post '/vnet', @ranged_vnet_s

        last_response.status.should eql(201)

        json_response = JSON.parse(last_response.body)
        json_response['VNET']['ID'].should eql("0")
    end

    it "should create a fixed VirtualNetwork" do
        post '/vnet', @fixed_vnet_s

        last_response.status.should eql(201)

        json_response = JSON.parse(last_response.body)
        json_response['VNET']['ID'].should eql("1")
    end

    it "should get VirtualNetwork 0 information" do
        url = '/vnet/0'
        get url

        File.open(FIXTURES_PATH + '/network/network0.json', 'w') { |f| 
            f.write last_response.body
        }

        last_response.body.should eql(File.read(FIXTURES_PATH + '/network/network0.json'))
        last_response.status.should eql(200)
    end

    it "should publish VirtualNetwork 0" do
        url = '/vnet/0/action'
        post url, @action_publish

        last_response.status.should eql(204)
    end

    it "should get VirtualNetwork 0 information after publishing it" do
        url = '/vnet/0'
        get url

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['VNET']['PERMISSIONS']['GROUP_U'].should eql("1")
    end

    it "should unpublish VirtualNetwork 0" do
        url = '/vnet/0/action'
        post url, @action_unpublish

        last_response.status.should eql(204)
    end

    it "should get VirtualNetwork 0 information after unpublishing it" do
        url = '/vnet/0'
        get url

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['VNET']['PERMISSIONS']['GROUP_U'].should eql("0")
    end


    it "should get VirtualNetwork 1 information" do
        url = '/vnet/1'
        get url

        File.open(FIXTURES_PATH + '/network/network1.json', 'w') { |f| 
            f.write last_response.body
        }

        last_response.body.should eql(File.read(FIXTURES_PATH + '/network/network1.json'))
        last_response.status.should eql(200)
    end

    it "should get vnet_pool information" do
        get '/vnet'

        File.open(FIXTURES_PATH + '/network/network_pool.json', 'w') { |f| 
            f.write last_response.body
        }

        last_response.body.should eql(File.read(FIXTURES_PATH + '/network/network_pool.json'))
        last_response.status.should eql(200)
    end

    it "should try to get VirtualNetwork 3 information and check the error, because " <<
        "it does not exist" do
        get '/vnet/3'

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to publish VirtualNetwork 3 and check the error, because " <<
        "it does not exist" do
        post '/vnet/3/action', @action_publish

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to unpublish VirtualNetwork 3 and check the error, because " <<
        "it does not exist" do
        post '/vnet/3/action', @action_unpublish

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to perform a wrong action and check the error" do
        post '/vnet/0/action', @wrong_action

        last_response.status.should eql(500)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should delete VirtualNetwork 1" do
        url = '/vnet/1'
        delete url

        last_response.status.should eql(204)
    end

    it "should try to get the deleted VirtualNetwork information and check the error" do
        url = '/vnet/1'
        get url

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end
end

# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

describe 'Cluster tests' do
    before(:all) do
        basic_authorize('oneadmin','opennebula')
        post '/login'
        last_response.status.should eql(204)

        @host0_s = File.read(EXAMPLES_PATH + '/host/host0.json')
        post '/host', @host0_s
        last_response.status.should eql(201)

        @cluster1_s = File.read(EXAMPLES_PATH + '/cluster/cluster1.json')
        @cluster1_h = JSON.parse(@cluster1_s)

        @cluster2_s = File.read(EXAMPLES_PATH + '/cluster/cluster2.json')
        @cluster2_h = JSON.parse(@cluster2_s)

        @action_addhost = File.read(EXAMPLES_PATH + '/cluster/addhost.json')
        @action_rmhost  = File.read(EXAMPLES_PATH + '/cluster/rmhost.json')
        @wrong_action   = File.read(EXAMPLES_PATH + '/error/wrong_action.json')
    end

    it "should create a first cluster" do
        post '/cluster', @cluster1_s

        last_response.status.should eql(201)

        json_response = JSON.parse(last_response.body)
        json_response['CLUSTER']['ID'].should eql("1")
    end

    it "should create a second cluster" do
        post '/cluster', @cluster2_s

        last_response.status.should eql(201)

        json_response = JSON.parse(last_response.body)
        json_response['CLUSTER']['ID'].should eql("2")
    end

    it "should get Cluster 1 information" do
        get '/cluster/1'

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['CLUSTER']['NAME'].should eql(@cluster1_h['cluster']['name'])
    end

    it "should add Host 0 to Cluster 1" do
        post '/cluster/1/action', @action_addhost

        last_response.status.should eql(204)
    end

    it "should get Host 0 information after adding it to the Cluster 1" do
        get '/host/0'

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['HOST']['CLUSTER'].should eql("cluster_one")
    end

    it "should remove Host 0 from Cluster 1" do
        post '/cluster/1/action', @action_rmhost

        last_response.status.should eql(204)
    end

    it "should get Host 0 information after removing it from Cluster 1" do
        get '/host/0'

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['HOST']['CLUSTER'].should eql("default")
    end

    it "should get Cluster 2 information" do
        get '/cluster/2'

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['CLUSTER']['NAME'].should eql(@cluster2_h['cluster']['name'])
    end

    it "should get cluster_pool information" do
        get '/cluster'

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['CLUSTER_POOL']['CLUSTER'].size.should eql(3)
        json_response['CLUSTER_POOL']['CLUSTER'].each do |cluster|
            if cluster['ID'] == '1'
                cluster['NAME'].should eql(@cluster1_h['cluster']['name'])
            elsif cluster['ID'] == '2'
                cluster['NAME'].should eql(@cluster2_h['cluster']['name'])
            else
                cluster['NAME'].should eql("default")
            end
        end
    end

    it "should try to get Cluster 3 information and check the error, because " <<
        "it does not exist" do
        get '/cluster/3'

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to add Host 0 to Cluster 3 and check the error, because " <<
        "it does not exist" do
        post '/cluster/3/action',  @action_addhost
        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to remove Host 0 from Cluster 3 and check the error, " <<
        "because it does not exist" do
        post '/cluster/3/action',  @action_removehost
        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to perform a wrong action and check the error" do
        post '/cluster/0/action', @wrong_action

        last_response.status.should eql(500)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should delete the Cluster 2" do
        delete '/cluster/2'

        last_response.status.should eql(204)
    end

    it "should try to get the deleted Cluster information and check the error" do
        url = '/cluster/2'
        get url

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end
end

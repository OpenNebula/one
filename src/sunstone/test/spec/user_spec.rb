# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

describe 'User tests' do
    before(:all) do
        basic_authorize('oneadmin','opennebula')
        post '/login'
        last_response.status.should eql(204)

        @user1_s = File.read(EXAMPLES_PATH + '/user/user1.json')
        @user1_h = JSON.parse(@user1_s)

        @user2_s = File.read(EXAMPLES_PATH + '/user/user2.json')
        @user2_h = JSON.parse(@user2_s)

        @action_passwd = File.read(EXAMPLES_PATH + '/user/passwd.json')
        @action_passwd_h = JSON.parse(@action_passwd)
        @wrong_action  = File.read(EXAMPLES_PATH + '/error/wrong_action.json')
    end

    it "should create a first User" do
        post '/user', @user1_s

        last_response.status.should eql(201)

        json_response = JSON.parse(last_response.body)
        json_response['USER']['ID'].should eql("2")
    end

    it "should create a second User" do
        post '/user', @user2_s

        last_response.status.should eql(201)

        json_response = JSON.parse(last_response.body)
        json_response['USER']['ID'].should eql("3")
    end

    it "should get User 1 information" do
        url = '/user/2'
        get url

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['USER']['NAME'].should eql(@user1_h['user']['name'])
        password = Digest::SHA1.hexdigest(@user1_h['user']['password'])
        json_response['USER']['PASSWORD'].should eql(password)
    end

    it "should change User 1 password" do
        url = '/user/2/action'
        post url, @action_passwd

        last_response.status.should eql(204)
    end

    it "should get User 1 information after changing its password" do
        url = '/user/2'
        get url

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['USER']['NAME'].should eql(@user1_h['user']['name'])
        password = Digest::SHA1.hexdigest(@action_passwd_h['action']['params']['password'])
        json_response['USER']['PASSWORD'].should eql(password)
    end

    it "should get User 2 information" do
        url = '/user/3'
        get url

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['USER']['NAME'].should eql(@user2_h['user']['name'])
        password = Digest::SHA1.hexdigest(@user2_h['user']['password'])
        json_response['USER']['PASSWORD'].should eql(password)
    end

    it "should get user_pool information" do
        get '/user'

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['USER_POOL']['USER'].size.should eql(4)
        json_response['USER_POOL']['USER'].each do |user|
            if user['ID'] == '2'
                user['NAME'].should eql(@user1_h['user']['name'])
                password = Digest::SHA1.hexdigest(@action_passwd_h['action']['params']['password'])
                user['PASSWORD'].should eql(password)
            elsif user['ID'] == '3'
                user['NAME'].should eql(@user2_h['user']['name'])
                password = Digest::SHA1.hexdigest(@user2_h['user']['password'])
                user['PASSWORD'].should eql(password)
            end
        end
    end

    it "should try to get User 3 information and check the error, because " <<
        "it does not exist" do
        get '/user/4'

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to change password of User 3 and check the error, because " <<
        "it does not exist" do
        post '/user/4/action',  @action_passwd
        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to perform a wrong action and check the error" do
        post '/user/0/action', @wrong_action

        last_response.status.should eql(500)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should delete User 2" do
        url = '/user/3'
        delete url

        last_response.status.should eql(204)
    end

    it "should try to get the deleted User information and check the error" do
        url = '/user/3'
        get url

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end
end

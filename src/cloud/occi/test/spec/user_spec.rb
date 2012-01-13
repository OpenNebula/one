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

describe 'OCCI User tests' do
    before(:all) do
        @username_1 = "my_first_occi_user"
        @userpass_1 = "my_first_occi_pass"
        `oneuser create #{@username_1} #{@userpass_1}`
    end

    it "should list the user collection" do
        basic_authorize('oneadmin','4478db59d30855454ece114e8ccfa5563d21c9bd')
        get '/user'

        last_response.status.should eql(200)

        xml_body = last_response.body

        user_collection = File.read(FIXTURES_PATH + '/user/user_collection.xml')

        xml_body.strip.should eql(user_collection.strip)
    end


    it "should check the error if the user collection is retrieved by a non oneadmin user" do
        basic_authorize('my_first_occi_user','c08c5a6c535b6060b7b2af34e0d2f0ffb7e63b28')
        get '/user'

        last_response.status.should eql(403)
    end

    it "should show the user information, no quotas and no usage" do
        basic_authorize('oneadmin','4478db59d30855454ece114e8ccfa5563d21c9bd')
        get '/user/0'

        last_response.status.should eql(200)

        xml_body = last_response.body

        user = File.read(FIXTURES_PATH + '/user/user.xml')

        xml_body.strip.should eql(user.strip)
    end

    it "should get a 404 error when trying to get a non existing user" do
        basic_authorize('oneadmin','4478db59d30855454ece114e8ccfa5563d21c9bd')
        get '/user/99'

        last_response.status.should eql(404)
    end

    it "should get a 403 error when trying to get a different user" do
        basic_authorize('my_first_occi_user','c08c5a6c535b6060b7b2af34e0d2f0ffb7e63b28')
        get '/user/0'

        last_response.status.should eql(403)
    end
end

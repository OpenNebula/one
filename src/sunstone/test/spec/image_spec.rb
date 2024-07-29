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

describe 'Image tests' do
    before(:all) do
        basic_authorize('oneadmin','opennebula')
        post '/login'
        last_response.status.should eql(204)

        @image0_s = File.read(EXAMPLES_PATH + '/image/image0.json')
        @image0_h = JSON.parse(@image0_s)

        @image1_s = File.read(EXAMPLES_PATH + '/image/image1.json')
        @image1_h = JSON.parse(@image1_s)

        @action_enable  = File.read(EXAMPLES_PATH + '/image/enable.json')
        @action_disable = File.read(EXAMPLES_PATH + '/image/disable.json')

        @action_nonpersistent = File.read(EXAMPLES_PATH + '/image/nonpersistent.json')
        @action_persistent = File.read(EXAMPLES_PATH + '/image/persistent.json')

        @action_publish = File.read(EXAMPLES_PATH + '/image/publish.json')
        @action_unpublish = File.read(EXAMPLES_PATH + '/image/unpublish.json')

        @action_update = File.read(EXAMPLES_PATH + '/image/update.json')
        @action_removeattr = File.read(EXAMPLES_PATH + '/image/removeattr.json')

        @wrong_action   = File.read(EXAMPLES_PATH + '/error/wrong_action.json')
    end

    it "should create a first Image" do
        post '/image', @image0_s


        File.open(FIXTURES_PATH + '/image/image0.json', 'w') { |f|
            f.write last_response.body
        }

        last_response.body.should eql(File.read(FIXTURES_PATH + '/image/image0.json'))
        last_response.status.should eql(201)
    end

    it "should create a second Image" do
        post '/image', @image1_s

        File.open(FIXTURES_PATH + '/image/image1.json', 'w') { |f|
            f.write last_response.body
        }

        last_response.body.should eql(File.read(FIXTURES_PATH + '/image/image1.json'))
        last_response.status.should eql(201)
    end

    it "should get Image 0 information" do
        url = '/image/0'
        get url

        last_response.body.should eql(File.read(FIXTURES_PATH + '/image/image0.json'))
        last_response.status.should eql(200)
    end

    ############################################################################
    # Publish / Unpublish
    ############################################################################
    it "should publish Image 0" do
        url = '/image/0/action'
        post url, @action_publish

        last_response.status.should eql(204)
    end

    it "should get Image 0 information after publishing it" do
        url = '/image/0'
        get url

        json_response = JSON.parse(last_response.body)
        json_response['IMAGE']['PERMISSIONS']['GROUP_U'].should eql("1")
        last_response.status.should eql(200)
    end

    it "should unpublish Image 0" do
        url = '/image/0/action'
        post url, @action_unpublish

        last_response.status.should eql(204)
    end

    it "should get Image 0 information after unpublishing it" do
        url = '/image/0'
        get url

        json_response = JSON.parse(last_response.body)
        json_response['IMAGE']['PERMISSIONS']['GROUP_U'].should eql("0")
        last_response.status.should eql(200)
    end

    ############################################################################
    # Persistent / NonPersstent
    ############################################################################
    it "should do Image 0 persistent" do
        url = '/image/0/action'
        post url, @action_persistent

        last_response.status.should eql(204)
    end

    it "should get Image 0 information after doing it persistent" do
        url = '/image/0'
        get url

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['IMAGE']['PERSISTENT'].should eql("1")
    end

    it "should do Image 0 nonpersistent" do
        url = '/image/0/action'
        post url, @action_nonpersistent

        last_response.status.should eql(204)
    end

    it "should get Image 0 information after doing it nonpersistent" do
        url = '/image/0'
        get url

        last_response.status.should eql(200)

        json_response = JSON.parse(last_response.body)
        json_response['IMAGE']['PERSISTENT'].should eql("0")
    end

    ############################################################################
    # Disable / Enable
    ############################################################################
#    it "should disable Image 0" do
#        url = '/image/0/action'
#        post url, @action_disable
#
#        last_response.status.should eql(204)
#    end
#
#    it "should Image 0 information after disabling it" do
#        url = '/image/0'
#        get url
#
#        last_response.status.should eql(200)
#
#        json_response = JSON.parse(last_response.body)
#        json_response['IMAGE']['STATE'].should eql("3")
#    end
#
#    it "should enable Image 0" do
#        url = '/image/0/action'
#        post url, @action_enable
#
#        last_response.status.should eql(204)
#    end
#
#    it "should get Image 0 information after enabling it" do
#        url = '/image/0'
#        get url
#
#        last_response.status.should eql(200)
#
#        json_response = JSON.parse(last_response.body)
#        json_response['IMAGE']['STATE'].should eql("1")
#    end

#    ############################################################################
#    # Update / Remove attr
#    ############################################################################
#    it "should add a new attribute to Image 0" do
#        url = '/image/0/action'
#        post url, @action_update
#
#        last_response.status.should eql(204)
#    end
#
#    it "should get first Image information after adding a new attribute" do
#        url = '/image/0'
#        get url
#
#        last_response.status.should eql(200)
#
#        json_response = JSON.parse(last_response.body)
#        json_response['IMAGE']['TEMPLATE']['FOO'].should eql("mock")
#    end
#
#    it "should remove an attribute from Image 0" do
#        url = '/image/0/action'
#        post url, @action_removeattr
#
#        last_response.status.should eql(204)
#    end
#
#    it "should get Image 0 information after removing an attribute" do
#        url = '/image/0'
#        get url
#
#        last_response.status.should eql(200)
#
#        json_response = JSON.parse(last_response.body)
#        json_response['IMAGE']['TEMPLATE']['FOO'].should eql(nil)
#    end
#
#
#    it "should get Image 1 information" do
#        url = '/image/1'
#        get url
#
#        last_response.status.should eql(200)
#
#        json_response = JSON.parse(last_response.body)
#        json_response['IMAGE']['NAME'].should eql(@image1_h['image']['name'])
#        json_response['IMAGE']['TYPE'].should eql("1")
#        json_response['IMAGE']['TEMPLATE']['SIZE'].should eql(@image1_h['image']['size'])
#    end

    ############################################################################
    # Pool
    ############################################################################
    it "should get image_pool information" do
        get '/image'

        File.open(FIXTURES_PATH + '/image/image_pool.json', 'w') { |f|
            f.write last_response.body
        }

        last_response.body.should eql(File.read(FIXTURES_PATH + '/image/image_pool.json'))
        last_response.status.should eql(200)
    end

    ############################################################################
    # Delete
    ############################################################################
    it "should delete Image 1" do
        url = '/image/1'
        delete url

        last_response.status.should eql(204)
    end

    ############################################################################
    # Errors
    ############################################################################
    it "should try to get Image 3 information and check the error, because " <<
        "it does not exist" do
        get '/image/3'

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to publish Image 3 and check the error, because " <<
        "it does not exist" do
        post '/image/3/action', @action_publish

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to unpublish Image 3 and check the error, because " <<
        "it does not exist" do
        post '/image/3/action', @action_unpublish

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to perform a wrong action and check the error" do
        post '/image/0/action', @wrong_action

        last_response.status.should eql(500)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end

    it "should try to get the deleted Image information and check the error" do
        url = '/image/1'
	sleep 2
        get url

        last_response.status.should eql(404)

        json_response = JSON.parse(last_response.body)
        json_response['error']['message'].should_not eql(nil)
    end
end

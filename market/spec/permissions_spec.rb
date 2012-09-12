require File.expand_path(File.dirname(__FILE__) + '/spec_helper')
require 'pp'
describe 'MarketPlace User tests' do
    describe "admin" do
        before(:each) do
            basic_authorize('admin','password')
        end

        it "should exist in the DB after bootstraping" do
            get "/user"

            body = JSON.parse last_response.body

            body['users'].size.should eql(1)

            $first_oid = body['users'].first['_id']['$oid']

            body['users'].first['username'].should == 'admin'
            body['users'].first['password'].should == 'password'
            body['users'].first['role'].should == 'admin'
        end

        it "should be able to retrieve his metadata" do
            get "/user/#{$first_oid}"

            body = JSON.parse last_response.body

            body['_id']['$oid'].should == $first_oid
            body['username'].should == 'admin'
            body['password'].should == 'password'
            body['role'].should == 'admin'
        end

        it "should be able to create new users" do
            post '/user', File.read(EXAMPLES_PATH + '/user.json')

            body = JSON.parse last_response.body

            $new_oid = body['_id']['$oid']
        end

        it "should be able to retrieve metadata of the new user" do
            get "/user/#{$new_oid}"

            body = JSON.parse last_response.body

            body['_id']['$oid'].should == $new_oid
            body['username'].should == 'new_user'
            body['password'].should == 'new_pass'
            body['role'].should == 'user'
        end

        it "should be able to retrieve the list of users including the new one" do
            get "/user"

            body = JSON.parse last_response.body

            body['users'].size.should eql(2)

            body['users'][0]['_id']['$oid'].should == $first_oid
            body['users'][0]['username'].should == 'admin'
            body['users'][0]['password'].should == 'password'
            body['users'][0]['role'].should == 'admin'

            body['users'][1]['_id']['$oid'].should == $new_oid
            body['users'][1]['username'].should == 'new_user'
            body['users'][1]['password'].should == 'new_pass'
            body['users'][1]['role'].should == 'user'
        end
    end

   describe "user" do
        before(:each) do
            basic_authorize('new_user','new_pass')
        end

        it "should not be able to retrieve the list of users" do
            get "/user"

            last_response.status.should eql(401)
        end

        it "should not be able to retrieve his metadata" do
            get "/user/#{$first_oid}"

            last_response.status.should eql(401)
        end

        it "should not be able to create new users" do
            post '/user', File.read(EXAMPLES_PATH + '/user.json')

            last_response.status.should eql(401)
        end

        it "should not be able to list the users" do
            get "/user"

            last_response.status.should eql(401)
        end
    end

   describe "anonymous (no basic_auth is provided)" do
        it "should not be able to retrieve the list of users" do
            get "/user"

            last_response.status.should eql(401)
        end

        it "should not be able to retrieve his metadata" do
            get "/user/#{$first_oid}"

            last_response.status.should eql(401)
        end

        it "should not be able to create new users" do
            post '/user', File.read(EXAMPLES_PATH + '/user.json')

            last_response.status.should eql(401)
        end

        it "should not be able to list the users" do
            get "/user"

            last_response.status.should eql(401)
        end
    end
end

describe 'MarketPlace Appliance tests' do
    describe "admin" do
        before(:each) do
            basic_authorize('admin','password')
        end

        it "should be able to retrieve the list of appliances" do
            get "/appliance"

            body = JSON.parse last_response.body

            body['appliances'].size.should eql(0)
        end

        it "should be able to create new appliances" do
            post '/appliance', File.read(EXAMPLES_PATH + '/appliance.json')

            body = JSON.parse last_response.body

            $new_oid = body['_id']['$oid']
        end

        it "should be able to retrieve metadata of the new appliance" do
            get "/appliance/#{$new_oid}"

            body = JSON.parse last_response.body


            body['_id']['$oid'].should == $new_oid
            body['name'].should == 'Ubuntu Server 12.04 LTS (Precise Pangolin)'
        end

        it "should be able to retrieve restricted fields url, vistis and downloads" do
            get "/appliance/#{$new_oid}"

            body = JSON.parse last_response.body


            body['_id']['$oid'].should == $new_oid
            body['name'].should == 'Ubuntu Server 12.04 LTS (Precise Pangolin)'

            body['files'][0]['url'].should == 'http://appliances.c12g.com/Ubuntu-Server-12.04/ubuntu-server-12.04.img.bz2'

            body['visits'].should == 1
            body['downloads'].should == 0
        end

        it "should be able to retrieve the download link" do
            get "/appliance/#{$new_oid}/download"

            last_response.status == 302
            last_response.headers['Location'] == "http://appliances.c12g.com/Ubuntu-Server-12.04/ubuntu-server-12.04.img.bz2"
        end

        it "should be able to retrieve updated restricted fields url, vistis and downloads" do
            get "/appliance/#{$new_oid}"

            body = JSON.parse last_response.body


            body['_id']['$oid'].should == $new_oid
            body['name'].should == 'Ubuntu Server 12.04 LTS (Precise Pangolin)'

            body['files'][0]['url'].should == 'http://appliances.c12g.com/Ubuntu-Server-12.04/ubuntu-server-12.04.img.bz2'

            body['visits'].should == 2
            body['downloads'].should == 1
        end

        it "should be able to retrieve the list of appliances including the new one" do
            get "/appliance"

            body = JSON.parse last_response.body

            body['appliances'].size.should eql(1)

            body['appliances'][0]['_id']['$oid'].should == $new_oid
            body['appliances'][0]['name'].should == 'Ubuntu Server 12.04 LTS (Precise Pangolin)'
        end
    end

   describe "user" do
        before(:each) do
            basic_authorize('new_user','new_pass')
        end

        it "should be able to retrieve the list of appliances" do
            get "/appliance"

            body = JSON.parse last_response.body

            body['appliances'].size.should eql(1)

            body['appliances'][0]['_id']['$oid'].should == $new_oid
            body['appliances'][0]['name'].should == 'Ubuntu Server 12.04 LTS (Precise Pangolin)'
        end

        it "should be able to create new appliances" do
            post '/appliance', File.read(EXAMPLES_PATH + '/appliance2.json')

            body = JSON.parse last_response.body

            $new_oid2 = body['_id']['$oid']
        end

        it "should be able to retrieve metadata of the new appliance" do
            get "/appliance/#{$new_oid2}"

            body = JSON.parse last_response.body


            body['_id']['$oid'].should == $new_oid2
            body['name'].should == 'CentOS 6.2'
        end

        it "should not be able to retrieve restricted fields url, vistis and downloads" do
            get "/appliance/#{$new_oid}"

            body = JSON.parse last_response.body


            body['_id']['$oid'].should == $new_oid
            body['name'].should == 'Ubuntu Server 12.04 LTS (Precise Pangolin)'

            body['files'][0]['url'].should == nil
            body['visits'].should == nil
            body['downloads'].should == nil
        end

        it "should be able to retrieve the download link" do
            get "/appliance/#{$new_oid}/download"

            last_response.status == 302
            last_response.headers['Location'] == "http://appliances.c12g.com/Ubuntu-Server-12.04/ubuntu-server-12.04.img.bz2"
        end

        it "should be able to retrieve the list of appliances including the new one" do
            get "/appliance"

            body = JSON.parse last_response.body

            body['appliances'].size.should eql(2)

            body['appliances'][0]['_id']['$oid'].should == $new_oid
            body['appliances'][0]['name'].should == 'Ubuntu Server 12.04 LTS (Precise Pangolin)'
            body['appliances'][1]['_id']['$oid'].should == $new_oid2
            body['appliances'][1]['name'].should == 'CentOS 6.2'
        end
    end

   describe "anonymous (no basic_auth is provided)" do
        it "should  be able to retrieve the list of appliances" do
            get "/appliance"

            body = JSON.parse last_response.body

            body['appliances'].size.should eql(2)

            body['appliances'][0]['_id']['$oid'].should == $new_oid
            body['appliances'][0]['name'].should == 'Ubuntu Server 12.04 LTS (Precise Pangolin)'
            body['appliances'][1]['_id']['$oid'].should == $new_oid2
            body['appliances'][1]['name'].should == 'CentOS 6.2'
        end

        it "should be able to retrieve metadata of the  appliance" do
            get "/appliance/#{$new_oid}"

            body = JSON.parse last_response.body

            body['_id']['$oid'].should == $new_oid
            body['name'].should == 'Ubuntu Server 12.04 LTS (Precise Pangolin)'
        end

        it "should not be able to retrieve restricted fields url, vistis and downloads" do
            get "/appliance/#{$new_oid}"

            body = JSON.parse last_response.body


            body['_id']['$oid'].should == $new_oid
            body['name'].should == 'Ubuntu Server 12.04 LTS (Precise Pangolin)'

            body['files'][0]['url'].should == nil
            body['visits'].should == nil
            body['downloads'].should == nil
        end

        it "should be able to retrieve the download link" do
            get "/appliance/#{$new_oid}/download"

            last_response.status == 302
            last_response.headers['Location'] == "http://appliances.c12g.com/Ubuntu-Server-12.04/ubuntu-server-12.04.img.bz2"
        end

        it "should not be able to create new appliances" do
            post '/appliance', File.read(EXAMPLES_PATH + '/appliance.json')

            last_response.status.should eql(401)
        end
    end
end
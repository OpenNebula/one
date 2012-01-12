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
    # PREREQUISITES
    # OpenNebula installed and running using dummy drivers

    before(:all) do
        # Starting the drivers
        sleep 2

        system("onehost create myhost im_dummy vmm_dummy tm_dummy").should == true

        system("oneimage create #{TEMPLATES_PATH+"/image1.template"}").should == true
        system("oneimage create #{TEMPLATES_PATH+"/image2.template"}").should == true

        # Copying the images
        sleep 1

        system("onevm create #{TEMPLATES_PATH+"/vm.template"}").should == true
        system("onevm deploy 0 0").should == true
    end

    it "should show the new compute" do
        basic_authorize('oneadmin','4478db59d30855454ece114e8ccfa5563d21c9bd')
        get '/compute/0'

        last_response.body.should == File.read(FIXTURES_PATH+"/vm_save_as/newcompute.xml")
    end

    it "should get an error when trying to change the resource state and save a disk " do
        basic_authorize('oneadmin','4478db59d30855454ece114e8ccfa5563d21c9bd')
        body = File.read(FIXTURES_PATH+"/vm_save_as/save_a_disk_and_change_state.xml")
        put '/compute/0', body

        last_response.status.should == 403
    end

    it "should get an error when trying to save two disks" do
        basic_authorize('oneadmin','4478db59d30855454ece114e8ccfa5563d21c9bd')
        body = File.read(FIXTURES_PATH+"/vm_save_as/save_two_disks.xml")
        put '/compute/0', body

        last_response.status.should == 403
    end

    it "should save the first disk" do
        basic_authorize('oneadmin','4478db59d30855454ece114e8ccfa5563d21c9bd')
        body = File.read(FIXTURES_PATH+"/vm_save_as/save_first_disk.xml")
        put '/compute/0', body

        last_response.status.should == 202
    end

    it "should save the second disk" do
        basic_authorize('oneadmin','4478db59d30855454ece114e8ccfa5563d21c9bd')
        body = File.read(FIXTURES_PATH+"/vm_save_as/save_second_disk.xml")
        put '/compute/0', body

        last_response.status.should == 202
    end
end
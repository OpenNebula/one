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

# The following methods are helpers defined in spec_helper
# 	- compare_xml
# 	- get_fixture
# 	- network_template
# 	- storage_template
# 	- compute_template

describe 'OCCI  tests' do
	before(:all) do
		@user_oneadmin  = "my_first_occi_user"
		`oneuser create #{@user_oneadmin} my_pass`.scan(/^ID: (\d+)/) { |uid|
			`oneuser show #{uid.first}`.scan(/PASSWORD\s*:\s*(\w*)/) { |password|
				@user_pass =  password.first.strip
			}

			`oneuser chgrp #{uid.first} 0`
		}

		@user_users  = "my_second_occi_user"
		`oneuser create #{@user_users} my_pass2`.scan(/^ID: (\d+)/) { |uid|
			`oneuser show #{uid.first}`.scan(/PASSWORD\s*:\s*(\w*)/) { |password|
				@user_pass2 =  password.first.strip
			}
		}

		# Define BRIDGE attirbute in network.erb, otherwise the NETWORK creation will 
		`sed -i.bck "s%^#\\(BRIDGE = \\).*$%\\1 br0%" $ONE_LOCATION/etc/occi_templates/network.erb`
	end

	describe "with a user of the oneadmin group" do
		before(:each) do
			basic_authorize(@user_oneadmin, @user_pass)
		end

		it "should retrieve the list of collections" do
			get '/'
			compare_xml(last_response.body, get_fixture('/root.xml'))
			last_response.status.should == 200
		end

		it "should retrieve the list of INSTANCE_TYPEs" do
			get '/instance_type'
			compare_xml(last_response.body, get_fixture('/instance_type/list.xml'))
			last_response.status.should == 200
		end

		it "should retrieve the extended list of INSTANCE_TYPEs" do
			get '/instance_type', {'verbose'=>true}
			compare_xml(last_response.body, get_fixture('/instance_type/extended.xml'))
			last_response.status.should == 200
		end

		context "for NETWORK" do
			it "should retrieve the empty list" do
				get '/network'
				compare_xml(last_response.body, get_fixture('/network/empty.xml'))
				last_response.status.should == 200
			end

			it "should create a new NETWORK" do
				network = {
					:name 		 => "Network",
					:description => "Network of the user #{@user_oneadmin}",
					:address	 => "192.168.1.0",
					:size		 => "100",
					:pubic	     => "YES"
				}

				post '/network', network_template(network)
				compare_xml(last_response.body, get_fixture('/network/first_net.xml'))
				last_response.status.should == 201
			end

			it "should retrieve the NETWORK with ID 0" do
				get '/network/0'
				compare_xml(last_response.body, get_fixture('/network/first_net.xml'))
				last_response.status.should == 200
			end
		end

		context "for STORAGE" do
			it "should retrieve the empty list" do
				get '/storage'
				compare_xml(last_response.body, get_fixture('/storage/empty.xml'))
				last_response.status.should == 200
			end

			it "should create a new STORAGE, type DATABLOCK. This request waits until the IMAGE is ready in OpenNebula" do
				storage = {
					:name 		 => "Storage",
					:description => "Storage of the user #{@user_oneadmin}",
					:type   	 => "DATABLOCK",
					:size		 => "100",
					:fstype	     => "ext3"
				}

				post '/storage', {'occixml' => storage_template(storage)}
				compare_xml(last_response.body, get_fixture('/storage/first_storage.xml'))
				last_response.status.should == 201
			end

			it "should retrieve the STORAGE with ID 0" do
				get '/storage/0'
				compare_xml(last_response.body, get_fixture('/storage/first_storage.xml'))
				last_response.status.should == 200
			end
		end

		context "for COMPUTE" do
			it "should retrieve the empty list" do
				get '/compute'
				compare_xml(last_response.body, get_fixture('/compute/empty.xml'))
				last_response.status.should == 200
			end

			it "should create a new COMPUTE using the previous NETWORK (ID=0) and STORAGE(ID=0)" do
				compute = {
					:name 		   => "Compute",
					:instance_type => "small",
					:disk          => [ {:storage => '0'} ],
					:nic           => [ {:network => '0'} ]
				}

				post '/compute', compute_template(compute)
				compare_xml(last_response.body, get_fixture('/compute/first_compute.xml'))
				last_response.status.should == 201
			end

			it "should retrieve the COMPUTE with ID 0" do
				get '/compute/0'
				compare_xml(last_response.body, get_fixture('/compute/first_compute.xml'))
				last_response.status.should == 200
			end

			it "should terminate (DONE) the COMPUTE with ID 0" do
				compute = {
					:id    => "0",
					:state => "DONE"
				}

				put '/compute/0', compute_action(compute)
				compare_xml(last_response.body, get_fixture('/compute/first_compute_done.xml'))
				last_response.status.should == 202
			end
		end
	end

	describe "with a user of the users group" do
		before(:each) do
			basic_authorize(@user_users, @user_pass2)
		end

		it "should retrieve the list of collections" do
			get '/'
			compare_xml(last_response.body, get_fixture('/root.xml'))
			last_response.status.should == 200
		end

		it "should retrieve the list of INSTANCE_TYPEs" do
			get '/instance_type'
			compare_xml(last_response.body, get_fixture('/instance_type/list.xml'))
			last_response.status.should == 200
		end

		it "should retrieve the extended list of INSTANCE_TYPEs" do
			get '/instance_type', {'verbose'=>true}
			compare_xml(last_response.body, get_fixture('/instance_type/extended.xml'))
			last_response.status.should == 200
		end

		context "for NETWORK" do
			it "should retrieve the empty list" do
				get '/network'
				compare_xml(last_response.body, get_fixture('/network/empty.xml'))
				last_response.status.should == 200
			end

			it "should create a new NETWORK" do
				network = {
					:name 		 => "Network2",
					:description => "Network of the user #{@user_users}",
					:address	 => "192.168.2.0",
					:size		 => "100",
					:pubic	     => "YES"
				}

				post '/network', network_template(network)
				compare_xml(last_response.body, get_fixture('/network/second_net.xml'))
				last_response.status.should == 201
			end

			it "should retrieve the NETWORK with ID 1" do
				get '/network/1'
				compare_xml(last_response.body, get_fixture('/network/second_net.xml'))
				last_response.status.should == 200
			end
		end

		context "for STORAGE" do
			it "should retrieve the empty list" do
				get '/storage'
				compare_xml(last_response.body, get_fixture('/storage/empty.xml'))
				last_response.status.should == 200
			end

			it "should create a new STORAGE, type DATABLOCK. This request waits until the IMAGE is ready in OpenNebula" do
				storage = {
					:name 		 => "Storage2",
					:description => "Storage of the user #{@user_users}",
					:type   	 => "DATABLOCK",
					:size		 => "100",
					:fstype	     => "ext3"
				}

				post '/storage', {'occixml' => storage_template(storage)}
				compare_xml(last_response.body, get_fixture('/storage/second_storage.xml'))
				last_response.status.should == 201
			end

			it "should retrieve the STORAGE with ID 1" do
				get '/storage/1'
				compare_xml(last_response.body, get_fixture('/storage/second_storage.xml'))
				last_response.status.should == 200
			end
		end

		context "for COMPUTE" do
			it "should retrieve the empty list" do
				get '/compute'
				compare_xml(last_response.body, get_fixture('/compute/empty.xml'))
				last_response.status.should == 200
			end

			it "should create a new COMPUTE using the previous NETWORK (ID=1) and STORAGE(ID=1)" do
				compute = {
					:name 		   => "Compute2",
					:instance_type => "small",
					:disk          => [ {:storage => '1'} ],
					:nic           => [ {:network => '1'} ]
				}

				post '/compute', compute_template(compute)
				compare_xml(last_response.body, get_fixture('/compute/second_compute.xml'))
				last_response.status.should == 201
			end

			it "should retrieve the COMPUTE with ID 1" do
				get '/compute/1'
				compare_xml(last_response.body, get_fixture('/compute/second_compute.xml'))
				last_response.status.should == 200
			end

			it "should terminate (DONE) the COMPUTE with ID 1" do
				compute = {
					:id    => "1",
					:state => "DONE"
				}

				put '/compute/1', compute_action(compute)
				compare_xml(last_response.body, get_fixture('/compute/second_compute_done.xml'))
				last_response.status.should == 202
			end
		end
	end
end
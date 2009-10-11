# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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

require 'repo_manager'
require 'Configuration'
require 'OpenNebula'

###############################################################################
# This class represents a generic Cloud Server using the OpenNebula Cloud
# API (OCA). Any cloud implementation should derive from this class
###############################################################################
class CloudServer

    ###########################################################################
    # Public attributes
    ###########################################################################
    attr_reader :config
    attr_reader :one_client

    # Initializes the Cloud server based on a config file
    # config_file:: _String_ for the server. MUST include the following 
    # variables:
    #   USER
    #   PASSWORD
    #   VM_TYPE
    #   IMAGE_DIR
    #   DATABASE
    def initialize(config_file)

        # --- Load the Cloud Server configuration file ---

        @config = Configuration.new(config_file)
        @auth   = "#{@config[:user]}:#{@config[:password]}"
        
        @instance_types = Hash.new

        if @config[:vm_type].kind_of?(Array)
            @config[:vm_type].each {|type|
                @instance_types[type['NAME']]=type
            }
        else
            @instance_types[@config[:vm_type]['NAME']]=@config[:vm_type]
        end

        # --- Start a Repository Manager ---
    
        Image.image_dir = @config[:image_dir]
        @rm = RepoManager.new(@config[:database])

        # --- Start an OpenNebula Session ---
        
        @one_client = Client.new(@auth)
        @user_pool  = UserPool.new(@one_client)
    end

    # Generates an OpenNebula Session for the given user
    # user_name:: _String_ the name of the user   
    def one_client_user(user_name)
 
        if !user
            error = OpenNebula::Error.new("User not found")
            return error
        end
    
        client = Client.new("dummy:dummy")
        client.one_auth = "#{user[:name]}:#{user[:password]}"
    
        return client
    end

    def authenticate?(name, password)
        user = get_user(name)

        return user && user.password == password
    end

private
    def get_user(name)
        user = nil
    
        @user_pool.info
        @user_pool.each{ |u|
            if u.name==name
                user=Hash.new

                user[:id]       = u.id
                user[:name]     = u.name
                user[:password] = u[:password]
            end
        }
        return user
   end
end




















require 'pp'

include OpenNebula


set :host, CONFIG[:server]
set :port, CONFIG[:port]


EC2_STATES={
    :pending => {:code => 0, :name => 'pending'},
    :running => {:code => 16, :name => 'running'},
    :shutdown => {:code => 32, :name => 'shutting-down'},
    :terminated => {:code => 48, :name => 'terminated'}
}

ONE_STATES={
    'init' => :pending,
    'pend' => :pending,
    'hold' => :pending,
    'stop' => :pending,
    'susp' => :pending,
    'done' => :terminated,
    'fail' => :terminated,
    'prol' => :pend,
    'boot' => :running,
    'runn' => :running,
    'migr' => :running,
    'save' => :pend,
    'epil' => :shutdown,
    'shut' => :shutdown,
    'fail' => :terminated,
    'dele' => :terminated,
    'unkn' => :terminated
}

$repoman=RepoManager.new

def get_one_client
    Client.new(AUTH)
end

def get_one_client_user(user_name)
    user=get_user(user_name)
    
    
    auth="#{user[:name]}:#{user[:password]}"
    
    client=Client.new("dummy:dummy")
    client.one_auth=auth
    client
end

def get_user(name)
    user=nil
    
    user_pool=UserPool.new(get_one_client)
    user_pool.info
    user_pool.each{|u|
        if u.name==name
            user=Hash.new
            user[:id]=u.id
            user[:name]=u.name
            user[:password]=u[:password]
        end
    }
    
    user
end

def render_state(vm)
    one_state=vm.status
    ec2_state=EC2_STATES[ONE_STATES[one_state]]
    
    "<code>#{ec2_state[:code]}</code> 
    <name>#{ec2_state[:name]}</name>"
end

def render_launch_time(vm)
    "<launchTime>#{Time.at(vm[:stime].to_i).xmlschema}</launchTime>"
end

def authenticate(params)
    user_name=params['AWSAccessKeyId']
    user=get_user(user_name)
    
    halt 401, "User does not exist" if !user
    
    signature_params=params.reject {|key,value| 
        key=='Signature' or key=='file' }
    canonical=AWS.canonical_string(signature_params, CONFIG[:server])
    signature=AWS.encode(user[:password], canonical, false)
    
    halt 401, "Bad password" if params['Signature']!=signature
end

before do
    authenticate(params)
end


def upload_image(params)
    user=get_user(params['AWSAccessKeyId'])
    file=params["file"]
    
    # tmpfile where the file is stored
    f_tmp=file[:tempfile]
    img=$repoman.add(user[:id], f_tmp.path)
    f_tmp.unlink
    
    @img_id=img.uuid

    erb :register_image
end

def register_image(params)
    user=get_user(params['AWSAccessKeyId'])
    uuid=params['ImageLocation']
    
    img=$repoman.get(uuid)
    
    halt 404, 'Image not found' if !img
    halt 401, 'Not permited to use image' if user[:id]!=img[:owner]
    
    @img_id=img.uuid

    erb :register_image
end

def describe_images(params)
    @user=get_user(params['AWSAccessKeyId'])

    @images=Image.filter(:owner => @user[:id])
    
    pp @images
    
    erb :describe_images
end


def run_instances(params)
    @user=get_user(params['AWSAccessKeyId'])
    
    image_id=params['ImageId']
    image=$repoman.get(image_id)
    
    @vm_info=Hash.new
    @vm_info[:img_path]=image.path
    @vm_info[:img_id]=image_id
    
    instance_type_name=params['InstanceType']
    instance_type=INSTANCE_TYPES[instance_type_name]
    
    halt 400, "Bad instance type" if !instance_type
    
    @vm_info[:instance_type]=instance_type_name
    
    template=ERB.new(File.read(
        TEMPLATES_LOCATION+"/#{instance_type['TEMPLATE']}"))
    template_text=template.result(binding)
    
    pp template_text
    
    vm=VirtualMachine.new(
        VirtualMachine.build_xml, get_one_client_user(@user[:name]))
    response=vm.allocate(template_text)
    
    vm.info
    
    @vm_info[:vm_id]=vm.id
    @vm_info[:vm]=vm
    
    erb :run_instances
end

def describe_instances(params)
    @user=get_user(params['AWSAccessKeyId'])
    
    client=get_one_client_user(@user[:name])

    if @user[:id]==0
        user_flag=-2
    else
        user_flag=-1
    end

    @vmpool=VirtualMachinePool.new(client, user_flag)
    @vmpool.info
    
    erb :describe_instances
end

def terminate_instances(params)
    @user=get_user(params['AWSAccessKeyId'])
    vmid=params['InstanceId.1']
    
    client=get_one_client_user(@user[:name])
    @vm=VirtualMachine.new(VirtualMachine.build_xml(vmid), client)
    res=@vm.info
    
    halt 401, res.message if OpenNebula::is_error?(res)
    
    if @vm.status=='runn'
        res=@vm.shutdown
    else
        res=@vm.finalize
    end
    
    halt 401, res.message if OpenNebula::is_error?(res)
    
    erb :terminate_instances
end

post '/' do
    pp params
    
    case params['Action']
    when 'UploadImage'
        upload_image(params)
    when 'RegisterImage'
        register_image(params)
    when 'DescribeImages'
        describe_images(params)
    when 'RunInstances'
        run_instances(params)
    when 'DescribeInstances'
        describe_instances(params)
    when 'TerminateInstances'
        terminate_instances(params)
    end
end


__END__

@@ register_image
<RegisterImageResponse xmlns="http://ec2.amazonaws.com/doc/2009-04-04/"> 
  <imageId><%= @img_id %></imageId> 
</RegisterImageResponse>


@@ describe_images
<DescribeImagesResponse xmlns="http://ec2.amazonaws.com/doc/2009-04-04/"> 
  <imagesSet> 
  <% for image in @images %>
    <item> 
      <imageId><%= image.uuid %></imageId> 
      <imageLocation><%= image.path %></imageLocation> 
      <imageState>available</imageState> 
      <imageOwnerId><%= @user[:name] %></imageOwnerId> 
      <isPublic>false</isPublic> 
      <architecture>i386</architecture> 
      <imageType>machine</imageType> 
    </item> 
  <% end %>
  </imagesSet> 
</DescribeImagesResponse> 


@@ run_instances
<RunInstancesResponse xmlns="http://ec2.amazonaws.com/doc/2009-04-04/"> 
  <reservationId>r-47a5402e</reservationId> 
  <ownerId><%= @user[:name] %></ownerId> 
  <groupSet> 
    <item> 
      <groupId>default</groupId> 
    </item> 
  </groupSet> 
  <instancesSet> 
    <item> 
      <instanceId><%= @vm_info[:vm_id] %></instanceId> 
      <imageId><%= @vm_info[:img_id] %></imageId> 
      <instanceState> 
        <code>0</code> 
        <name>pending</name> 
      </instanceState> 
      <privateDnsName><%= @vm_info[:vm]["TEMPLATE/NIC/IP"]%></privateDnsName> 
      <dnsName><%= @vm_info[:vm]["TEMPLATE/NIC/IP"]%></dnsName> 
      <keyName>default</keyName> 
      <amiLaunchIndex>0</amiLaunchIndex> 
      <instanceType><%= @vm_info[:instance_type] %></instanceType> 
      <%= render_launch_time(@vm_info[:vm]) %>
      <placement> 
        <availabilityZone>default</availabilityZone> 
      </placement> 
      <monitoring> 
        <enabled>true</enabled> 
      </monitoring> 
    </item> 
  </instancesSet> 
</RunInstancesResponse> 

@@ describe_instances
<DescribeInstancesResponse xmlns="http://ec2.amazonaws.com/doc/2009-04-04/"> 
  <reservationSet> 
    <item> 
      <reservationId>default</reservationId> 
      <ownerId><%= @user[:name] %></ownerId> 
      <groupSet> 
        <item> 
          <groupId>default</groupId> 
        </item> 
      </groupSet> 
      <instancesSet> 
        <% @vmpool.each do |vm| %>
        <% vm.info %>
        <item> 
          <instanceId><%= vm.id %></instanceId> 
          <imageId><%= vm['TEMPLATE/IMAGE_ID'] %></imageId> 
          <instanceState> 
              <%= render_state(vm) %>
          </instanceState> 
          <privateDnsName><%= vm["TEMPLATE/NIC/IP"] %></privateDnsName> 
          <dnsName><%= vm["TEMPLATE/NIC/IP"] %></dnsName> 
          <keyName>default</keyName> 
          <amiLaunchIndex>0</amiLaunchIndex> 
          <instanceType><%= vm['TEMPLATE/INSTANCE_TYPE'] %></instanceType> 
          <%= render_launch_time(vm) %>
          <placement> 
            <availabilityZone>default</availabilityZone> 
          </placement> 
        </item> 
        <% end %>
      </instancesSet>
    </item>
  </reservationSet>
</DescribeInstancesResponse>

@@ terminate_instances
<TerminateInstancesResponse xmlns="http://ec2.amazonaws.com/doc/2009-04-04/"> 
  <instancesSet> 
    <item> 
      <instanceId><%= @vm.id %></instanceId> 
      <shutdownState> 
        <code>32</code> 
        <name>shutting-down</name> 
      </shutdownState> 
      <previousState> 
          <%= render_state(@vm) %>
      </previousState>
    </item>
  </instancesSet> 
</TerminateInstancesResponse> 



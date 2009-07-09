
require 'rubygems'
require 'sinatra'
require 'EC2'

$: << './OpenNebulaApi'
$: << './lib'

require 'OpenNebula'
require 'repo_manager'
require 'OcaConfiguration'

require 'pp'

include OpenNebula




CONFIG=OcaConfiguration.new('oca.conf')
AUTH="#{CONFIG[:user]}:#{CONFIG[:password]}"

INSTANCE_TYPES=Hash.new

pp CONFIG

if CONFIG[:vm_type].kind_of?(Array)
    # Multiple instance types
    CONFIG[:vm_type].each {|type|
        INSTANCE_TYPES[type['NAME']]=type
    }
else
    # When only one instance type is defined
    INSTANCE_TYPES[CONFIG[:vm_type]['NAME']]=CONFIG[:vm_type]
end

pp INSTANCE_TYPES

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

def authenticate(params)
    user_name=params['AWSAccessKeyId']
    user=get_user(user_name)
    
    halt 401, "User does not exist" if !user
    
    signature_params=params.reject {|key,value| key=='Signature' }
    canonical=EC2.canonical_string(signature_params, CONFIG[:server])
    signature=EC2.encode(user[:password], canonical, false)
    
    halt 401, "Bad password" if params['Signature']!=signature
end

before do
    authenticate(params)
end


def register_image(params)
    user=get_user(params['AWSAccessKeyId'])
    
    img=$repoman.add(user[:id], params["ImageLocation"])
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
    
    template=ERB.new(File.read("templates/#{instance_type['TEMPLATE']}"))
    template_text=template.result(binding)
    
    pp template_text
    
    vm=VirtualMachine.new(VirtualMachine.build_xml, get_one_client)
    response=vm.allocate(template_text)
    
    pp response
    
    @vm_info[:vm_id]=vm.id
    
    erb :run_instances
end

def describe_instances(params)
    @user=get_user(params['AWSAccessKeyId'])
    
    @vmpool=VirtualMachinePool.new(get_one_client)
    @vmpool.info
    
    erb :describe_instances
end

post '/' do
    pp params
    
    case params['Action']
    when 'RegisterImage'
        register_image(params)
    when 'DescribeImages'
        describe_images(params)
    when 'RunInstances'
        run_instances(params)
    when 'DescribeInstances'
        describe_instances(params)
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
      <privateDnsName></privateDnsName> 
      <dnsName></dnsName> 
      <keyName>example-key-name</keyName> 
      <amiLaunchIndex>0</amiLaunchIndex> 
      <instanceType>m1.small</instanceType> 
      <launchTime>2007-08-07T11:51:50.000Z</launchTime> 
      <placement> 
        <availabilityZone>us-east-1b</availabilityZone> 
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
        <item> 
          <instanceId><%= vm.id %></instanceId> 
          <imageId><%= vm.id %></imageId> 
          <instanceState> 
              <%= render_state(vm) %>
          </instanceState> 
          <privateDnsName>10-251-50-132.ec2.internal</privateDnsName> 
          <dnsName>ec2-72-44-33-4.compute-1.amazonaws.com</dnsName> 
          <keyName>example-key-name</keyName> 
          <amiLaunchIndex>23</amiLaunchIndex> 
          <productCodesSet> 
            <item><productCode>774F4FF8</productCode></item> 
          </productCodesSet> 
          <instanceType>m1.large</instanceType> 
          <launchTime>2007-08-07T11:54:42.000Z</launchTime> 
          <placement> 
            <availabilityZone>us-east-1b</availabilityZone> 
          </placement> 
        </item> 
        <% end %>
      </instancesSet>
    </item>
  </reservationSet>
</DescribeInstancesResponse>
  


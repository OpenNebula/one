################################################
# Find out where the needed ruby libraries are
################################################
ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    TEMPLATES_LOCATION=ONE_LOCATION+"/etc/occi_templates"
    CONF_LOCATION=ONE_LOCATION+"/etc"
end

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+"/occi"
$: << RUBY_LIB_LOCATION+"/econe" # For the Repository Manager

################################################
# Required libraries
################################################
require 'rubygems'
require 'sinatra'
require 'time'
require 'pp'

require 'OpenNebula'
require 'OCCI'


include OpenNebula

CONFIG=OCCIConfiguration.new(CONF_LOCATION+'/occi-server.conf')
AUTH="#{CONFIG[:user]}:#{CONFIG[:password]}"
ONE_RM_DATABASE=CONFIG[:database]

# Load Repository Manager here to use ONE_RM_DATABASE from the configuration file
require 'repo_manager'
Image.image_dir=CONFIG[:image_dir]

INSTANCE_TYPES=Hash.new

puts "######################################"
puts "       OCCI Server configuration       "
puts "######################################"
puts "---------8<---------------------" 
pp CONFIG
puts "------>8------------------------"

if CONFIG[:vm_type].kind_of?(Array)
    # Multiple instance types
    CONFIG[:vm_type].each {|type|
        INSTANCE_TYPES[type['NAME']]=type
    }
else
    # When only one instance type is defined
    INSTANCE_TYPES[CONFIG[:vm_type]['NAME']]=CONFIG[:vm_type]
end

puts "######################################"
puts "      OCCI Available Instances Types   "
puts "######################################"
puts "---------8<---------------------"
pp INSTANCE_TYPES
puts "------>8------------------------"

set :host, CONFIG[:server]
set :port, CONFIG[:port]

# Start repository manager
$repoman=RepoManager.new

################################################
# Client builders for ONE communication
################################################

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

###################################################
# Helpers to manage authentication & authorization
###################################################


helpers do

  def protected!
    response['WWW-Authenticate'] = %(Basic realm="Testing HTTP Auth") and \
    throw(:halt, [401, "Not authorized\n"]) and \
    return unless authorized?
  end

  def authorized?

    @auth ||=  Rack::Auth::Basic::Request.new(request.env)

    if !(@auth.provided? && @auth.basic? && @auth.credentials)
        return false
    end 
    
    user = get_user(@auth.credentials.first)
        
    if user
        if user[:password] == @auth.credentials[1]
            return true
        end
    else
        return false
    end
  end

end

###################################################
# Helper functions
###################################################


def submit_vm(params)

    if params['occixml']
        @vm_info=Crack::XML.parse(params['occixml'])
    else
        halt 400, "OCCI XML representation of VM not present" 
    end
    
    @vm_info=@vm_info['COMPUTE']
    
    if @vm_info['STORAGE'].class==Array
        disks=@vm_info['STORAGE']
    else
        disks=[@vm_info['STORAGE']]
    end
    
    disks.each{|disk|
        next if disk['DISK']==nil
        image=$repoman.get(disk['DISK']['image'])
        disk['DISK']['source']=image.path
    }
    
    @vm_info['STORAGE']=disks[0]
    
    
    if @vm_info['NETWORK']['NIC'].class==Array
        nics=@vm_info['NETWORK']['NIC']
    else
        nics=[@vm_info['NETWORK']['NIC']]
    end

    nics.each{|nic|
        vn=VirtualNetwork.new(VirtualNetwork.build_xml(nic['network']), get_one_client)
        vn.info
        vn_xml=Crack::XML.parse(vn.to_xml)
        nic['network_id']=nic['network']
        nic['network']=vn_xml['VNET']['NAME'].strip
    }
    
    @vm_info['NETWORK']['NIC']=nics
    
    instance_type_name=params['InstanceType']
    instance_type=INSTANCE_TYPES[instance_type_name]

    halt 400, "Bad instance type" if !instance_type

    @vm_info[:instance_type]=instance_type_name

    template=ERB.new(File.read(
         TEMPLATES_LOCATION+"/#{instance_type['TEMPLATE']}"))
    template_text=template.result(binding)
    
    vm=VirtualMachineOCCI.new(
        VirtualMachine.build_xml, get_one_client_user(@auth.credentials[0]))
    response=vm.allocate(template_text)
    
    if OpenNebula.is_error?(response)
        status 400
        response.to_str
    else
        vm.info    
        vm.to_occi
    end
end

def change_state(params)
    if params['occixml']
        vm_info=Crack::XML.parse(params['occixml'])
    else
        halt 400, "OCCI XML representation of VM not present" 
    end
    
    vm=VirtualMachineOCCI.new(
        VirtualMachine.build_xml(params[:id]), get_one_client_user(@auth.credentials[0]))
        
    halt 400, "State not defined in the OCCI XML, cannot change state" if !vm_info['COMPUTE']['STATE']
     
    case vm_info['COMPUTE']['STATE']
        when "stopped" 
            rc = vm.stop
        when "suspended"
            rc = vm.suspend
        when "resume"
            rc = vm.resume
        when "cancel"
            rc = vm.cancel
        when "done"  
            rc = vm.finalize  
        else
            halt 400, "Invalid state"
    end
    
    if OpenNebula.is_error?(rc)
        status 400
        response.to_str
    else
        status 202
        response_text = "Changing state of VM " + params[:id] + " to " + vm_info['COMPUTE']['STATE']    
    end
end

###################################################
# Pool Resources methods
###################################################

post '/compute' do
    # Auth check 
    protected!   
     
    submit_vm(params)
end

get '/compute' do  
    # Auth check  
    protected!
    # Info retrieval
    vmpool = VirtualMachinePoolOCCI.new(get_one_client)
    vmpool.info
    # OCCI conversion
    begin
        vmpool.to_occi(CONFIG[:server]+":"+CONFIG[:port])
    rescue Exception => e
        error = OpenNebula::Error.new(e.message)
        return error
    end
end

post '/network' do
    # Auth check  
    protected!
    # Info retrieval from post params
    if params
        network_info=Crack::XML.parse(params.to_s)
    else
        halt 400, "OCCI XML representation of Virtual Network not present in the request" 
    end
    # Allocate the VirtualNetwork  
    network = VirtualNetworkOCCI.new(
                    VirtualNetwork.build_xml,
                    get_one_client_user(@auth.credentials[0]))
      
    vntemplate = network.to_one_template(network_info['NIC'],CONFIG[:bridge])
    rc         = network.allocate(vntemplate)
    
    # Return status 201 XML if correct, status 500 otherwise
    if rc
        halt 500, "Error creating the Virtual Network: " + rc
    else
        network.info
        status 201
        network.to_occi
    end  
end

get '/network' do
    # Auth check  
    protected!
    # Info retrieval
    network_pool = VirtualNetworkPoolOCCI.new(get_one_client)
    network_pool.info
    # OCCI conversion
    begin
        network_pool.to_occi(CONFIG[:server]+":"+CONFIG[:port])
    rescue Exception => e
        error = OpenNebula::Error.new(e.message)
        return error
    end
end

post '/storage' do
    # Auth check  
    protected!
    # Info retrieval from post params
    if params['occixml']
        image_info=Crack::XML.parse(params['occixml'])
    else
        halt 400, "OCCI XML representation of Image not present in the request" 
    end
    
    if params['file']
        file=params["file"]
    else
        halt 400, "File not present in the request" 
    end
    
    user = get_user(@auth.credentials[0])

    # tmpfile where the file is stored
    f_tmp=file[:tempfile]
    img=$repoman.add(user[:id], f_tmp.path)
    f_tmp.unlink
    
    img.get_image_info
    img.change_metadata(:name=>image_info['DISK']['NAME'])
    img.change_metadata(:description=>image_info['DISK']['URL'])

    xml_response = "<DISK><ID>" + img.uuid + "</ID>" + 
                          "<NAME>" + image_info['DISK']['NAME'] + "</NAME>" +
                          "<SIZE>" + ((img.size/1024)/1024).to_s + "</SIZE>" +
                          "<URL>"  + image_info['DISK']['URL'] + "<URL>" + 
                   "</DISK>"
                  
    status 201
    xml_response
end

get '/storage' do
    # Auth check  
    protected!
    # Retrieve images owned by this user
    user = get_user(@auth.credentials[0])
    images=Image.filter(:owner => user[:id])
    
    image_pool = "<STORAGE>"
    for image in images do
        image_pool += "<DISK id=\"#{image[:uuid]}\" href=\"http://#{CONFIG[:server]}:#{CONFIG[:port]}/storage/#{image[:uuid]}\">"
    end
    image_pool += "</STORAGE>"
    image_pool
end

###################################################
# Entity Resources Methods
###################################################

get '/compute/:id' do  
    protected!
    vm = VirtualMachineOCCI.new(VirtualMachine.build_xml(params[:id]),get_one_client_user(@auth.credentials[0]))
    vm.info
    begin
        vm.to_occi()
    rescue Exception => e
        error = OpenNebula::Error.new(e.message)
        return error
    end
end

delete '/compute/:id' do
    protected!
    vm = VirtualMachineOCCI.new(VirtualMachine.build_xml(params[:id]),get_one_client_user(@auth.credentials[0]))
    vm.finalize
    "The Compute resource has been successfully deleted"
end

post '/compute/:id' do
    protected!

    change_state(params)    
end

get '/network/:id' do  
    protected!
    vn = VirtualNetworkOCCI.new(VirtualNetwork.build_xml(params[:id]),get_one_client_user(@auth.credentials[0]))
    vn.info
    begin
        vn.to_occi()
    rescue Exception => e
        error = OpenNebula::Error.new(e.message)
        return error
    end
end

delete '/network/:id' do
    protected!
    vn = VirtualNetworkOCCI.new(VirtualNetwork.build_xml(params[:id]),get_one_client_user(@auth.credentials[0]))
    vn.delete
    "The Virtual Network has been successfully deleted"
end

get '/storage/:id' do  
    protected!
    image=$repoman.get(params[:id])
    
    image.get_image_info
    
    if image
        xml_response = "<DISK><ID>" + image.uuid + "</ID>" + 
                              "<NAME>" + image.name + "</NAME>" +
                              "<SIZE>" + ((image.size/1024)/1024).to_s + "</SIZE>" +
                              "<URL>"  + image.description  + "<URL>" + 
                       "</DISK>"
    else
        status 404
        "Disk with id = \"" + params[:id] + "\" not found"
    end
end

delete '/storage/:id' do
    protected!
    "Not yet implemented"
end






################################################
# Find out where the needed ruby libraries are
################################################
ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    TEMPLATES_LOCATION=ONE_LOCATION+"/etc/vmi_templates"
    CONF_LOCATION=ONE_LOCATION+"/etc"
end

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+"/vmiserver"

################################################
# Required libraries
################################################
require 'rubygems'
require 'sinatra'
require 'time'
require 'pp'

require 'OpenNebula'
require 'VMI'


include OpenNebula

CONFIG=VMIConfiguration.new(CONF_LOCATION+'/vmi-server.conf')
AUTH="#{CONFIG[:user]}:#{CONFIG[:password]}"
ONE_RM_DATABASE=CONFIG[:database]

# Load Repository Manager here to use ONE_RM_DATABASE from the configuration file
require 'repo_manager'
Image.image_dir=CONFIG[:image_dir]

INSTANCE_TYPES=Hash.new

puts "######################################"
puts "       VMI Server configuration       "
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
puts "      VMI Available Instances Types   "
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

    if params['vmixml']
        @vm_info=Crack::XML.parse(params['vmixml'])
    else
        halt 400, "VMI XML representation of VM not present" 
    end
    
    @vm_info=@vm_info['VM']
    
    if @vm_info['DISKS'].class==Array
        disks=@vm_info['DISKS']
    else
        disks=[@vm_info['DISKS']]
    end
    
    disks.each{|disk|
        next if disk['DISK']==nil
        image=$repoman.get(disk['DISK']['image'])
        disk['DISK']['source']=image.path
    }
    
    @vm_info['DISKS']=disks[0]
    
    
    if @vm_info['NICS']['NIC'].class==Array
        nics=@vm_info['NICS']['NIC']
    else
        nics=[@vm_info['NICS']['NIC']]
    end

    nics.each{|nic|
        vn=VirtualNetwork.new(VirtualNetwork.build_xml(nic['network']), get_one_client)
        vn.info
        vn_xml=Crack::XML.parse(vn.to_xml)
        nic['network_id']=nic['network']
        nic['network']=vn_xml['VNET']['NAME'].strip
    }
    
    @vm_info['NICS']['NIC']=nics
    
    instance_type_name=params['InstanceType']
    instance_type=INSTANCE_TYPES[instance_type_name]

    halt 400, "Bad instance type" if !instance_type

    @vm_info[:instance_type]=instance_type_name

    template=ERB.new(File.read(
         TEMPLATES_LOCATION+"/#{instance_type['TEMPLATE']}"))
    template_text=template.result(binding)
    
    vm=VirtualMachineVMI.new(
        VirtualMachine.build_xml, get_one_client_user(@auth.credentials[0]))
    response=vm.allocate(template_text)
    
    if OpenNebula.is_error?(response)
        status 400
        response.to_str
    else
        vm.info    
        vm.to_vmi
    end
end

def change_state(params)
    if params['vmixml']
        vm_info=Crack::XML.parse(params['vmixml'])
    else
        halt 400, "VMI XML representation of VM not present" 
    end
    
    vm=VirtualMachineVMI.new(
        VirtualMachine.build_xml(params[:id]), get_one_client_user(@auth.credentials[0]))
        
    halt 400, "State not defined in the VMI XML, cannot change state" if !vm_info['VM']['STATE']
     
    case vm_info['VM']['STATE']
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
        response_text = "Changing state of VM " + params[:id] + " to " + vm_info['VM']['STATE']    
    end
end

###################################################
# Pool Resources methods
###################################################

post '/vms' do
    # Auth check 
    protected!   
     
    submit_vm(params)
end

get '/vms' do  
    # Auth check  
    protected!
    # Info retrieval
    vmpool = VirtualMachinePoolVMI.new(get_one_client)
    vmpool.info
    # VMI conversion
    begin
        vmpool.to_vmi(CONFIG[:server])
    rescue Exception => e
        error = OpenNebula::Error.new(e.message)
        return error
    end
end

post '/networks' do
    # Auth check  
    protected!
    # Info retrieval from post params
    if params['vmixml']
        network_info=Crack::XML.parse(params['vmixml'])
    else
        halt 400, "VMI XML representation of Virtual Network not present in the request" 
    end
    # Allocate the VirtualNetwork  
    network = VirtualNetworkVMI.new(
                    VirtualNetwork.build_xml,
                    get_one_client_user(@auth.credentials[0]))
             
    vntemplate = network.to_one_template(network_info['NETWORK'],CONFIG[:bridge])
    rc         = network.allocate(vntemplate)
    
    # Return status 201 XML if correct, status 500 otherwise
    if rc
        halt 500, "Error creating the Virtual Network: " + rc
    else
        network.info
        status 201
        network.to_vmi
    end  
end

get '/networks' do
    # Auth check  
    protected!
    # Info retrieval
    network_pool = VirtualNetworkPoolVMI.new(get_one_client)
    network_pool.info
    # VMI conversion
    begin
        network_pool.to_vmi(CONFIG[:server])
    rescue Exception => e
        error = OpenNebula::Error.new(e.message)
        return error
    end
end

post '/images' do
    # Auth check  
    protected!
    # Info retrieval from post params
    if params['vmixml']
        image_info=Crack::XML.parse(params['vmixml'])
    else
        halt 400, "VMI XML representation of Image not present in the request" 
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
    img.change_metadata(:name=>image_info['IMAGE']['NAME'])
    img.change_metadata(:description=>image_info['IMAGE']['URL'])

    xml_response = "<IMAGE><ID>" + img.uuid + "</ID>" + 
                          "<NAME>" + image_info['IMAGE']['NAME'] + "</NAME>" +
                          "<SIZE>" + ((img.size/1024)/1024).to_s + "</SIZE>" +
                          "<URL>"  + image_info['IMAGE']['URL'] + "<URL>" + 
                   "</IMAGE>"
                  
    status 201
    xml_response
end

get '/images' do
    # Auth check  
    protected!
    # Retrieve images owned by this user
    user = get_user(@auth.credentials[0])
    images=Image.filter(:owner => user[:id])
    
    image_pool = "<IMAGES>"
    for image in images do
        image_pool += "<IMAGE id=\"#{image[:uuid]}\" href=\"http://#{CONFIG[:server]}/images/#{image[:uuid]}\">"
    end
    image_pool += "<IMAGES>"
    image_pool
end

###################################################
# Entity Resources Methods
###################################################

get '/vms/:id' do  
    protected!
    vm = VirtualMachineVMI.new(VirtualMachine.build_xml(params[:id]),get_one_client_user(@auth.credentials[0]))
    vm.info
    begin
        vm.to_vmi()
    rescue Exception => e
        error = OpenNebula::Error.new(e.message)
        return error
    end
end

delete '/vms/:id' do
    protected!
    vm = VirtualMachineVMI.new(VirtualMachine.build_xml(params[:id]),get_one_client_user(@auth.credentials[0]))
    vm.finalize
    "The Virtual Machine has been successfully deleted"
end

post '/vms/:id' do
    protected!

    change_state(params)    
end

get '/networks/:id' do  
    protected!
    vn = VirtualNetworkVMI.new(VirtualNetwork.build_xml(params[:id]),get_one_client_user(@auth.credentials[0]))
    vn.info
    begin
        vn.to_vmi()
    rescue Exception => e
        error = OpenNebula::Error.new(e.message)
        return error
    end
end

delete '/networks/:id' do
    protected!
    vn = VirtualNetworkVMI.new(VirtualNetwork.build_xml(params[:id]),get_one_client_user(@auth.credentials[0]))
    vn.delete
    "The Virtual Network has been successfully deleted"
end

get '/images/:id' do  
    protected!
    image=$repoman.get(params[:id])
    
    image.get_image_info
    
    if image
        xml_response = "<IMAGE><ID>" + image.uuid + "</ID>" + 
                              "<NAME>" + image.name + "</NAME>" +
                              "<SIZE>" + ((image.size/1024)/1024).to_s + "</SIZE>" +
                              "<URL>"  + image.description  + "<URL>" + 
                       "</IMAGE>"
    else
        status 404
        "Image with id = \"" + params[:id] + "\" not found"
    end
end

delete '/images/:id' do
    protected!
    "Not yet implemented"
end






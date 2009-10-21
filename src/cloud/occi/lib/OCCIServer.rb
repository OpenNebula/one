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

# Common cloud libs
require 'rubygems'
require 'sinatra'
require 'CloudServer'

# OCA
require 'OpenNebula'
include OpenNebula

# OCCI libs
require 'VirtualMachineOCCI'
require 'VirtualMachinePoolOCCI'
require 'VirtualNetworkOCCI'
require 'VirtualNetworkPoolOCCI'
require 'ImageOCCI'
require 'ImagePoolOCCI'

include ImageOCCI


##############################################################################
# The OCCI Server provides an OCCI implementation based on the 
# OpenNebula Engine
##############################################################################
class OCCIServer < CloudServer
    
    # Server initializer
    # config_file:: _String_ path of the config file
    # template:: _String_ path to the location of the templates 
    def initialize(config_file,template)
        super(config_file)
        
        @config.add_configuration_value("TEMPLATE_LOCATION",template)
        @base_url="http://#{@config[:server]}:#{@config[:port]}"
        print_configuration
    end
    
    # Authorization function
    # requestenv:: _Hash_ Hash containing the environment of the request
    # [return] _Boolean_ Whether the user is authorized or not  
    def authenticate?(requestenv)
      auth ||=  Rack::Auth::Basic::Request.new(requestenv)

      if !(auth.provided? && auth.basic? && auth.credentials)
          return false
      end 

      user = get_user(requestenv, auth)

      if user
          if user[:password] == auth.credentials[1]
              return true
          end
      else
          return false
      end
    end

    # Retrieve the user crendentials
    # requestenv:: _Hash_ Hash containing the environment of the request
    # [return] _User_ User structure
    def get_user(requestenv, auth=nil)
        auth =  Rack::Auth::Basic::Request.new(requestenv) if !auth
        super(auth.credentials.first)
    end
    
    # Retrieve a client with the user credentials
    # requestenv:: _Hash_ Hash containing the environment of the request
    # [return] _Client_ client with the user credentials
    def get_client(requestenv)
        user = get_user(requestenv)
        return one_client_user(user)
    end
    
    ###################################################
    # Pool Resources methods
    ###################################################
    
    # Post a new compute to the COMPUTE pool
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ COMPUTE Representation or error, status code    
    def post_compute(request)
        # Get client with user credentials
        client = get_client(request.env)
        
        if request.body
            @vm_info=Crack::XML.parse(request.body.read)
        else
            error = OpenNebula::Error.new(
                   "OCCI XML representation of VM not present")
            return error, 400
        end

         @vm_info=@vm_info['COMPUTE']
        
        disks=@vm_info['STORAGE']
        
        disks['DISK']=[disks['DISK']].flatten if disks and disks['DISK']
                
        disks['DISK'].each{|disk|
            next if !disk['image']
            image = get_image(disk['image'])
            if !image
                error = OpenNebula::Error.new(
                       "Invalid image (#{disk['image']}) referred")
                return error, 400
            end
            disk['source']=image.path
        } if disks and disks['DISK']
        
        @vm_info['STORAGE']=disks
        
        if @vm_info['NETWORK'] and @vm_info['NETWORK']['NIC']
        
            if @vm_info['NETWORK']['NIC'].class==Array
                nics=@vm_info['NETWORK']['NIC']
            else
                nics=[@vm_info['NETWORK']['NIC']]
            end
        
            nics.each{|nic|
                next if nic==nil
                vn=VirtualNetwork.new(
                         VirtualNetwork.build_xml(nic['network']), 
                         client)
                vn.info
                vn_xml=Crack::XML.parse(vn.to_xml)
                if !vn_xml['VNET']['NAME']
                    error = OpenNebula::Error.new(
                           "Invalid network referred")
                    return error, 400                
                end
                nic['network_id']=nic['network']
                nic['network']=vn_xml['VNET']['NAME'].strip
            } if nics 
        
            @vm_info['NETWORK']['NIC']=nics
        end
        
        instance_type_name=@vm_info['INSTANCE_TYPE']
        instance_type=@instance_types[instance_type_name]
        
        if !instance_type
            error = OpenNebula::Error.new("Bad instance type")
            return error, 400            
        end
        
        @vm_info[:instance_type]=instance_type_name
        
        template=ERB.new(File.read(
             @config[:template_location]+"/#{instance_type['TEMPLATE']}"))
        template_text=template.result(binding)
        
        vm=VirtualMachineOCCI.new(
                    VirtualMachine.build_xml, 
                    client)
        response=vm.allocate(template_text)
        
        if OpenNebula.is_error?(response)
            return response, 400
        else
            vm.info    
            return vm.to_occi(@base_url), 201
        end
    end
    
    # Gets the pool representation of COMPUTES
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Pool Representation or error, status code
    def get_computes(request)
        # Get client with user credentials
        client = get_client(request.env)

        # Just show resources from the user making the request
        user_flag = -1  

        vmpool = VirtualMachinePoolOCCI.new(client,user_flag)
        vmpool.info

        # OCCI conversion
        begin
            compute_xml = vmpool.to_occi(@base_url)
            return compute_xml, 200
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error, 500
        end
    end
    
    # Post a new network to the NETWORK pool
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Network Representation or error, status code
    def post_network(request)
        # Get client with user credentials
        client = get_client(request.env)
                
        # Info retrieval from post params
        if request.body
            network_info=Crack::XML.parse(request.body.read)
        else
            error_msg = "OCCI XML representation of Virtual Network" +
                        " not present in the request"
            error     = OpenNebula::Error.new(error_msg)
            return error, 400  
        end
        # Allocate the VirtualNetwork  
        network = VirtualNetworkOCCI.new(
                        VirtualNetwork.build_xml,
                        client)

        begin  
            vntemplate = network.to_one_template(
                            network_info['NIC'],
                            @config[:bridge])
            rc         = network.allocate(vntemplate)
            network.info
            network_xml = network.to_occi
            return network_xml, 201
        rescue Exception => e
            error_msg = "Error creating the Virtual Network:" + e.to_s
            error_msg = ".Reason:" + rc if rc
            error     = OpenNebula::Error.new(error_msg)
            return error, 500
        end
    end
    
    # Gets the pool representation of NETWORKS
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Network pool representation or error, 
    # =>                          status code  
    def get_networks(request)
        # Get client with user credentials
        client = get_client(request.env)
        
        # Info retrieval
        network_pool = VirtualNetworkPoolOCCI.new(client)
        network_pool.info
        # OCCI conversion
        begin
            network_pool.to_occi(@base_url)
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error, 500
        end
    end
    
    # Post a new image to the STORAGE pool
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Image representation or error, status code 
    def post_storage(request)
        # Info retrieval from post params
        if request.params['occixml']
            image_info=Crack::XML.parse(request.params['occixml'])
        else
            error_msg = "OCCI XML representation of Image" +
                        " not present in the request"
            error     = OpenNebula::Error.new(error_msg)
            return error, 400
        end

        if request.params['file']
            file=request.params["file"]
        else
            error_msg = "File not present in the request" 
            error     = OpenNebula::Error.new(error_msg)
            return error, 400
        end

        user = get_user(request.env)

        # tmpfile where the file is stored
        f_tmp=file[:tempfile]
        img=add_image(user[:id], f_tmp, {:name=>image_info['DISK']['NAME'],
                                    :description=>image_info['DISK']['URL']})

        img.extend(ImageOCCI)
        xml_response = img.to_occi
        
        return xml_response, 201
    end
    
    # Gets the pool representation of STORAGES
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Image pool representation or error, 
    #                             status code 
    def get_storages(request)
        # Retrieve images owned by this user
        user = get_user(request.env)
    
        image_pool = ImagePoolOCCI.new(user[:id])
        return image_pool.to_occi(@base_url), 200
    end
    
    ###################################################
    # Entity Resources methods
    ###################################################
    
    # Get the representation of a COMPUTE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ COMPUTE representation or error, 
    #                             status code
    def get_compute(request, params)
        # Get client with user credentials
        client = get_client(request.env)
        
        vm = VirtualMachineOCCI.new(
                    VirtualMachine.build_xml(params[:id]),
                    client)

        result=vm.info

        if OpenNebula::is_error?(result)
            return result, 404
        end

        begin
            return vm.to_occi(@base_url), 200
        rescue Exception => e
            error_msg = "Error converting COMPUTE resource to OCCI format" 
            error_msg = "\n Reason: " + e.message
            error     = OpenNebula::Error.new(error_msg)
            return error, 500
        end
    end
    
    # Deletes a COMPUTE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Delete confirmation msg or error, 
    #                             status code
    def delete_compute(request, params)
        # Get client with user credentials
        client = get_client(request.env)
        
        vm = VirtualMachineOCCI.new(
                VirtualMachine.build_xml(params[:id]),
                client)
                      
        result = vm.finalize

        if OpenNebula::is_error?(result)
            return result, 500
        else
            return "", 204
        end
    end
    
    # Updates a COMPUTE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Update confirmation msg or error, 
    #                             status code  
    def put_compute(request, params)
        # Get client with user credentials
        client = get_client(request.env)
        
        if request.body
            vm_info=Crack::XML.parse(request.body.read)
        else
            error_msg = "OCCI XML representation of VM not present"
            error     = OpenNebula::Error.new(error_msg)
            return error, 400
        end

        vm=VirtualMachineOCCI.new(
                            VirtualMachine.build_xml(params[:id]), 
                            client)

        if !vm_info['COMPUTE']['STATE']
            error_msg =  "State not defined in the OCCI XML" 
            error     = OpenNebula::Error.new(error_msg)
            return error, 400            
        end

        case vm_info['COMPUTE']['STATE'].downcase
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
                error_msg =  "Invalid state"
                error     = OpenNebula::Error.new(error_msg)
                return error, 400
        end

        if OpenNebula.is_error?(rc)
            return rc, 400
        else
            vm.info
            response_text = vm.to_occi(@base_url) 
            return  response_text, 202
        end
    end
    
    # Retrieves a NETWORK resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ NETWORK occi representation or error, 
    #                             status code 
    def get_network(request, params)
        # Get client with user credentials
        client = get_client(request.env)
        
        vn = VirtualNetworkOCCI.new(                    
                    VirtualNetwork.build_xml(params[:id]),
                    client)
                    
        result=vn.info

        if OpenNebula::is_error?(result)
            return result, 404
        end

        begin
            return vn.to_occi, 200
        rescue Exception => e
            error = OpenNebula::Error.new(e.message)
            return error, 500
        end
    end
    
    # Deletes a NETWORK resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Delete confirmation msg or error, 
    #                             status code 
    def delete_network(request, params)
        # Get client with user credentials
        client = get_client(request.env)
        
        vn = VirtualNetworkOCCI.new(
                VirtualNetwork.build_xml(params[:id]),
                client)

        result = vn.delete
        
        if OpenNebula::is_error?(result)
            return result, 500
        else
            return "", 204
        end
    end
    
    # Get a STORAGE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ STORAGE occi representation or error, 
    #                             status code 
    def get_storage(request, params)
        # Get client with user credentials
        client = get_client(request.env)
        
        image=get_image(params[:id])

        if image
            image.extend(ImageOCCI)
            return image.to_occi, 200
        else
            msg="Disk with id = \"" + params[:id] + "\" not found"
            error = OpenNebula::Error.new(msg)
            return error, 404
        end
    end
    
    # Deletes a STORAGE resource (Not yet implemented)
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Delete confirmation msg or error, 
    #                             status code 
    def delete_storage(request, params)
        error = OpenNebula::Error.new("Not yet implemented")
        return error, 501
    end
end
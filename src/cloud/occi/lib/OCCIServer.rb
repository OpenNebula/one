# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'pp'


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

        if @config[:ssl_server]
            @base_url=@config[:ssl_server]
        else
            @base_url="http://#{@config[:server]}:#{@config[:port]}"
        end

        print_configuration
    end

    # Retrieve a client with the user credentials
    # requestenv:: _Hash_ Hash containing the environment of the request
    # [return] _Client_ client with the user credentials
    def get_client(requestenv)
        auth =  Rack::Auth::Basic::Request.new(requestenv)
        if auth
            return one_client_user(auth.credentials[0], auth.credentials[1])
        else
            return nil
        end
    end

    # Prepare the OCCI XML Response
    # resource:: _Pool_ or _PoolElement_ that represents a OCCI resource
    # [return] _String_,_Integer_ Resource Representation or error, status code
    def to_occi_xml(resource, code)
        xml_response = resource.to_occi(@base_url)
        return xml_response, 500 if OpenNebula.is_error?(xml_response)

        return xml_response, code
    end

    ############################################################################
    ############################################################################
    #                      POOL RESOURCE METHODS
    ############################################################################
    ############################################################################

    # Gets the pool representation of COMPUTES
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Pool Representation or error, status code
    def get_computes(request)
        # --- Get User's VMs ---
        user_flag = -1
        
        one_client = get_client(request.env)
        if !one_client
            return "No authorization data present", 401
        end 
        
        vmpool = VirtualMachinePoolOCCI.new(
                        one_client,
                        user_flag)

        # --- Prepare XML Response ---
        rc = vmpool.info
        return rc, 404 if OpenNebula.is_error?(rc)

        return to_occi_xml(vmpool, 200)
    end


    # Gets the pool representation of NETWORKS
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Network pool representation or error,
    # =>                          status code
    def get_networks(request)
        # --- Get User's VNETs ---
        user_flag = -1
        
        one_client = get_client(request.env)
        if !one_client
            return "No authorization data present", 401
        end 
        
        network_pool = VirtualNetworkPoolOCCI.new(
                            one_client),
                            user_flag)

        # --- Prepare XML Response ---
        rc = network_pool.info
        return rc, 404 if OpenNebula.is_error?(rc)

        return to_occi_xml(network_pool, 200)
    end

    # Gets the pool representation of STORAGES
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Image pool representation or error,
    #                             status code
    def get_storages(request)
        # --- Get User's Images ---
        user_flag = -1
        
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 
        
        image_pool = ImagePoolOCCI.new(
                            one_client,
                            user_flag)

        # --- Prepare XML Response ---
        rc = image_pool.info
        return rc, 404 if OpenNebula.is_error?(rc)

        return to_occi_xml(image_pool, 200)
    end

    ############################################################################
    ############################################################################
    #                      ENTITY RESOURCE METHODS
    ############################################################################
    ############################################################################

    ############################################################################
    # COMPUTE Methods
    ############################################################################

    # Post a new compute to the COMPUTE pool
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ COMPUTE Representation or error, status code
    def post_compute(request)
        # --- Create the new Instance ---
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 
        
        vm = VirtualMachineOCCI.new(
                    VirtualMachine.build_xml,
                    one_client,
                    request.body.read,
                    @instance_types,
                    @config[:template_location])

        # --- Generate the template and Allocate the new Instance ---
        template = vm.to_one_template
        return template, 500 if OpenNebula.is_error?(template)

        rc = vm.allocate(template)
        return rc, 500 if OpenNebula.is_error?(rc)

        # --- Prepare XML Response ---
        vm.info
        return to_occi_xml(vm, 201)
    end

    # Get the representation of a COMPUTE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ COMPUTE representation or error,
    #                             status code
    def get_compute(request, params)
        # --- Get the VM ---
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 
        
        vm = VirtualMachineOCCI.new(
                    VirtualMachine.build_xml(params[:id]),
                    one_client)

        # --- Prepare XML Response ---
        rc = vm.info
        return rc, 404 if OpenNebula::is_error?(rc)

        return to_occi_xml(vm, 200)
    end


    # Deletes a COMPUTE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Delete confirmation msg or error,
    #                             status code
    def delete_compute(request, params)
        # --- Get the VM ---
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 
        
        vm = VirtualMachineOCCI.new(
                    VirtualMachine.build_xml(params[:id]),
                    one_client)

        rc = vm.info
        return rc, 404 if OpenNebula::is_error?(rc)

        # --- Finalize the VM ---
        result = vm.finalize
        return result, 500 if OpenNebula::is_error?(result)

        return "", 204
    end

    # Updates a COMPUTE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Update confirmation msg or error,
    #                             status code
    def put_compute(request, params)
        # --- Get the VM ---
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 
        
        vm = VirtualMachineOCCI.new(
                    VirtualMachine.build_xml(params[:id]),
                    one_client)
        
        rc = vm.info
        return rc, 400 if OpenNebula.is_error?(rc)
        
        xmldoc  = XMLElement.build_xml(request.body, 'COMPUTE')
        vm_info = XMLElement.new(xmldoc) if xmldoc != nil
        
        # Check the number of changes in the request
        image_name = nil
        image_type = nil
        vm_info.each('DISK/SAVE_AS') { |disk|
            if image_name
                error_msg = "It is only allowed one save_as per request"
                return OpenNebula::Error.new(error_msg), 400
            end
            image_name = disk.attr('.', 'name')
            image_type = disk.attr('.', 'type')
        }
        state = vm_info['STATE']
        
        if image_name && state
            error_msg = "It is not allowed to change the state and save_as" <<
                        " a disk in the same request"
            return OpenNebula::Error.new(error_msg), 400
        elsif image_name
            # Get the disk id
            disk_id = vm_info.attr('DISK/SAVE_AS/..', 'id')
            if disk_id.nil?
                error_msg = "DISK id attribute not specified"
                return OpenNebula::Error.new(error_msg), 400
            end

            disk_id = disk_id.to_i
            if vm["TEMPLATE/DISK[DISK_ID=\"#{disk_id}\"]/SAVE_AS"]
                error_msg = "The disk #{disk_id} is already" <<
                            " suppossed to be saved"
                return OpenNebula::Error.new(error_msg), 400
            end
            
            # Create a new Image to save the disk
            template = "NAME=\"#{image_name}\"\n"
            if image_type
                template << "TYPE=\"#{image_type}\"\n"
            else
                template << "TYPE=\"OS\"\n"
            end

            image = Image.new(Image.build_xml, one_client)

            rc = image.allocate(template)
            return rc, 400 if OpenNebula.is_error?(rc)
            
            rc = vm.save_as(disk_id, image.id)
            if OpenNebula.is_error?(rc)
                image.delete
                return rc, 400
            end 
        elsif state
            rc = vm.mk_action(state)
            return rc, 400 if OpenNebula.is_error?(rc)
        end

        # --- Prepare XML Response ---
        vm.info
        return to_occi_xml(vm, 202)
    end

    ############################################################################
    # NETWORK Methods
    ############################################################################

    # Post a new network to the NETWORK pool
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Network Representation or error, status code
    def post_network(request)
        # --- Create the new Instance ---
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 
        
        network = VirtualNetworkOCCI.new(
                        VirtualNetwork.build_xml,
                        one_client,
                        request.body,
                        @config[:bridge])

        # --- Generate the template and Allocate the new Instance ---
        template = network.to_one_template
        return template, 500 if OpenNebula.is_error?(template)

        rc = network.allocate(template)
        return rc, 500 if OpenNebula.is_error?(rc)

        # --- Prepare XML Response ---
        network.info
        return to_occi_xml(network, 201)
    end

    # Retrieves a NETWORK resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ NETWORK occi representation or error,
    #                             status code
    def get_network(request, params)
        # --- Get the VNET ---
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 
        
        network = VirtualNetworkOCCI.new(
                        VirtualNetwork.build_xml(params[:id]),
                        one_client)

        # --- Prepare XML Response ---
        rc = network.info
        return rc, 404 if OpenNebula::is_error?(rc)

        return to_occi_xml(network, 200)
    end

    # Deletes a NETWORK resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Delete confirmation msg or error,
    #                             status code
    def delete_network(request, params)
        # --- Get the VNET ---
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 
        
        network = VirtualNetworkOCCI.new(
                        VirtualNetwork.build_xml(params[:id]),
                        one_client)

        rc = network.info
        return rc, 404 if OpenNebula::is_error?(rc)

        # --- Delete the VNET ---
        rc = network.delete
        return rc, 500 if OpenNebula::is_error?(rc)

        return "", 204
    end
    
    # Updates a NETWORK resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Update confirmation msg or error,
    #                             status code
    def put_network(request, params)
        xmldoc    = XMLElement.build_xml(request.body, 'NETWORK')
        vnet_info = XMLElement.new(xmldoc) if xmldoc != nil
        
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 

        vnet = VirtualNetworkOCCI.new(
                    VirtualNetwork.build_xml(params[:id]),
                   one_client)
                    
        rc = vnet.info
        return rc, 400 if OpenNebula.is_error?(rc)
        
        if vnet_info['PUBLIC'] == 'YES'
            rc = vnet.publish
            return rc, 400 if OpenNebula.is_error?(rc)
        elsif vnet_info['PUBLIC'] == 'NO'
            rc = vnet.unpublish
            return rc, 400 if OpenNebula.is_error?(rc)
        end

        # --- Prepare XML Response ---
        vnet.info
        return to_occi_xml(vnet, 202)
    end

    ############################################################################
    # STORAGE Methods
    ############################################################################

    # Post a new image to the STORAGE pool
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Image representation or error, status code
    def post_storage(request)
        # --- Check OCCI XML from POST ---
        if request.params['occixml'] == nil
            error_msg = "OCCI XML representation of Image" +
                        " not present in the request"
            error = OpenNebula::Error.new(error_msg)
            return error, 400
        end
        
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 

        # --- Create and Add the new Image ---
        occixml = request.params['occixml']
        occixml = occixml[:tempfile].read if occixml.class == Hash

        image = ImageOCCI.new(
                        Image.build_xml,
                        one_client,
                        occixml,
                        request.params['file'])

        # --- Generate the template and Allocate the new Instance ---
        template = image.to_one_template
        return template, 500 if OpenNebula.is_error?(template)

        rc = image.allocate(template)
        return rc, 500 if OpenNebula.is_error?(rc)

        # --- Prepare XML Response ---
        image.info
        return to_occi_xml(image, 201)
    end

    # Get a STORAGE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ STORAGE occi representation or error,
    #                             status code
    def get_storage(request, params)
        # --- Get the Image ---
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 
        
        image = ImageOCCI.new(
                        Image.build_xml(params[:id]),
                        one_client)

        rc = image.info
        return rc, 404 if OpenNebula::is_error?(rc)

        # --- Prepare XML Response ---
        return to_occi_xml(image, 200)
    end

    # Deletes a STORAGE resource (Not yet implemented)
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Delete confirmation msg or error,
    #                             status code
    def delete_storage(request, params)
        # --- Get the Image ---
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 
        
        image = ImageOCCI.new(
                        Image.build_xml(params[:id]),
                        one_client)

        rc = image.info
        return rc, 404 if OpenNebula::is_error?(rc)

        # --- Delete the Image ---
        rc = @img_repo.delete(image)
        return rc, 500 if OpenNebula::is_error?(rc)

        return "", 204
    end
    
    # Updates a STORAGE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Update confirmation msg or error,
    #                             status code
    def put_storage(request, params)
        xmldoc     = XMLElement.build_xml(request.body, 'STORAGE')
        image_info = XMLElement.new(xmldoc) if xmldoc != nil
        
        one_client = get_client(request.env)    
        if !one_client
            return "No authorization data present", 401
        end 

        image = ImageOCCI.new(
                    Image.build_xml(params[:id]),
                    one_client)
                    
        rc = image.info
        return rc, 400 if OpenNebula.is_error?(rc)
        
        if image_info['PERSISTENT'] && image_info['PUBLIC']
            error_msg = "It is not allowed more than one change per request"
            return OpenNebula::Error.new(error_msg), 400
        elsif image_info['PERSISTENT'] == 'YES'
            rc = image.persistent
            return rc, 400 if OpenNebula.is_error?(rc)
        elsif image_info['PERSISTENT'] == 'NO'
            rc = image.nonpersistent
            return rc, 400 if OpenNebula.is_error?(rc)
        elsif image_info['PUBLIC'] == 'YES'
            rc = image.publish
            return rc, 400 if OpenNebula.is_error?(rc)
        elsif image_info['PUBLIC'] == 'NO'
            rc = image.unpublish
            return rc, 400 if OpenNebula.is_error?(rc)
        end

        # --- Prepare XML Response ---
        image.info
        return to_occi_xml(image, 202)
    end
end

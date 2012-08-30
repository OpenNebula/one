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

# Common cloud libs
require 'CloudServer'

# OCA
include OpenNebula

# OCCI libs
require 'VirtualMachineOCCI'
require 'VirtualMachinePoolOCCI'
require 'VirtualNetworkOCCI'
require 'VirtualNetworkPoolOCCI'
require 'ImageOCCI'
require 'ImagePoolOCCI'
require 'UserOCCI'
require 'UserPoolOCCI'

require 'OpenNebulaVNC'

require 'pp'


##############################################################################
# The OCCI Server provides an OCCI implementation based on the
# OpenNebula Engine
##############################################################################

COLLECTIONS = ["compute", "instance_type", "network", "storage", "user"]

# FLAG that will filter the elements retrieved from the Pools
POOL_FILTER = Pool::INFO_ALL

# Secs to sleep between checks to see if image upload&copy to repo is finished
IMAGE_POLL_SLEEP_TIME = 5

class OCCIServer < CloudServer
    # Server initializer
    # config_file:: _String_ path of the config file
    # template:: _String_ path to the location of the templates
    def initialize(client, config, logger)
        super(config, logger)

        if config[:ssl_server]
            @base_url=config[:ssl_server]
        else
            @base_url="http://#{config[:server]}:#{config[:port]}"
        end

        @client = client
    end

    # Prepare the OCCI XML Response
    # resource:: _Pool_ or _PoolElement_ that represents a OCCI resource
    # [return] _String_,_Integer_ Resource Representation or error, status code
    def to_occi_xml(resource, opts)
        xml_response = resource.to_occi(@base_url, opts[:verbose])
        return xml_response, 500 if OpenNebula.is_error?(xml_response)

        return xml_response, opts[:code]
    end

    ############################################################################
    ############################################################################
    #                      POOL RESOURCE METHODS
    ############################################################################
    ############################################################################

    def get_collections(request)
        xml_resp = "<COLLECTIONS>"

        COLLECTIONS.sort.each { |c|
            xml_resp << "<#{c.upcase}_COLLECTION href=\"#{@base_url}/#{c}\"/>"
        }

        xml_resp << "</COLLECTIONS>"

        return xml_resp, 200
    end


    INSTANCE_TYPE = %q{
        <INSTANCE_TYPE href="<%= @base_url %>/instance_type/<%=name%>" name="<%= name %>">
            <ID><%= name.to_s %></ID>
            <NAME><%= name.to_s %></NAME>
        <% opts.sort{|k1,k2| k1[0].to_s<=>k2[0].to_s}.each { |elem, value|
            next if elem==:template
            str = elem.to_s.upcase %>
            <<%= str %>><%= value %></<%= str %>>
        <% } %>
        </INSTANCE_TYPE>
    }

    def get_instance_types(request)
        xml_resp = "<INSTANCE_TYPE_COLLECTION>"

        @config[:instance_types].sort { |k1,k2|
            k1[0].to_s<=>k2[0].to_s
        }.each { |name, opts|
            if request.params['verbose']
                begin
                    occi_it = ERB.new(INSTANCE_TYPE)
                    occi_it = occi_it.result(binding)
                rescue Exception => e
                    error = OpenNebula::Error.new(e.message)
                    return error, CloudServer::HTTP_ERROR_CODE[error.errno]
                end

                xml_resp << occi_it.gsub(/\n\s*/,'')
            else
                xml_resp << "<INSTANCE_TYPE href=\"#{@base_url}/instance_type/#{name.to_s}\"  name=\"#{name}\"/>"
            end
        }

        xml_resp << "</INSTANCE_TYPE_COLLECTION>"

        return xml_resp, 200
    end

    def get_instance_type(request, params)
        name = params[:id].to_sym
        unless @config[:instance_types].keys.include?(name)
            error = OpenNebula::Error.new("INSTANCE_TYPE #{name} not found")
            return error, 404
        else
            opts = @config[:instance_types][name]
            begin
                occi_it = ERB.new(INSTANCE_TYPE)
                occi_it = occi_it.result(binding)
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error, CloudServer::HTTP_ERROR_CODE[error.errno]
            end

            return occi_it.gsub(/\n\s*/,''), 200
        end
    end

    # Gets the pool representation of COMPUTES
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Pool Representation or error, status code
    def get_computes(request)
        # --- Get User's VMs ---
        vmpool = VirtualMachinePoolOCCI.new(
                        @client,
                        POOL_FILTER)

        # --- Prepare XML Response ---
        rc = vmpool.info
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        return to_occi_xml(vmpool, :code=>200, :verbose=>request.params['verbose'])
    end


    # Gets the pool representation of NETWORKS
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Network pool representation or error,
    # =>                          status code
    def get_networks(request)
        # --- Get User's VNETs ---
        network_pool = VirtualNetworkPoolOCCI.new(
                            @client,
                            POOL_FILTER)

        # --- Prepare XML Response ---
        rc = network_pool.info
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        return to_occi_xml(network_pool, :code=>200, :verbose=>request.params['verbose'])
    end

    # Gets the pool representation of STORAGES
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Image pool representation or error,
    #                             status code
    def get_storages(request)
        # --- Get User's Images ---
        image_pool = ImagePoolOCCI.new(
                            @client,
                            POOL_FILTER)

        # --- Prepare XML Response ---
        rc = image_pool.info
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        return to_occi_xml(image_pool, :code=>200, :verbose=>request.params['verbose'])
    end

    # Gets the pool representation of USERs
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ User pool representation or error,
    #                             status code
    def get_users(request)
        # --- Get Users Pool ---
        user_pool = UserPoolOCCI.new(@client)

        # --- Prepare XML Response ---
        rc = user_pool.info
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        return to_occi_xml(user_pool, :code=>200, :verbose=>request.params['verbose'])
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
        vm = VirtualMachineOCCI.new(
                    VirtualMachine.build_xml,
                    @client,
                    request.body.read,
                    @config[:instance_types],
                    @config[:template_location])

        # --- Generate the template and Allocate the new Instance ---
        template = vm.to_one_template
        return template, 500 if OpenNebula.is_error?(template)

        rc = vm.allocate(template)
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        # --- Prepare XML Response ---
        vm.info
        return to_occi_xml(vm, :code=>201)
    end

    # Get the representation of a COMPUTE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ COMPUTE representation or error,
    #                             status code
    def get_compute(request, params)
        # --- Get the VM ---
        vm = VirtualMachineOCCI.new(
                    VirtualMachine.build_xml(params[:id]),
                    @client)

        # --- Prepare XML Response ---
        rc = vm.info
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        return to_occi_xml(vm, :code=>200)
    end

    # Deletes a COMPUTE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Delete confirmation msg or error,
    #                             status code
    def delete_compute(request, params)
        # --- Get the VM ---
        vm = VirtualMachineOCCI.new(
                    VirtualMachine.build_xml(params[:id]),
                    @client)

        # --- Finalize the VM ---
        result = vm.finalize
        if OpenNebula.is_error?(result)
            return result, CloudServer::HTTP_ERROR_CODE[result.errno]
        end

        return "", 204
    end

    # Updates a COMPUTE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Update confirmation msg or error,
    #                             status code
    def put_compute(request, params)
        # --- Get the VM ---
        vm = VirtualMachineOCCI.new(
                    VirtualMachine.build_xml(params[:id]),
                    @client)

        rc = vm.info
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        result, code = vm.update_from_xml(request.body)

        if OpenNebula.is_error?(result)
            return result, code
        else
            vm.info
            return to_occi_xml(vm, :code=>code)
        end
    end

    ############################################################################
    # NETWORK Methods
    ############################################################################

    # Post a new network to the NETWORK pool
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Network Representation or error, status code
    def post_network(request)
        # --- Create the new Instance ---
        network = VirtualNetworkOCCI.new(
                        VirtualNetwork.build_xml,
                        @client,
                        request.body,
                        @config[:template_location])

        # --- Generate the template and Allocate the new Instance ---
        template = network.to_one_template
        return template, 500 if OpenNebula.is_error?(template)

        rc = network.allocate(template, @config[:cluster_id]||ClusterPool::NONE_CLUSTER_ID)
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        # --- Prepare XML Response ---
        network.info
        return to_occi_xml(network, :code=>201)
    end

    # Retrieves a NETWORK resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ NETWORK occi representation or error,
    #                             status code
    def get_network(request, params)
        network = VirtualNetworkOCCI.new(
                        VirtualNetwork.build_xml(params[:id]),
                        @client)

        # --- Prepare XML Response ---
        rc = network.info
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        return to_occi_xml(network, :code=>200)
    end

    # Deletes a NETWORK resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Delete confirmation msg or error,
    #                             status code
    def delete_network(request, params)
        network = VirtualNetworkOCCI.new(
                        VirtualNetwork.build_xml(params[:id]),
                        @client)

        # --- Delete the VNET ---
        rc = network.delete
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        return "", 204
    end

    # Updates a NETWORK resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Update confirmation msg or error,
    #                             status code
    def put_network(request, params)
        xmldoc    = XMLElement.build_xml(request.body, 'NETWORK')
        vnet_info = XMLElement.new(xmldoc) if xmldoc != nil

        vnet = VirtualNetworkOCCI.new(
                    VirtualNetwork.build_xml(params[:id]),
                    @client)

        rc = nil
        if vnet_info['PUBLIC'] == 'YES'
            rc = vnet.publish
        elsif vnet_info['PUBLIC'] == 'NO'
            rc = vnet.unpublish
        end

        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        # --- Prepare XML Response ---
        vnet.info
        return to_occi_xml(vnet, :code=>202)
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

        # --- Create and Add the new Image ---
        occixml = request.params['occixml']
        occixml = occixml[:tempfile].read if occixml.class == Hash

        image = ImageOCCI.new(
                        Image.build_xml,
                        @client,
                        occixml,
                        request.params['file'])

        # --- Generate the template and Allocate the new Instance ---
        template = image.to_one_template
        return template, 500 if OpenNebula.is_error?(template)

        rc = image.allocate(template, @config[:datastore_id]||1)
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        image.info
        #wait until image is ready to return
        while (image.state_str == 'LOCKED') && (image['RUNNING_VMS'] == '0') do
            sleep IMAGE_POLL_SLEEP_TIME
            image.info
        end

        # --- Prepare XML Response ---
        return to_occi_xml(image, :code=>201)
    end

    # Get a STORAGE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ STORAGE occi representation or error,
    #                             status code
    def get_storage(request, params)
        # --- Get the Image ---
        image = ImageOCCI.new(
                        Image.build_xml(params[:id]),
                        @client)

        rc = image.info
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        # --- Prepare XML Response ---
        return to_occi_xml(image, :code=>200)
    end

    # Deletes a STORAGE resource (Not yet implemented)
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Delete confirmation msg or error,
    #                             status code
    def delete_storage(request, params)
        # --- Get the Image ---
        image = ImageOCCI.new(
                        Image.build_xml(params[:id]),
                        @client)

        # --- Delete the Image ---
        rc = image.delete
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        return "", 204
    end

    # Updates a STORAGE resource
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ Update confirmation msg or error,
    #                             status code
    def put_storage(request, params)
        xmldoc     = XMLElement.build_xml(request.body, 'STORAGE')
        image_info = XMLElement.new(xmldoc) if xmldoc != nil

        image = ImageOCCI.new(
                    Image.build_xml(params[:id]),
                    @client)

        rc = nil
        if image_info['PERSISTENT'] && image_info['PUBLIC']
            error_msg = "It is not allowed more than one change per request"
            return OpenNebula::Error.new(error_msg), 400
        elsif image_info['PERSISTENT'] == 'YES'
            rc = image.persistent
        elsif image_info['PERSISTENT'] == 'NO'
            rc = image.nonpersistent
        elsif image_info['PUBLIC'] == 'YES'
            rc = image.publish
        elsif image_info['PUBLIC'] == 'NO'
            rc = image.unpublish
        end

        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        # --- Prepare XML Response ---
        image.info
        return to_occi_xml(image, :code=>202)
    end

    # Get the representation of a USER
    # request:: _Hash_ hash containing the data of the request
    # [return] _String_,_Integer_ USER representation or error,
    #                             status code
    def get_user(request, params)
        # --- Get the USER ---
        user = UserOCCI.new(
                    User.build_xml(params[:id]),
                    @client)

        # --- Prepare XML Response ---
        rc = user.info
        if OpenNebula.is_error?(rc)
            return rc, CloudServer::HTTP_ERROR_CODE[rc.errno]
        end

        return to_occi_xml(user, :code=>200)
    end

    ############################################################################
    # VNC Methods
    ############################################################################

    def startvnc(id,vnc)
        vm = VirtualMachineOCCI.new(VirtualMachine.build_xml(id), @client)
        rc = vm.info

        if OpenNebula.is_error?(rc)
            error =  "Error starting VNC session, "
            error << "could not retrieve Virtual Machine"
            return [404, error]
        end

        return vnc.proxy(vm)
    end

    ##########################################################################
    # Accounting
    ##########################################################################

    def get_user_accounting(options)
        tstart   = options[:start].to_i
        tend     = options[:end].to_i
        interval = options[:interval].to_i
        meters   = options[:monitor_resources]

        acct_options = {:start_time => tstart,
                        :end_time => tend}
        info_flag = Pool::INFO_ALL

        result   = {}
        meters_a = meters.split(',')
        meters_a.each do | meter |
            result[meter] = []
        end

        pool     = VirtualMachinePool.new(@client)
        acct_xml = pool.accounting_xml(info_flag, acct_options)

        if OpenNebula.is_error?(acct_xml)
            error = Error.new(acct_xml.message)
            return [500, error.to_json]
        end

        xml = XMLElement.new
        xml.initialize_xml(acct_xml, 'HISTORY_RECORDS')

        while tstart < tend

            tstep = tstart + interval
            count = Hash.new

            xml.each("HISTORY[STIME<=#{tstep} and ETIME=0 or STIME<=#{tstep} and ETIME>=#{tstart}]") do |hr|

                meters_a.each do | meter |
                    count[meter] ||= 0
                    count[meter] += hr["VM/#{meter}"].to_i if hr["VM/#{meter}"]
                end
            end

            count.each do | mname, mcount |
                result[mname] << [tstart, mcount]
            end

            tstart = tstep
        end

        return [200, {:monitoring => result}.to_json]
    end

end

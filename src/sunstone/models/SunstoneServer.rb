# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'CloudServer'

require 'OpenNebulaJSON'
include OpenNebulaJSON

require 'sunstone_vnc'
require 'sunstone_guac'
require 'sunstone_vmrc'
require 'sunstone_vm_helper'
require 'OpenNebulaAddons'
require 'OpenNebulaJSON/JSONUtils'
#include JSONUtils

require 'net/http'

class SunstoneServer < CloudServer

    # Secs to sleep between checks to see if image upload to repo is finished
    IMAGE_POLL_SLEEP_TIME = 5

    def initialize(client, config, logger)
        super(config, logger)
        @client = client
    end

    ############################################################################
    #
    ############################################################################
    def get_pool(kind,user_flag, client=nil)
        client = @client if !client

        user_flag = Integer(user_flag)

        pool = case kind
            when "group"            then GroupPoolJSON.new(client)
            when "cluster"          then ClusterPoolJSON.new(client)
            when "host"             then HostPoolJSON.new(client)
            when "image"            then ImagePoolJSON.new(client, user_flag)
            when "vmtemplate"       then TemplatePoolJSON.new(client, user_flag)
            when "vm_group"         then VMGroupPoolJSON.new(client, user_flag)
            when "vm"               then VirtualMachinePoolJSON.new(client, user_flag)
            when "vnet"             then VirtualNetworkPoolJSON.new(client, user_flag)
            when "vntemplate"       then VNTemplatePoolJSON.new(client, user_flag)
            when "user"             then UserPoolJSON.new(client)
            when "acl"              then AclPoolJSON.new(client)
            when "datastore"        then DatastorePoolJSON.new(client)
            when "zone"             then ZonePoolJSON.new(client)
            when "security_group"   then SecurityGroupPoolJSON.new(client, user_flag)
            when "vdc"              then VdcPoolJSON.new(client)
            when "vrouter"          then VirtualRouterPoolJSON.new(client, user_flag)
            when "marketplace"      then MarketPlacePoolJSON.new(client)
            when "marketplaceapp"   then MarketPlaceAppPoolJSON.new(client, user_flag)
            when "backupjob"        then BackupJobPoolJSON.new(client, user_flag)
            else
                error = Error.new("Error: #{kind} resource not supported")
                return [404, error.to_json]
        end

        if kind == "vm" && $conf[:get_extended_vm_info]
          rc = pool.get_hash_extended
        else
          rc = pool.get_hash
        end

        if OpenNebula.is_error?(rc)
            return [500, rc.to_json]
        else
            return [200, rc.to_json]
        end
    end

    ############################################################################
    #
    ############################################################################
    def get_resource(kind, id, extended=false)
        resource = retrieve_resource(kind, id, extended)
        if OpenNebula.is_error?(resource)
            return [404, resource.to_json]
        else
            return [200, resource.to_json]
        end
    end

    ############################################################################
    #
    ############################################################################
    def get_template(kind,id)
        resource = retrieve_resource(kind,id)
        if OpenNebula.is_error?(resource)
            return [404, resource.to_json]
        else
            template_str = resource.template_str(true)
            return [200, {:template => template_str}.to_json]
        end
    end

    ############################################################################
    #
    ############################################################################
    def create_resource(kind, template)
        resource = case kind
            when "group"            then GroupJSON.new(Group.build_xml, @client)
            when "cluster"          then ClusterJSON.new(Group.build_xml, @client)
            when "host"             then HostJSON.new(Host.build_xml, @client)
            when "image"            then ImageJSON.new(Image.build_xml, @client)
            when "vmtemplate"       then TemplateJSON.new(Template.build_xml, @client)
            when "vm_group"         then VMGroupJSON.new(VMGroup.build_xml,@client)
            when "vm"               then VirtualMachineJSON.new(VirtualMachine.build_xml,@client)
            when "vnet"             then VirtualNetworkJSON.new(VirtualNetwork.build_xml, @client)
            when "vntemplate"       then VNTemplateJSON.new(VNTemplate.build_xml, @client)
            when "user"             then UserJSON.new(User.build_xml, @client)
            when "acl"              then AclJSON.new(Acl.build_xml, @client)
            when "datastore"        then DatastoreJSON.new(Datastore.build_xml, @client)
            when "zone"             then ZoneJSON.new(Zone.build_xml, @client)
            when "security_group"   then SecurityGroupJSON.new(SecurityGroup.build_xml, @client)
            when "vdc"              then VdcJSON.new(Vdc.build_xml, @client)
            when "vrouter"          then VirtualRouterJSON.new(VirtualRouter.build_xml, @client)
            when "marketplace"      then MarketPlaceJSON.new(MarketPlace.build_xml, @client)
            when "marketplaceapp"   then MarketPlaceAppJSON.new(MarketPlaceApp.build_xml, @client)
            when "backupjob"        then BackupJobJSON.new(BackupJob.build_xml, @client)
            else
                error = Error.new("Error: #{kind} resource not supported")
                return [404, error.to_json]
        end

        rc = resource.create(template)
        if OpenNebula.is_error?(rc)
            return [500, rc.to_json]
        else
            rc = resource.info
            if OpenNebula.is_error?(rc)
                return [201, "{\"#{kind.upcase}\": {\"ID\": \"#{resource.id}\"}}"]
            else
                return [201, resource.to_json]
            end
        end
    end


    ############################################################################
    #
    ############################################################################
    def createMarketApp(type, template)
        action_hash = JSONUtils.parse_json(template, 'action')
        if OpenNebula.is_error?(action_hash)
            return [500, image_hash.to_json]
        end
        marketplaceapp = MarketPlaceAppJSON.new(MarketPlaceApp.build_xml, @client)

        rc = case type
            when "service" then marketplaceapp.app_service_import(action_hash['params'])
            else
                marketplaceapp.app_vm_import(action_hash['params']) #VM / VM_TEMPLATE
            end

        return [201, rc.to_json]
    end

    ############################################################################
    #
    ############################################################################
    def upload(template, file_path)
        image_hash = JSONUtils.parse_json(template, 'image')
        if OpenNebula.is_error?(image_hash)
            return [500, image_hash.to_json]
        end

        image_hash['PATH'] = file_path

        ds_id = JSONUtils.parse_json(template, 'ds_id')
        if OpenNebula.is_error?(ds_id)
            return [500, ds_id.to_json]
        end

        new_template = {
            :image => image_hash,
            :ds_id => ds_id,
        }.to_json

        image = ImageJSON.new(Image.build_xml, @client)

        rc = image.create(new_template)

        if OpenNebula.is_error?(rc)
            return [500, rc.to_json]
        end

        rc = image.info
        #wait until image is ready to return
        while ( !OpenNebula.is_error?(rc) &&
                (image.state_str == 'LOCKED' ||
                image.state_str == 'LOCKED_USED' ||
                image.state_str == 'LOCKED_USED_PERS') ) do

            sleep IMAGE_POLL_SLEEP_TIME
            rc = image.info
        end

        if OpenNebula.is_error?(rc)
            return [404, rc.to_json]
        end

        return [201, image.to_json]
    end

    ############################################################################
    #
    ############################################################################
    def delete_resource(kind, id)
        resource = retrieve_resource(kind, id)
        if OpenNebula.is_error?(resource)
            return [404, resource.to_json]
        end

        rc = resource.delete
        if OpenNebula.is_error?(rc)
            return [500, rc.to_json]
        else
            return [204, resource.to_json]
        end
    end

    ############################################################################
    #
    ############################################################################
    def perform_action(kind, id, action_json)

        resource = retrieve_resource(kind, id)
        if OpenNebula.is_error?(resource)
            return [404, resource.to_json]
        end
        rc = resource.perform_action(action_json)

        if OpenNebula.is_error?(rc)
            return [500, rc.to_json]
        else
            if rc.nil?
                return [204, resource.to_json]
            else
                return [201, rc.to_json]
            end
        end
    end

    ############################################################################
    #
    ############################################################################
    def download_marketplaceapp(id)
        # Get MarketPlaceApp
        marketapp = MarketPlaceApp.new(MarketPlaceApp.build_xml(id.to_i), @client)

        rc    = marketapp.info
        return [500, rc.message] if OpenNebula.is_error?(rc)

        # Get Datastore
        market_id = marketapp['MARKETPLACE_ID']

        market = MarketPlace.new(MarketPlace.build_xml(market_id), @client)
        rc     = market.info

        return [500, rc.message] if OpenNebula.is_error?(rc)

        # Build Driver message
        drv_message    = "<DS_DRIVER_ACTION_DATA>" <<
                         "#{market.to_xml}" <<
                         "</DS_DRIVER_ACTION_DATA>"

        drv_message_64 = Base64::strict_encode64(drv_message)

        source = marketapp['SOURCE']

        download_cmd =  "DRV_ACTION=#{drv_message_64}; "<<
                        "#{VAR_LOCATION}/remotes/datastore/downloader.sh " <<
                        "#{source} -"

        filename = "one-marketplaceapp-#{id}"

        return [download_cmd, filename]
    end

    ############################################################################
    #
    ############################################################################
    def get_vm_log(id)
        resource = retrieve_resource("vm", id)

        if OpenNebula.is_error?(resource)
          return [404, nil]
        end

        use_vms_location = begin
            $conf[:locals][:oned_conf]["LOG"]["USE_VMS_LOCATION"]
        rescue
            "NO"
        end

        if !ONE_LOCATION && use_vms_location != "YES"
            vm_log_file = LOG_LOCATION + "/#{id}.log"
        else
            vm_log_file = VMS_LOCATION + "/#{id}/vm.log"
        end

        begin
            log = File.read(vm_log_file)
        rescue Exception => e
            msg = "Log for VM #{id} not available"
            return [200, {:vm_log => msg}.to_json]
        end

        return [200, {:vm_log => log}.to_json]
    end

    ########################################################################
    # VNC
    ########################################################################
    def startvnc(id, vnc)
        resource = retrieve_resource("vm", id)
        if OpenNebula.is_error?(resource)
            return [404, resource.to_json]
        end

        return vnc.proxy(resource)
    end

    ########################################################################
    # Guacamole
    ########################################################################
    def startguac(id, type_connection, guac, client=nil)
        resource = retrieve_resource("vm", id, true)
        if OpenNebula.is_error?(resource)
            return [404, resource.to_json]
        end

		client = @client
		vm_pool = VirtualMachinePool.new(client, -1)
		user_pool = UserPool.new(client)

		rc = user_pool.info
		if OpenNebula.is_error?(rc)
			 puts rc.message
			 exit -1
		end

		rc = vm_pool.info
		if OpenNebula.is_error?(rc)
			 puts rc.message
			 exit -1
		end

        return guac.proxy(resource, type_connection, client)
    end

    ########################################################################
    # VMRC
    ########################################################################
    def startvmrc(id, vmrc, _client=nil)
      resource = retrieve_resource("vm", id)
      if OpenNebula.is_error?(resource)
          return [404, resource.to_json]
      end
      vm_pool = VirtualMachinePool.new(@client, -1)
      user_pool = UserPool.new(@client)

      rc = user_pool.info
      if OpenNebula.is_error?(rc)
        puts rc.message
        exit -1
      end

      rc = vm_pool.info
      if OpenNebula.is_error?(rc)
        puts rc.message
        exit -1
      end

      client = _client.nil? ? @client : _client
      return vmrc.proxy(resource, client)
    end

    ########################################################################
    # Accounting & Monitoring
    ########################################################################
    def get_pool_monitoring(resource)
        #pool_element
        pool = case resource
            when "vm", "VM"
                VirtualMachinePool.new(@client)
            when "host", "HOST"
                HostPool.new(@client)
            else
                error = Error.new("Monitoring not supported for #{resource}")
                return [200, error.to_json]
            end

        rc = pool.monitoring_last

        if OpenNebula.is_error?(rc)
            error = Error.new(rc.message)
            return [500, error.to_json]
        end

        rc[:resource] = resource

        return [200, rc.to_json]
    end

    def get_resource_monitoring(id, resource, meters)
        pool_element = case resource
            when "vm", "VM"
                VirtualMachine.new_with_id(id, @client)
            when "host", "HOST"
                Host.new_with_id(id, @client)
            else
                error = Error.new("Monitoring not supported for #{resource}")
                return [403, error.to_json]
            end

        meters_a = meters.split(',')

        rc = pool_element.monitoring(meters_a)

        if OpenNebula.is_error?(rc)
            error = Error.new(rc.message)
            return [500, error.to_json]
        end

        meters_h = Hash.new
        meters_h[:resource]   = resource
        meters_h[:id]         = id
        meters_h[:monitoring] = rc

        return [200, meters_h.to_json]
    end


    # returns a { monitoring : meter1 : [[ts1, agg_value],[ts2, agg_value]...]
    #                          meter2 : [[ts1, agg_value],[ts2, agg_value]...]}
    # with this information we can paint historical graphs of usage
    def get_user_accounting(options)
        uid      = options[:id].to_i
        tstart   = options[:start].to_i
        tend     = options[:end].to_i
        interval = options[:interval].to_i
        meters   = options[:monitor_resources]
        gid      = options[:gid].to_i

        acct_options = {:start_time => tstart,
                        :end_time => tend}

        # If we want acct per group, we ask for all VMs visible to user
        # and then filter by group.
        if gid
            uid = Pool::INFO_ALL
            acct_options[:group] = gid
        end

        # Init results and request accounting
        result   = {}
        meters_a = meters.split(',')
        meters_a.each do | meter |
            result[meter] = []
        end
        pool     = VirtualMachinePool.new(@client)
        acct_xml = pool.accounting_xml(uid, acct_options)

        if OpenNebula.is_error?(acct_xml)
            error = Error.new(acct_xml.message)
            return [500, error.to_json]
        end

        xml = XMLElement.new
        xml.initialize_xml(acct_xml, 'HISTORY_RECORDS')

        # We aggregate the accounting values for each interval withing
        # the given timeframe
        while tstart < tend

            tstep = tstart + interval
            count = Hash.new

            # We count machines which have started before the end of
            # this interval AND have not finished yet OR machines which
            # have started before the end of this interval AND
            # have finished anytime after the start of this interval
            xml.each("HISTORY[STIME<=#{tstep} and ETIME=0 or STIME<=#{tstep} and ETIME>=#{tstart}]") do |hr|

                meters_a.each do | meter |
                    count[meter] ||= 0
                    count[meter] += hr["VM/#{meter}"].to_i if hr["VM/#{meter}"]
                end
            end

            # We have aggregated values for this interval
            # Then we just add them to the results along with a timestamp
            count.each do | mname, mcount |
                result[mname] << [tstart, mcount]
            end

            tstart = tstep
        end

        return [200, {:monitoring => result}.to_json]
    end

    def get_vm_accounting(options)
        pool = VirtualMachinePool.new(@client)

        filter_flag = options[:userfilter] ? options[:userfilter].to_i : VirtualMachinePool::INFO_ALL
        start_time  = options[:start_time] ? options[:start_time].to_i : -1
        end_time    = options[:end_time]   ? options[:end_time].to_i : -1

        acct_options = {
            :start_time => start_time,
            :end_time   => end_time,
            :group      => options[:group]
        }

        rc = pool.accounting(filter_flag, acct_options)

        if OpenNebula.is_error?(rc)
            error = Error.new(rc.message)
            return [500, error.to_json]
        end

        return [200, rc.to_json]
    end

    def get_vm_showback(options)
        pool = VirtualMachinePool.new(@client)

        filter_flag = options[:userfilter] ? options[:userfilter].to_i : VirtualMachinePool::INFO_ALL
        start_month  = options[:start_month] ? options[:start_month].to_i : -1
        start_year  = options[:start_year] ? options[:start_year].to_i : -1
        end_month    = options[:end_month]   ? options[:end_month].to_i : -1
        end_year    = options[:end_year]   ? options[:end_year].to_i : -1

        acct_options = {
            :start_month => start_month,
            :start_year => start_year,
            :end_month   => end_month,
            :end_year   => end_year,
            :group      => options[:group]
        }

        rc = pool.showback(filter_flag, acct_options)

        if OpenNebula.is_error?(rc)
            error = Error.new(rc.message)
            return [500, error.to_json]
        end

        return [200, rc.to_json]
    end

    private

    ############################################################################
    #
    ############################################################################
    def retrieve_resource(kind, id, extended=false)
        resource = case kind
            when "group"            then GroupJSON.new_with_id(id, @client)
            when "cluster"          then ClusterJSON.new_with_id(id, @client)
            when "host"             then HostJSON.new_with_id(id, @client)
            when "image"            then ImageJSON.new_with_id(id, @client)
            when "vmtemplate"       then TemplateJSON.new_with_id(id, @client)
            when "vm_group"         then VMGroupJSON.new_with_id(id, @client)
            when "vm"               then VirtualMachineJSON.new_with_id(id, @client)
            when "vnet"             then VirtualNetworkJSON.new_with_id(id, @client)
            when "vntemplate"       then VNTemplateJSON.new_with_id(id, @client)
            when "user"             then UserJSON.new_with_id(id, @client)
            when "acl"              then AclJSON.new_with_id(id, @client)
            when "datastore"        then DatastoreJSON.new_with_id(id, @client)
            when "zone"             then ZoneJSON.new_with_id(id, @client)
            when "security_group"   then SecurityGroupJSON.new_with_id(id, @client)
            when "vdc"              then VdcJSON.new_with_id(id, @client)
            when "vrouter"          then VirtualRouterJSON.new_with_id(id, @client)
            when "marketplace"      then MarketPlaceJSON.new_with_id(id, @client)
            when "marketplaceapp"   then MarketPlaceAppJSON.new_with_id(id, @client)
            when "backupjob"        then BackupJobJSON.new_with_id(id, @client)
            else
                error = Error.new("Error: #{kind} resource not supported")
                return error
        end

        rc = extended ? resource.info(true) : resource.info
        if OpenNebula.is_error?(rc)
            return rc
        else
            return resource
        end
    end
end

# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

require 'json'

# OneProvision Helper
class OneProvisionHelper < OpenNebulaHelper::OneHelper

    # Resource name
    def self.rname
        'DOCUMENT'
    end

    # Configuration file name
    def self.conf_file
        'oneprovision.yaml'
    end

    # Parse user CLI options
    #
    # @param options [Hash] User CLI options
    def parse_options(options)
        OneProvision::OneProvisionLogger.get_logger(options)
        OneProvision::Mode.get_run_mode(options)
        OneProvision::Options.get_run_options(options)
        OneProvision::ObjectOptions.get_obj_options(options)
    end

    # Format pool for CLI list operation
    def format_pool(_)
        config_file = self.class.table_conf

        CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'Identifier for the Provision', :size => 4 do |p|
                p['ID']
            end

            column :NAME, 'Name of the Provision', :left, :size => 25 do |p|
                p['NAME']
            end

            column :CLUSTERS, 'Number of Clusters', :size => 8 do |p|
                p = OneProvisionHelper.body(p)
                p['provision']['infrastructure']['clusters'].size rescue 0
            end

            column :HOSTS, 'Number of Hosts', :size => 5 do |p|
                p = OneProvisionHelper.body(p)
                p['provision']['infrastructure']['hosts'].size rescue 0
            end

            column :NETWORKS, 'Number of Networks', :size => 8 do |p|
                p = OneProvisionHelper.body(p)
                p['provision']['infrastructure']['networks'].size rescue 0
            end

            column :DATASTORES, 'Number of Datastores', :size => 10 do |p|
                p = OneProvisionHelper.body(p)
                p['provision']['infrastructure']['datastores'].size rescue 0
            end

            column :STAT, 'Provision state', :size => 12 do |p|
                p = OneProvisionHelper.body(p)
                OneProvision::Provision::STATE_STR[p['state']] rescue '-'
            end

            default :ID, :NAME, :CLUSTERS, :HOSTS, :NETWORKS, :DATASTORES, :STAT
        end
    end

    # Shows provision information
    #
    # @param id      [Integer] Provision ID
    # @param options [Hash]    User CLI options
    #
    # @return [Array] [rc, information to show]
    def show_resource(id, options)
        # Add body paremter to get resource in hash format
        options[:body] = true
        info           = super

        return info if info[0] != 0

        if options[:json]
            info[1]['DOCUMENT']['TEMPLATE']['BODY'] = JSON.parse(
                info[1]['DOCUMENT']['TEMPLATE']['BODY']
            )
            info[1] = JSON.pretty_generate(info[1])
        end

        info
    end

    # Format resource to output it in show command
    #
    # @param provision [Hash] Provision information
    def format_resource(provision, _)
        str_h1 = '%-80s'
        id     = provision['ID']
        body   = provision.body

        CLIHelper.print_header(str_h1 % "PROVISION #{id} INFORMATION")
        puts format('ID    : %<s>s', :s => id)
        puts format('NAME  : %<s>s', :s => provision['NAME'])
        puts format('STATE : %<s>s',
                    :s => OneProvision::Provision::STATE_STR[body['state']])

        infrastructure = provision.infrastructure_objects
        resource       = provision.resource_objects

        if infrastructure
            show_resources(OneProvision::Provision::FULL_CLUSTER,
                           infrastructure,
                           'Infrastructure')
        end

        return if !resource || resource.empty?

        show_resources(OneProvision::Provision::RESOURCES, resource, 'Resource')
    end

    #######################################################################
    # Helper provision functions
    #######################################################################

    # Creates a new provision
    #
    # @param config  [String]  Path to deployment file
    # @param cleanup [Boolean] True to cleanup everything
    # @param timeout [Integer] Timeout in seconds to connect to hosts
    # @param skip    [Symbol]  Skip provision, configuration or anything
    #
    # @param [Intenger] New provision ID
    def create(config, cleanup, timeout, skip)
        xml       = OneProvision::Provision.build_xml
        provision = OneProvision::Provision.new(xml, @client)

        provision.deploy(config, cleanup, timeout, skip)
    end

    # Configures provision hosts
    #
    # @param id    [Integer] Provision ID
    # @param force [Boolean] True to configure hosts anyway
    def configure(id, force)
        provision = OneProvision::Provision.new_with_id(id, @client)

        rc = provision.info

        return rc if OpenNebula.is_error?(rc)

        provision.configure(force)
    end

    # Deletes an existing provision
    #
    # @param id      [Intenger] Provision ID
    # @param cleanup [Boolean]  True to delete VMs and images
    # @param timeout [Intenger] Timeout in seconds to wait in delete
    def delete(id, cleanup, timeout)
        provision = OneProvision::Provision.new_with_id(id, @client)

        rc = provision.info

        return rc if OpenNebula.is_error?(rc)

        provision.delete(cleanup, timeout)
    end

    #######################################################################
    # Helper host functions
    #######################################################################

    # Executes an operation in a host
    #
    # @param host      [OpenNebula::Host]
    # @param operation [String]  Operation to perform
    # @param options   [Hash]    User CLI options
    # @param args      [Array]   Operation arguments
    def host_operation(host, operation, options, args)
        p_id = host['TEMPLATE/PROVISION_ID']

        return OpenNebula::Error.new('No provision ID found') unless p_id

        provision = OneProvision::Provision.new_with_id(p_id, @client)

        rc = provision.info

        return rc if OpenNebula.is_error?(rc)

        id   = host['ID']
        host = OneProvision::Host.new(provision.provider)
        host.info(id)

        case operation[:operation]
        when 'resume'
            host.resume
        when 'poweroff'
            host.poweroff
        when 'reboot'
            host.reboot((options.key? :hard))
        when 'delete'
            provision.update_objects('hosts', :remove, host.one['ID'])
        when 'configure'
            host.configure((options.key? :force))
        when 'ssh'
            host.ssh(args)
        end
    end

    #######################################################################
    # Helper resource functions
    #######################################################################

    # Executes an operation in a resource
    #
    # @param args      [Array]   Operation arguments
    # @param operation [String]  Operation to perform
    # @param options   [Hash]    User CLI options
    # @param type      [String]  Object type
    def resources_operation(args, operation, options, type)
        parse_options(options)


        objects = names_to_ids(args[0], type)

        return [-1, objects.message] if OpenNebula.is_error?(objects)

        helper(type).perform_actions(objects,
                                     options,
                                     operation[:message]) do |obj|
            rc = obj.info

            return rc if OpenNebula.is_error?(rc)

            case type
            when 'HOSTS'
                host_operation(obj, operation, options, args[1])
            else
                msg = "Deleting #{type} #{obj['ID']}"

                OneProvision::OneProvisionLogger.info(msg)

                if type != 'FLOWTEMPLATES'
                    p_id = obj['TEMPLATE/PROVISION_ID']
                else
                    p_id = JSON.parse(obj.template)['PROVISION_ID']
                end

                unless p_id
                    return OpenNebula::Error.new('No provision ID found')
                end

                provision = OneProvision::Provision.new_with_id(p_id, @client)

                rc = provision.info

                return rc if OpenNebula.is_error?(rc)

                provision.update_objects(type.downcase, :remove, obj['ID'])
            end
        end
    end

    # List provision obects
    #
    # @param type    [Symbol]  Object to list
    # @param options [Hash]    User CLI options
    # @param top     [Boolean] True to list objects continuously
    def list_objects(type, options, top = false)
        unless options[:filter]
            if OneProvision::Provision::FULL_CLUSTER.include?(type.downcase)
                path = 'infrastructure'
            else
                path = 'resource'
            end

            pool = factory_pool(options)
            rc   = pool.info

            return rc if OpenNebula.is_error?(rc)

            pool = pool.to_hash['DOCUMENT_POOL']['DOCUMENT']
            pool = [pool].flatten

            options[:filter]   = []
            options[:operator] = 'OR'

            # Iterate over pool to get IDs and get the filter option
            pool.each do |obj|
                body = OneProvisionHelper.body(obj)

                next unless body['provision'][path][type.downcase]

                body['provision'][path][type.downcase].each do |e|
                    options[:filter] << "ID=#{e['id']}"
                end
            end
        end

        # if filter is empty, add fake filter to avoid showing anything
        options[:filter] << 'ID=nil' if options[:filter].empty?

        helper = helper(type)

        if OpenNebula.is_error?(helper)
            STDERR.puts helper.message
            exit(-1)
        end

        helper.list_pool(options, top)

        0
    end

    private

    # Get object IDs from name
    #
    # @param objects [Array]  Objects name
    # @param type    [String] Object type class
    def names_to_ids(objects, type)
        [objects].flatten.map do |obj|
            rc = OpenNebulaHelper.rname_to_id(obj.to_s, type)

            return OpenNebula::Error.new(rc[1]) unless rc[0] == 0

            rc[1]
        end
    end

    # Returns a new provision object
    #
    # @param id [Integer] Provision ID
    def factory(id = nil)
        if id
            OneProvision::Provision.new_with_id(id, @client)
        else
            OneProvision::Provision.new(OneProvision::Provision.build_xml,
                                        @client)
        end
    end

    # Returns provision pool
    def factory_pool(_)
        OneProvision::ProvisionPool.new(@client)
    end

    class << self

        # Returns provision body in JSON format
        #
        # @param document [Hash] Provision document
        def body(document)
            JSON.parse(document['TEMPLATE']['BODY'])
        end

    end

    # Returns helper and filter depending on type
    #
    # @param type [String] Helper type
    #
    # @returns [OpenNebula::Helper] Helper
    def helper(type)
        case type
        when 'HOSTS'         then helper = OneHostHelper.new
        when 'DATASTORES'    then helper = OneDatastoreHelper.new
        when 'NETWORKS'      then helper = OneVNetHelper.new
        when 'CLUSTERS'      then helper = OneClusterHelper.new
        when 'IMAGES'        then helper = OneImageHelper.new
        when 'TEMPLATES'     then helper = OneTemplateHelper.new
        when 'VNTEMPLATES'   then helper = OneVNTemplateHelper.new
        when 'FLOWTEMPLATES' then helper = OneFlowTemplateHelper.new
        end

        helper.set_client({})
        helper
    end

    # Shows resources
    #
    # @param resources_names [Array]  Resources types
    # @param resources       [Array]  Resources information
    # @param type            [String] Resource or Infrastructure resources
    def show_resources(resources_names, resources, type)
        puts
        CLIHelper.print_header("Provision #{type} Resources")

        resources_names.sort.each do |r|
            next if !resources[r] || resources[r].empty?

            puts
            CLIHelper.print_header(format('%<s>s', :s => r.upcase))
            resources[r].each do |i|
                puts format('%<s>s', :s => "#{i['id']}: #{i['name']}")
            end
        end
    end

end

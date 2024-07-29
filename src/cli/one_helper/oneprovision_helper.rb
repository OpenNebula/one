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

require 'json'

require 'oneprovision'

# OneProvision Helper
class OneProvisionHelper < OpenNebulaHelper::OneHelper

    TAG = OneProvision::Provision::TEMPLATE_TAG

    ########################################################################
    # Global Options
    ########################################################################

    ############################ Output Modes ##############################

    VERBOSE = {
        :name => 'verbose',
        :short => '-d',
        :large => '--verbose',
        :description => 'Set verbose logging mode'
    }

    DEBUG = {
        :name => 'debug',
        :short => '-D',
        :large => '--debug',
        :description => 'Set debug logging mode',
        :format => String
    }

    ############################# Run Modes ################################

    BATCH = {
        :name => 'batch',
        :short => '-b',
        :large => '--batch',
        :description => 'Run in non-interactive mode (no questions)',
        :format => String
    }

    FAIL_MODES = {
        :name => 'fail_modes',
        :large => '--fail-modes mode1,mode2',
        :description => 'Fail modes to apply in order',
        :format => Array,
        :proc => lambda do |_, options|
            options = options[:fail_modes].map do |v|
                v = v.downcase.to_sym

                unless OneProvision::DEFAULT_FAIL_MODES.include?(v)
                    STDERR.puts "Wrong fail mode `#{v}`"
                    exit(-1)
                end

                v
            end

            [0, options]
        end
    }

    FAIL_RETRY = {
        :name => 'fail_retry',
        :large => '--fail-retry number',
        :description => 'Set batch failover mode to number of retries',
        :format => Integer
    }

    FAIL_CLEANUP = {
        :name => 'fail_cleanup',
        :large => '--fail-cleanup',
        :description => 'Set batch failover mode to clean up and quit'
    }

    FAIL_SKIP = {
        :name => 'fail_skip',
        :large => '--fail-skip',
        :description => 'Set batch failover mode to skip failing part'
    }

    FAIL_QUIT = {
        :name => 'fail_quit',
        :large => '--fail-quit',
        :description => 'Set batch failover mode to quit (default)'
    }

    FAIL_SLEEP = {
        :name => 'fail_sleep',
        :large => '--fail-sleep seconds',
        :description => 'Time in seconds between each fail mode is executed ' \
                        'and between each retry',
        :format => Integer
    }

    ############################## Create ##################################

    PING_TIMEOUT = {
        :name => 'ping_timeout',
        :large => '--ping-timeout seconds',
        :description => 'Set timeout for ping ' \
                        "(default: #{OneProvision::PING_TIMEOUT_DEFAULT} secs)",
        :format => Integer
    }

    PING_RETRIES = {
        :name => 'ping_retries',
        :large => '--ping-retries number',
        :description => 'Set retries for ping ' \
                        "(default: #{OneProvision::PING_RETRIES_DEFAULT})",
        :format => Integer
    }

    SKIP_PROVISION = {
        :name => 'skip_provision',
        :large => '--skip-provision',
        :description => 'Skip provision and configuration hosts phases'
    }

    SKIP_CONFIG = {
        :name => 'skip_config',
        :large => '--skip-config',
        :description => 'Skip configuration hosts phase'
    }

    WAIT_READY = {
        :name => 'wait_ready',
        :large => '--wait-ready',
        :description => 'Wait resources to be ready in OpenNebula'
    }

    WAIT_TIMEOUT = {
        :name => 'wait_timeout',
        :large => '--wait-timeout timeout',
        :description => 'Timeout to wait objects to be ready',
        :format      => Integer
    }

    PROVIDER = {
        :name => 'provider',
        :large => '--provider provider',
        :description => 'Provider to deploy provision',
        :format => String
    }

    USER_INPUTS = {
        :name   => 'user_inputs',
        :large  => '--user-inputs ui1,ui2,ui3',
        :format => Array,
        :description => 'Specify the user inputs values when deploying',
        :proc => lambda do |_, options|
            options[:inputs] = []

            # escape values
            options[:user_inputs].each do |user_input|
                split = user_input.split('=')
                options[:inputs] << { 'name' => split[0], 'value' => split[1] }
            end

            0
        end
    }

    ########################################################################

    THREADS = {
        :name => 'threads',
        :short => '-t threads',
        :large => '--threads threads',
        :description => 'Set threads for create (default: ' \
                        "#{OneProvision::THREADS_DEFAULT})",
        :format => Integer
    }

    FORCE = {
        :name => 'force',
        :short => '-F',
        :large => '--force',
        :description => 'Force configure to execute',
        :format => String
    }

    HARD = {
        :name => 'hard',
        :short => '-H',
        :large => '--hard',
        :description => 'Reset the host',
        :format => String
    }

    CLEANUP = {
        :name => 'cleanup',
        :large => '--cleanup',
        :description => 'Delete all vms and images first, ' \
                        'then delete the resources.'
    }

    CLEANUP_TIMEOUT = {
        :name => 'cleanup_timeout',
        :large => '--cleanup-timeout timeout',
        :description => 'Change the default timeout when deleting VMs/Images.'
    }

    DUMP = {
        :name => 'dump',
        :large => '--dump',
        :description => 'Dump the configuration file result.'
    }

    AMOUNT = {
        :name  => 'amount',
        :large => '--amount amount',
        :description => 'Amount of hosts to add to the provision',
        :format => Integer
    }

    HOSTNAMES = {
        :name  => 'hostnames',
        :large => '--hostnames h1,h2',
        :description => 'Hostnames when adding new host to onpremise provision',
        :format => Array
    }

    HOST_PARAMS = {
        :name  => 'host_params',
        :large => '--host-params param=value',
        :description => 'Extra param to pass to host, e.g.: ceph_group=osd',
        :format => String
    }

    ########################################################################

    MODES = CommandParser::OPTIONS - [CommandParser::VERBOSE] +
            [VERBOSE,
             DEBUG,
             BATCH,
             FAIL_RETRY,
             FAIL_CLEANUP,
             FAIL_SKIP,
             FAIL_QUIT,
             FAIL_MODES,
             FAIL_SLEEP]

    CREATE_OPTIONS = [THREADS,
                      MODES,
                      PING_TIMEOUT,
                      PING_RETRIES,
                      CLEANUP,
                      CLEANUP_TIMEOUT,
                      SKIP_PROVISION,
                      SKIP_CONFIG,
                      WAIT_READY,
                      WAIT_TIMEOUT,
                      PROVIDER,
                      USER_INPUTS] + [OpenNebulaHelper::FORMAT]

    ONE_OPTIONS = CommandParser::OPTIONS +
                  CLIHelper::OPTIONS +
                  OpenNebulaHelper::OPTIONS

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
                p.extend(CLIHelper::HashWithSearch)
                p = JSON.parse(p.dsearch("TEMPLATE/#{TAG}"))

                p['provision']['infrastructure']['clusters'].size rescue 0
            end

            column :HOSTS, 'Number of Hosts', :size => 5 do |p|
                p.extend(CLIHelper::HashWithSearch)
                p = JSON.parse(p.dsearch("TEMPLATE/#{TAG}"))

                p['provision']['infrastructure']['hosts'].size rescue 0
            end

            column :NETWORKS, 'Number of Networks', :size => 8 do |p|
                p.extend(CLIHelper::HashWithSearch)
                p = JSON.parse(p.dsearch("TEMPLATE/#{TAG}"))

                p['provision']['infrastructure']['networks'].size rescue 0
            end

            column :DATASTORES, 'Number of Datastores', :size => 10 do |p|
                p.extend(CLIHelper::HashWithSearch)
                p = JSON.parse(p.dsearch("TEMPLATE/#{TAG}"))

                p['provision']['infrastructure']['datastores'].size rescue 0
            end

            column :STAT, 'Provision state', :size => 12 do |p|
                p.extend(CLIHelper::HashWithSearch)
                p = JSON.parse(p.dsearch("TEMPLATE/#{TAG}"))

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
    def show_resource(_, options)
        # Add body paremter to get resource in hash format
        options[:body] = true
        info           = super

        return info if info[0] != 0

        if options[:json]
            info[1]['DOCUMENT']['TEMPLATE'][TAG] = JSON.parse(
                info[1]['DOCUMENT']['TEMPLATE'][TAG]
            )
            info[1] = JSON.pretty_generate(info[1])
        elsif options[:yaml]
            yaml = YAML.safe_load(info[1])
            yaml['DOCUMENT']['TEMPLATE'][TAG] = JSON.parse(
                yaml['DOCUMENT']['TEMPLATE'][TAG]
            )
            info[1] = yaml.to_yaml(:indent => 4)
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
        puts format('ID        : %<s>s', :s => id)
        puts format('NAME      : %<s>s', :s => provision['NAME'])
        puts format('STATE     : %<s>s',
                    :s => OneProvision::Provision::STATE_STR[body['state']])
        puts format('PROVIDER  : %<s>s', :s => body['provider'])

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
    # @param config   [String]         Path to deployment file
    # @param cleanup  [Boolean]        True to cleanup everything
    # @param timeout  [Integer]        Timeout in seconds to connect to hosts
    # @param skip     [Symbol]         Skip provision, configuration or anything
    # @param provider [String/Integer] Provider to deploy the provision
    #
    # @param [Intenger] New provision ID
    def create(config, cleanup, timeout, skip, provider)
        xml       = OneProvision::Provision.build_xml
        provision = OneProvision::Provision.new(xml, @client)

        # If user has sepcified a provider, get it from the pool
        if provider
            provider = OneProvision::Provider.by_name(@client, provider)

            return [-1, provider.message] if OpenNebula.is_error?(provider)

            return [-1, 'Provider not found'] unless provider
        end

        provision.deploy(config, cleanup, timeout, skip, provider)
    end

    # Configures provision hosts
    #
    # @param id    [Integer] Provision ID
    # @param force [Boolean] True to configure hosts anyway
    def configure(id, force)
        provision = OneProvision::Provision.new_with_id(id, @client)
        rc        = provision.info

        return [-1, rc.message] if OpenNebula.is_error?(rc)

        rc = provision.configure(force)

        return [-1, rc.message] if OpenNebula.is_error?(rc)

        0
    end

    # Deletes an existing provision
    #
    # @param id      [Intenger] Provision ID
    # @param cleanup [Boolean]  True to delete VMs and images
    # @param timeout [Intenger] Timeout in seconds to wait in delete
    # @param force   [Boolean]  Force provision deletion
    def delete(id, cleanup, timeout, force)
        provision = OneProvision::Provision.new_with_id(id, @client)
        rc        = provision.info

        return [-1, rc.message] if OpenNebula.is_error?(rc)

        rc = provision.synchronize(3) do
            provision.delete(cleanup, timeout, force)
        end

        return [-1, rc.message] if OpenNebula.is_error?(rc)

        0
    end

    #######################################################################
    # Helper host functions
    #######################################################################

    # Adds a new hosts to the provision and configures them
    #
    # @param id      [Integer] Provision ID
    # @param options [Hash]    User CLI options
    def add_hosts(id, options)
        parse_options(options)

        options.key?(:amount) ? amount = options[:amount] : amount = 1

        provision = OneProvision::Provision.new_with_id(id, @client)
        rc        = provision.info

        return [-1, rc.message] if OpenNebula.is_error?(rc)

        rc = provision.add_hosts(amount, options[:hostnames],
                                 options[:host_params])

        return [-1, rc.message] if OpenNebula.is_error?(rc)

        0
    end

    # Executes an operation in a host
    #
    # @param host      [OpenNebula::Host]
    # @param operation [String] Operation to perform
    # @param args      [Array]  Operation arguments
    def host_operation(host, operation, args)
        p_id = host['TEMPLATE/PROVISION/ID']

        return OpenNebula::Error.new('No provision ID found') unless p_id

        provision = OneProvision::Provision.new_with_id(p_id, @client)
        rc        = provision.info

        return [-1, rc.message] if OpenNebula.is_error?(rc)

        id   = host['ID']
        host = OneProvision::Host.new(provision.provider['NAME'])
        host.info(id)

        rc = nil

        case operation[:operation]
        when 'delete'
            rc = provision.update_objects('hosts', :remove, host.one['ID'])
        when 'configure'
            rc = host.configure
        when 'ssh'
            rc = host.ssh(args)
        end

        return [-1, rc.message] if OpenNebula.is_error?(rc)

        0
    end

    #######################################################################
    # Helper resource functions
    #######################################################################

    # Add more IPs to provision network
    #
    # @param id     [Integer] Provision ID
    # @param amount [Integer] Number of IPs to add
    def add_ips(id, amount)
        provision = OneProvision::Provision.new_with_id(id, @client)
        rc        = provision.info

        return [-1, rc.message] if OpenNebula.is_error?(rc)

        rc = provision.add_ips(amount.nil? ? 1 : amount)

        return [-1, rc.message] if OpenNebula.is_error?(rc)

        0
    end

    # Executes an operation in a resource
    #
    # @param args      [Array]   Operation arguments
    # @param operation [String]  Operation to perform
    # @param options   [Hash]    User CLI options
    # @param type      [String]  Object type
    def resources_operation(args, operation, options, type)
        parse_options(options)

        OneProvision::Utils.print_cmd("#{type} #{operation[:operation]}",
                                      options)

        objects = names_to_ids(args[0], type)

        return [-1, objects.message] if OpenNebula.is_error?(objects)

        helper(type).perform_actions(objects,
                                     options,
                                     operation[:message]) do |obj|
            rc = obj.info

            return [-1, rc.message] if OpenNebula.is_error?(rc)

            case type
            when 'HOST', 'HOSTS'
                host_operation(obj, operation, args[1])
            else
                msg = "Deleting #{type} #{obj['ID']}"

                OneProvision::OneProvisionLogger.info(msg)

                if type != 'FLOWTEMPLATES'
                    p_id = obj['TEMPLATE/PROVISION/ID']
                else
                    p_id = JSON.parse(obj.template)['PROVISION']['ID']
                end

                unless p_id
                    return [-1, 'No provision ID found']
                end

                provision = OneProvision::Provision.new_with_id(p_id, @client)
                rc        = provision.info

                return [-1, rc.message] if OpenNebula.is_error?(rc)

                rc = provision.update_objects(type.downcase, :remove, obj['ID'])

                return [-1, rc.message] if OpenNebula.is_error?(rc)

                0
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
            rc   = pool.info_all

            return [-1, rc.message] if OpenNebula.is_error?(rc)

            pool = pool.map do |e|
                e.info(true)
                e.to_hash['DOCUMENT']
            end

            pool = [pool].flatten

            options[:filter]   = []
            options[:operator] = 'OR'

            # Iterate over pool to get IDs and get the filter option
            pool.each do |obj|
                obj.extend(CLIHelper::HashWithSearch)
                body = JSON.parse(obj.dsearch("TEMPLATE/#{TAG}"))

                next unless body['provision'][path][type.downcase]

                body['provision'][path][type.downcase].each do |e|
                    options[:filter] << "ID=#{e['id']}"
                end
            end
        end

        # if filter is empty, add fake filter to avoid showing anything
        options[:filter] << 'ID=nil' if options[:filter].empty?

        helper = helper(type)

        return [-1, helper.message] if OpenNebula.is_error?(helper)

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

    # Returns helper and filter depending on type
    #
    # @param type [String] Helper type
    #
    # @returns [OpenNebula::Helper] Helper
    def helper(type)
        case type
        when 'HOST', 'HOSTS' then helper = OneHostHelper.new
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

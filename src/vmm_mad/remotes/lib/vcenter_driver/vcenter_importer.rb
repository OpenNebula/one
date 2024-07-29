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

##############################################################################
# Module VCenterDriver
##############################################################################
module VCenterDriver

    ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

    if !ONE_LOCATION
        RUBY_LIB_LOCATION = '/usr/lib/one/ruby' \
                                unless defined?(RUBY_LIB_LOCATION)
        GEMS_LOCATION     = '/usr/share/one/gems' \
                                unless defined?(GEMS_LOCATION)
        HOOK_LOCATION     = '/var/lib/one/remotes/hooks' \
                                unless defined?(HOOK_LOCATION)
    else
        RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby' \
                                unless defined?(RUBY_LIB_LOCATION)
        GEMS_LOCATION     = ONE_LOCATION + '/share/gems' \
                                unless defined?(GEMS_LOCATION)
        HOOK_LOCATION     = ONE_LOCATION + '/remotes/hooks' \
                                unless defined?(HOOK_LOCATION)
    end

    ##########################################################################
    # Class VcImporter
    ##########################################################################
    class VcImporter

        attr_accessor :list

        ######################################################################
        # Constructors
        ######################################################################
        #
        #

        # Builds a vCenter importer
        #
        # @param one_client [OpenNebula::Client] OpenNebula ruby Client
        # @param vi_client  [VCenterDriver::VIClient] vCenter driver Client
        #
        def initialize(one_client, vi_client)
            @vi_client  = vi_client
            @one_client = one_client

            @list = {}

            @info = {}
            @info[:clusters] = {}
            @info[:success] = []
            @info[:error]   = []
        end

        #
        # Allow us to spawn a specific importer child
        #
        # @param one_client [OpenNebula::Client] OpenNebula ruby Client
        # @param vi_client  [VCenterDriver::VIClient] vCenter driver Client
        # @param type       [String] to choose the specific child
        #
        # @return [VCImporter] the vCenter importer that will handle
        #                      any operation
        #
        def self.new_child(one_client, vi_client, type)
            case type.downcase
            when 'hosts'
                VCenterDriver::VcImporter.new(one_client, vi_client)
            when 'datastores'
                VCenterDriver::DsImporter.new(one_client, vi_client)
            when 'templates'
                VCenterDriver::VmImporter.new(one_client, vi_client)
            when 'networks'
                VCenterDriver::NetImporter.new(one_client, vi_client)
            when 'images'
                VCenterDriver::ImageImporter.new(one_client, vi_client)
            else
                raise 'unknown object type'
            end
        end

        #
        # @return [String] the object type of the importer
        #
        def one_str
            return @one_class.to_s.split('::').last if @one_class

            'OpenNebula object'
        end

        #
        # Prints feedback of the realized import operations
        # throught STDOUT
        #
        def stdout
            @info[:success].each do |o|
                o[:id].each do |id|
                    puts "ID: #{id}"
                end
            end

            puts

            @info[:error].each do |error|
                index = error.first[0]
                e = @info[index][:e]
                puts "Error: Couldn't import #{index} due to #{e.message}!"
                puts
            end
        end

        # Importer return value
        #
        # @ return [Hash{:sucess =>[[]] , :error => {}}
        #
        def output
            { :success => @info[:success], :error => @info[:error] }
        end

        #
        # Parse arguments usually given by command line interface
        # with the purpose of retrieve a list of selected indexes
        # by the users.
        #
        # @param args [nil | Array | String] range, names or nil
        #
        # @ return [Aarray] the list of selected indexes
        #
        def get_indexes(args = nil)
            raise 'the list is empty' if list_empty?

            list = @list.values[0]
            indexes = ''
            keys = list.keys

            return keys.join(',') unless args

            if args.include?('..')
                range = Range.new(*args.split('..').map(&:to_i))

                if range.first != range.last
                    range.each do |i|
                        indexes << "#{keys[i]}, "
                    end

                    return indexes
                end
            end

            if args !~ /\D/
                ind = args.to_i

                return keys[ind]
            end

            args
        end

        #
        # Wrapper of get_list, needed for clean the cache
        # get_list populates @ref_hash cache at vCenter driver
        # level, with this function you still can reuse the importer.
        #
        # @param opts [Hash] Hash with the needed arguments
        #
        # @ return [Hash] the list of unimported resources
        #
        def retrieve_resources(opts = {})
            VCenterDriver::VIHelper.clean_ref_hash

            list = get_list(opts)

            @defaults = opts[:config] if opts[:config]

            list
        end

        #
        # This method handles all the importation.
        # Will be in charge of call the specific import operation
        # of the specific importer.
        #
        # @param indexes [Array] Array with all the indexes that
        # points to the selected object of the list.
        # @param opts    [Hash] Hash with the options.
        # In sunstone context this options will contain every
        # index associated to his own resource opt
        #
        # Example:
        # {"vm-343" => {:linked_clone: '0', :copy: '0'...}
        #
        # @ return [Hash] the list of unimported resources
        #
        def process_import(indexes, opts = {}, &block)
            raise 'the list is empty' if list_empty?

            indexes = indexes.gsub(/\s*\,\s*/, ',').strip.split(',')

            indexes.each do |index|
                begin
                    @rollback = []
                    @info[index] = {}

                    selected = get_element(index)

                    if block_given?
                        @info[index][:opts] = block.call(selected)
                    elsif opts[index]
                        @info[index][:opts] = opts[index]
                    else
                        @info[index][:opts] = defaults
                    end

                    # import the object
                    @info[:success] << import(selected)
                rescue StandardError => e
                    @info[:error] << { index => e.message }
                    @info[index][:e] = e

                    apply_rollback
                end
            end
        end

        def self.import_clusters(con_ops, options)
            begin
                STDOUT.print "\nConnecting to vCenter: #{options[:vcenter]}..."

                use_defaults = options.key?(:defaults)

                vi_client = VCenterDriver::VIClient.new(con_ops)

                STDOUT.print "done!\n\n"

                STDOUT.print 'Exploring vCenter resources...'

                dc_folder = VCenterDriver::DatacenterFolder.new(vi_client)

                vcenter_instance_name = vi_client.vim.host

                # OpenNebula's ClusterPool
                cpool = VCenterDriver::VIHelper
                        .one_pool(OpenNebula::ClusterPool, false)
                if cpool.respond_to?(:message)
                    raise "Could not get OpenNebula ClusterPool: \
                          #{cpool.message}"
                end

                cluster_list = {}
                cpool.each do |c|
                    name = VCenterDriver::VcImporter.sanitize(
                        c['NAME']
                    )
                    cluster_list[c['ID']] = name if c['ID'].to_i != 0
                end

                # Get OpenNebula's host pool
                hpool = VCenterDriver::VIHelper
                        .one_pool(OpenNebula::HostPool, false)
                if hpool.respond_to?(:message)
                    raise "Could not get OpenNebula HostPool: #{hpool.message}"
                end

                rs = dc_folder.get_unimported_hosts(hpool,
                                                    vcenter_instance_name)

                # Select just cluster with this reference
                if options[:cluster_ref]
                    rs.each do |_, clusters|
                        clusters.select! do |c|
                            c[:cluster_ref] == options[:cluster_ref]
                        end
                    end
                end

                STDOUT.print "done!\n\n"

                rs.each do |dc, clusters|
                    if !use_defaults
                        # rubocop:disable Layout/LineLength
                        STDOUT.print "Do you want to process datacenter #{dc} (y/[n])? "
                        # rubocop:enable Layout/LineLength
                        next if STDIN.gets.strip.downcase != 'y'
                    end

                    if clusters.empty?
                        STDOUT.puts "\n    No new clusters found in #{dc}..."
                        next
                    end

                    clusters.each do |cluster|
                        one_cluster_id = nil
                        rpool = nil

                        # Handle OpenNebula cluster creation or reuse
                        if !use_defaults
                            # rubocop:disable Layout/LineLength
                            STDOUT.print "\n  * vCenter cluster found:\n"\
                                         "      - Name       : \e[92m#{cluster[:simple_name]}\e[39m\n"\
                                         "      - Location   : #{cluster[:cluster_location]}\n"\
                                         '    Import cluster (y/[n])? '
                            # rubocop:enable Layout/LineLength
                            next if STDIN.gets.strip.downcase != 'y'

                            if !cluster_list.empty?
                                # rubocop:disable Layout/LineLength
                                STDOUT.print "\n    In which OpenNebula cluster do you want the vCenter cluster to be included?\n "
                                # rubocop:enable Layout/LineLength

                                cluster_list_str = "\n"
                                cluster_list.each do |key, value|
                                    name = VCenterDriver::VcImporter.sanitize(
                                        value
                                    )
                                    cluster_list_str << "      - \e[94mID: " \
                                                     << key \
                                                     << "\e[39m - NAME: " \
                                                     << name << "\n"
                                end

                                STDOUT.print "\n    #{cluster_list_str}"
                                # rubocop:disable Layout/LineLength
                                STDOUT.print "\n    Specify the ID of the cluster or press Enter if you want OpenNebula to create a new cluster for you: "
                                # rubocop:enable Layout/LineLength
                                answer = STDIN.gets.strip

                                if !answer.empty?
                                    one_cluster_id = answer
                                end
                            end
                        end

                        cluster_name = VCenterDriver::VcImporter.sanitize(
                            cluster[:cluster_name]
                        )

                        # Check if the OpenNebula Cluster exists, and reuse it
                        one_cluster_id ||= cluster_list
                                           .key(cluster_name)

                        if !one_cluster_id
                            one_cluster = VCenterDriver::VIHelper
                                          .new_one_item(OpenNebula::Cluster)
                            rc = one_cluster
                                 .allocate(cluster_name.to_s)
                            if ::OpenNebula.is_error?(rc)
                                # rubocop:disable Layout/LineLength
                                STDOUT.puts "    Error creating OpenNebula cluster: #{rc.message}\n"
                                # rubocop:enable Layout/LineLength
                                next
                            end
                            one_cluster_id = one_cluster.id
                        end

                        # Generate host template and allocate new host
                        one_host = VCenterDriver::ClusterComputeResource
                                   .to_one(cluster,
                                           con_ops,
                                           rpool,
                                           one_cluster_id)
                        # rubocop:disable Layout/LineLength
                        STDOUT.puts "\n    OpenNebula host \e[92m#{cluster_name}\e[39m with"\
                                    " ID \e[94m#{one_host.id}\e[39m successfully created."
                        STDOUT.puts
                        # rubocop:enable Layout/LineLength
                    end
                end
            rescue Interrupt
                puts "\n"
                exit 0 # Ctrl+C
            rescue StandardError => e
                error_msg = "\nError: #{e.message}\n"
                error_msg << "#{e.backtrace}\n" \
                              if VCenterDriver::CONFIG[:debug_information]
                STDERR.puts error_msg
                raise_error = true
            ensure
                vi_client.close_connection if vi_client
                raise if raise_error
            end
        end

        def self.sanitize(text)
            bad_chars = ['|']
            bad_chars.each do |bad_char|
                text.gsub!(bad_char, '_')
            end
            text
        end

        protected

        #
        # Object used for stack action and perform rollback
        #
        # Constructor:
        # @param object [Ruby Object] Any object related to the action.
        # @param method [Symbol] Symbol representing the method
        #               (must belong to object)
        # @param args   [Array] Array with list of arguments,
        #               will be passed to method
        #
        # apply:
        # The stored @object call ther @method with @args
        class Raction

            def initialize(object, method, args = [])
                @object = object
                @action = method
                @args = args
            end

            def apply
                @object.method(@action).call(*@args)
            end

            def self.delete_ars(ar_ids, opts)
                error = opts[:error]

                raise error if ar_ids.nil?

                # key = opts[:key]
                vc_uuid = opts[:uuid]
                npool = opts[:npool]

                ar_ids.each do |key, value|
                    network = VCenterDriver::VIHelper
                              .find_by_ref(OpenNebula::VirtualNetworkPool,
                                           'TEMPLATE/VCENTER_NET_REF',
                                           key,
                                           vc_uuid, npool)
                    value.each {|ar| network.rm_ar(ar) }
                end

                raise error
            end

        end

        #######################################################################
        # ABSTRACT INTERFACE
        #######################################################################
        #
        # This Interface should be implemented by the specific importer.

        MESS = 'missing method from parent'

        #
        # Retrieves a list with the unimported resources
        # The importer needs to perform this operation
        # before any import operation,
        #
        # @param args [Hash] Hash with the needed arguments
        #
        # @return [Hash{String => Hash}] operation results.
        #
        def get_list(_args = {})
            raise MESS
        end

        #
        # Add certain resource to OpenNebula Cluster.
        #
        # @param cid [Int] opennebula cluster id
        # @param eid [Int] the id of the imported opennebula resource
        #
        def add_cluster(_cid, _eid)
            raise MESS
        end

        #
        # Remove the imported resource from the default cluster
        #
        # @param id [Int] id of the imported resource
        #
        def remove_default(_id)
            raise MESS
        end

        #
        # Retrieves information about the run-time state of a virtual machine.
        #
        # @param selected [Hash] Hash with the info of the
        #                        vCenter object that will
        # be imported
        #
        # @return [Hash{:id => [], :name => String}] operation results.
        #
        def import(_selected)
            raise MESS
        end

        #
        # Create and allocate a OpenNebula Object.
        #
        # @param info [String] Info passed to OpenNebula Core.
        #
        # @return [&block] the allocated object through a block.
        #
        def create(info, &block)
            resource = VCenterDriver::VIHelper.new_one_item(@one_class)
            message = 'Error creating the OpenNebula resource'

            rc = resource.allocate(info)
            VCenterDriver::VIHelper.check_error(rc, message)

            resource.info
            id = resource['ID']
            @rollback << Raction.new(resource, :delete)
            block.call(resource, id)
        end

        #
        # Asks if @list is empty
        #
        def list_empty?
            @list == {}
        end

        #
        # Gets a certain element from the list, ref given.
        #
        # @param ref [String] vCenter reference and index of importer list.
        #
        # @return [Hash] Hash with all the info related to the reference
        #
        def get_element(ref)
            raise 'the list is empty' if list_empty? || @list.values[0].empty?

            list = @list.values[0]

            return list[ref] if list[ref]

            raise "#{ref} not found!"
        end

        #
        # Add the imported resources to n OpenNebula Clusters.
        # And remove the default one(0).
        #
        # @param one_id   [Int] The id of the imported OpenNebula object.
        # @param clusters [Array] Array with all the ids of the desired
        # OpenNebula clusters.
        #
        def add_clusters(one_id, clusters)
            clusters.each do |cid|
                next if cid < 0

                @info[:clusters][cid] ||= VCenterDriver::VIHelper
                                          .one_item(OpenNebula::Cluster,
                                                    cid.to_s,
                                                    false)
                rc = add_cluster(cid, one_id.to_i)
                VCenterDriver::VIHelper
                    .check_error(rc, 'add element to cluster')
            end
            remove_default(one_id)
        end

        #
        # Call this function to use the rollback Stack, and delete every
        # corrupted object created by the importer.
        #
        def apply_rollback
            return if @rollback.empty?

            @rollback.each do |action|
                action.apply
            end
        end

        #
        # Default opts
        #
        def defaults
            return @defaults if @defaults

            {}
        end

        def create_pools
            dpool = VCenterDriver::VIHelper.one_pool(OpenNebula::DatastorePool)
            if dpool.respond_to?(:message)
                raise "Could not get OpenNebula DatastorePool: \
                      #{dpool.message}"
            end

            ipool = VCenterDriver::VIHelper.one_pool(OpenNebula::ImagePool)
            if ipool.respond_to?(:message)
                raise "Could not get OpenNebula ImagePool: #{ipool.message}"
            end

            npool = VCenterDriver::VIHelper
                    .one_pool(OpenNebula::VirtualNetworkPool)
            if npool.respond_to?(:message)
                raise "Could not get OpenNebula VirtualNetworkPool: \
                      #{npool.message}"
            end

            hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool)
            if hpool.respond_to?(:message)
                raise "Could not get OpenNebula VirtualNetworkPool: \
                      #{hpool.message}"
            end

            [dpool, ipool, npool, hpool]
        end

    end

end

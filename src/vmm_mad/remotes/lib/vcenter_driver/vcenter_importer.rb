# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

module VCenterDriver
    class VcImporter
        attr_accessor :list

        protected

		#
		# Object used for stack action and perform rollback
		#
        # Constructor:
        # @param object [Ruby Object] Any object related to the action.
		# @param method [Symbol] Symbol representing the method (must belong to object)
		# @param args   [Array] Array with list of arguments, will be passed to method
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
        end

        #######################################################################
        # ABSTRACT INTERFACE
        #######################################################################
        #
        # This Interface should be implemented by the specific importer.

        MESS = "missing method from parent"

		#
		# Retrieves a list with the unimported resources
		# The importer needs to perform this operation
		# before any import operation,
        #
		# @param args [Hash] Hash with the needed arguments
		#
		# @return [Hash{String => Hash}] operation results.
		#
        def get_list(args = {})   raise MESS end

		#
		# Add certain resource to OpenNebula Cluster.
		#
		# @param cid [Int] opennebula cluster id
		# @param eid [Int] the id of the imported opennebula resource
        #
        def add_cluster(cid, eid) raise MESS end

		#
		# Remove the imported resource from the default cluster
		#
		# @param id [Int] id of the imported resource
		#
        def remove_default(id)    raise MESS end

		#
		# Retrieves information about the run-time state of a virtual machine.
		#
		# @param selected [Hash] Hash with the info of the vCenter object that will
        # be imported
		#
		# @return [Hash{:id => [], :name => String}] operation results.
		#
        def import(selected)      raise MESS end

        public

        #######################################################################
        # Constructors
        #######################################################################
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
		# @return [VCImporter] the vCenter importer that will handle any operation
		#
        def self.new_child(one_client, vi_client, type)
            case type.downcase
            when "datastores"
                VCenterDriver::DsImporter.new(one_client, vi_client)
            when "templates"
                VCenterDriver::VmImporter.new(one_client, vi_client)
            when "networks"
                VCenterDriver::NetImporter.new(one_client, vi_client)
            when "images"
                VCenterDriver::ImageImporter.new(one_client, vi_client)
            else
                raise "unknown object type"
            end
        end

		#
		# @return [String] the object type of the importer
		#
        def one_str
            return @one_class.to_s.split('::').last if @one_class

            "OpenNebula object"
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

        #
        # Importer return value
        #
        # @ return [Hash{:sucess =>[[]] , :error => {}}
        #
        def output
            { success: @info[:success], error: @info[:error] }
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
            raise "the list is empty" if list_empty?

            list = @list.values[0]
            indexes = ''
            keys = list.keys

            return keys.join(',') unless args

            if (args.include?('..'))
                range = Range.new(*args.split("..").map(&:to_i))

                if range.first != range.last
                    for i in range
                        indexes << "#{keys[i]}, "
                    end

                    return indexes
                end
            end

            if args !~ /\D/
                ind = args.to_i

                return keys[ind]
            end

            return args
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

            return list
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
        # {"vm-343" => {linked: '0', copy: '0'...}
        #
        # @ return [Hash] the list of unimported resources
        #
        def process_import(indexes, opts = {}, &block)
            raise "the list is empty" if list_empty?
            indexes = indexes.gsub(/\s*\,\s*/,',').strip.split(",")

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
                rescue Exception => e
                    @info[:error] << {index => e.message}
                    @info[index][:e] =  e

                    apply_rollback
                end
            end
        end


        protected


		#
		# Create and allocate a Opennebula Object.
		#
		# @param info [String] Info passed to opennebula Core.
		#
		# @return [&block] the allocated object through a block.
		#
        def create(info, &block)
            resource = VCenterDriver::VIHelper.new_one_item(@one_class)
            message = "Error creating the OpenNebula resource"

            rc = resource.allocate(info)
            VCenterDriver::VIHelper.check_error(rc, message)

            resource.info
            id = resource['ID']
            @rollback << Raction.new(resource, :delete)
            rc = block.call(resource, id)
        end

		#
		# Asks if @łist is empty
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
            raise "the list is empty" if list_empty? || list.values[0].empty?

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
        def add_clusters(one_id, clusters, &block)
            clusters.each do |cid|
                next if cid < 0

                @info[:clusters][cid] ||= VCenterDriver::VIHelper.one_item(OpenNebula::Cluster, cid.to_s, false)
                rc =  add_cluster(cid, one_id.to_i)
                VCenterDriver::VIHelper.check_error(rc, "add element to cluster")
            end
            remove_default(one_id)
        end

		#
		# Call this function to use the rollback Stack, and delete every
        # corrupted object created by the importer.
		#
        def apply_rollback
            if !@rollback.empty?
                @rollback.each do |action|
                    action.apply
                end
            end
        end

		#
        # Default opts
        #
        def defaults
            return @defaults if @defaults

            {}
        end

    end

end

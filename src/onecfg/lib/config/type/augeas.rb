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

require 'augeas'

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::Config::Type

    # Augeas class
    class Augeas < Base

        # @lens      Augeas lens file
        # @load_path Augeas custom load path
        attr_accessor :lens, :load_path

        # Class constructor
        #
        # @param name      [String] File name
        # @param lens      [String] Augeas lens file
        # @param load_path [String] Augeas custom load path
        def initialize(name, lens, load_path = nil)
            @lens      = lens
            @work_file = nil
            @load_path = load_path

            super(name)
        end

        # TODO: destructor to delete @work_file

        # Load file content
        #
        # @param name [String] Custom file name
        #
        # @return [Object] Read content
        def load(name = @name)
            reset

            # clone file to own place
            @work_file = Tempfile.new('onescape-')
            @work_file.close
            FileUtils.cp(name, @work_file.path)

            work_file_dir  = File.dirname(@work_file.path)
            work_file_name = File.basename(@work_file.path)

            # TODO: Consider :no_stdinc (but if :loadpath)
            aug = ::Augeas.create(:no_modl_autoload => true,
                                  :no_load          => true,
                                  :root             => work_file_dir,
                                  :loadpath         => @load_path)

            begin
                # Temporarily suppress Ruby warnings due to
                # augeas.rb:378: warning: constant ::Fixnum is deprecated
                verb = $VERBOSE
                $VERBOSE = nil

                aug.clear_transforms
                aug.transform(:lens => @lens, :incl => work_file_name)
                aug.context = "/files/#{work_file_name}"
                aug.load
            ensure
                $VERBOSE = verb
            end

            # validate there was no Augeas error
            if aug.exists("/augeas#{aug.context}/error")
                raise OneCfg::Exception::FileReadError,
                      'Failed to parse file'
            end

            # validate we parsed file, even empty
            # file should have a node in a tree
            begin
                aug.match(aug.context)
            rescue ::Augeas::NoMatchError
                raise OneCfg::Exception::FileReadError,
                      'Failed to parse file'
            end

            @content = aug

            @content
        end

        # Save content into a file
        #
        # @param name [String] Custom file name
        def save(name = @name)
            raise OneCfg::Config::Exception::NoContent if @content.nil?

            # unless @content.class == ::Augeas
            #     raise Exception, 'Invalid content'
            # end

            # NOTE, it will save only if there are pending changes
            @content.save # TODO: save!

            FileUtils.cp(@work_file.path, name)
        end

        # Diff between 2 configuration classes.
        #
        # Method is not implemented for generic Augeas class, specific
        # configuration type class (e.g., Augeas::ONE or Augeas::Shell)
        # must be used !!!
        #
        # @param cfg[OneCfg::Config::Base] Configuration to diff with
        def diff(_cfg)
            method_not_implemented(__method__)
        end

        # Get list of keys (node names) from Augeas tree
        #
        # @param nested [Boolean] Indicates if there are sub levels
        #   e.g: A = [B = "C"]
        #
        # @return [Array] List of keys
        def get_keys(nested)
            # IMPORTANT: we depend on this order where values inside
            # the sections are at the end of returned list, so that we can
            # reverse order when upper casing the node names in oned.conf.
            #
            # E.g.:
            #   LOG
            #   MONITORING_INTERVAL
            #   MARKET_MAD_CONF[3]
            #   AUTH_MAD_CONF[1]
            #   AUTH_MAD_CONF[2]
            #   AUTH_MAD
            #   SESSION_EXPIRATION_TIME
            #   VM_USE_OPERATIONS
            #   ...
            #   ... << after all top level nodes, continues nested nodes >>
            #   ...
            #   AUTH_MAD_CONF[2]/NAME
            #   AUTH_MAD_CONF[2]/PASSWORD_CHANGE
            #   AUTH_MAD_CONF[2]/DRIVER_MANAGED_GROUPS
            #   AUTH_MAD_CONF[2]/MAX_TOKEN_TIME
            ret = @content.match('*')
            ret += @content.match('*/*') if nested

            context = "#{@content.context}/"

            ret.map! {|v| v.sub(context, '') }
            ret.reject! {|v| v.include?('#comment') }

            ret
        end

        # Get list of all values for the path
        def get_values(path)
            ret = []

            content.match(path).each do |key|
                ret << content.get(key)
            end

            ret
        end

        # Get complete content tree from Augeas as Hash. Tree doesn't
        # contain metadata for comments and shell exports.
        #
        # TBD
        #
        # @return [Hash] Hash with Augeas content
        # rubocop:disable Naming/AccessorMethodName
        def get_tree
            ret = {}

            keys = get_keys

            keys.each do |key|
                path1, path2 = key.split('/', 2)

                # get and strip indexes from each path component
                name1 = strip_index(path1)
                name2 = strip_index(path2)

                idx1 = get_index(path1)
                idx2 = get_index(path2)

                val = content.get(key)
                # val_addr = [val, key] # addresable value
                val_addr = val

                # Cases
                #
                # a) unique sections
                # LOG = nil
                # LOG/SYSTEM = file
                # LOG/DEBUG_LEVEL = 3
                #
                # b) unique entries
                # MONITORING_THREADS = 50
                #
                # c) multiple entries
                # MONITORING_INTERVAL[1] = 60
                # MONITORING_INTERVAL[2] = 61
                #
                # d) multiple sections
                # AUTH_MAD_CONF[1] = nil
                # AUTH_MAD_CONF[1]/NAME = core
                # AUTH_MAD_CONF[1]/PASSWORD_CHANGE = YES
                # AUTH_MAD_CONF[1]/DRIVER_MANAGED_GROUPS = NO
                # AUTH_MAD_CONF[1]/MAX_TOKEN_TIME = -1
                #
                # e) multiple sections with multiple entries
                # AUTH_MAD_CONF[1] = nil
                # AUTH_MAD_CONF[1]/NAME = core
                # AUTH_MAD_CONF[1]/PASSWORD_CHANGE = YES
                # AUTH_MAD_CONF[1]/DRIVER_MANAGED_GROUPS = NO
                # AUTH_MAD_CONF[1]/MAX_TOKEN_TIME[1] = -1
                # AUTH_MAD_CONF[1]/MAX_TOKEN_TIME[2] = -1

                # Create main unique and multiple sections
                # Entry without any value opens a section, e.g.:
                #   LOG = nil
                #   AUTH_MAD_CONF[1] = nil
                #   AUTH_MAD_CONF[2] = nil
                if val.nil?
                    if path1 && path2.nil?
                        ret[name1] = {} unless ret.key?(name1)

                        ret[name1][idx1] = {} unless ret[name1].key?(idx1)
                    else
                        raise OneCfg::Config::Exception::StructureError,
                              'Double nested sections unsupported'
                    end

                # Create main unique and multiple entries.
                # Based on existence of index, we create value or array, e.g.:
                #   MONITORING_THREADS = 50
                #   MONITORING_INTERVAL[1] = 60
                #   MONITORING_INTERVAL[2] = 61
                elsif path1 && path2.nil?
                    if idx1
                        ret[name1] = [] unless ret.key?(name1)
                        ret[name1] << val_addr
                    else
                        ret[name1] = [val_addr]
                    end

                # Create nested unique and multiple entries.
                # First we detect a base section structure (e.g., LOG or
                # AUTH_MAD_CONF[1]), then we create entires as value or
                # array as in top main. E.g.:
                #   AUTH_MAD_CONF[1]/DRIVER_MANAGED_GROUPS = NO
                #   AUTH_MAD_CONF[1]/MAX_TOKEN_TIME[1] = -1
                #   AUTH_MAD_CONF[1]/MAX_TOKEN_TIME[2] = -1
                else
                    base = ret[name1][idx1]

                    if idx2
                        base[name2] = [] unless base.key?(name2)
                        base[name2] << val_addr
                    else
                        base[name2] = [val_addr]
                    end
                end
            end

            ret
        end
        # rubocop:enable Naming/AccessorMethodName

        # Get complete key/values tree from Augeas as a hash.
        # Tree doesn't contain metadata about comments or
        # shell exports.
        #
        # @return [Hash] Hash with path keys and values
        def old_get_tree
            ret = {}

            keys = get_keys

            keys.each do |key|
                # Don't create separate keys for sections,
                # e.g. avoid "TM_MAD_CONF[5]" hash keys
                subkey_found  = false
                subkey_prefix = "#{key}/"

                keys.each do |k|
                    if k.start_with?(subkey_prefix)
                        subkey_found = true
                        break
                    end
                end

                ret[key] = content.get(key) unless subkey_found
            end

            ret
        end

        # Unquote string. Removes leading and trailing double quotes (").
        #
        # @param str [String] String
        #
        # @return [String] Unquoted string
        def self.unquote(str)
            return unless str

            str.chomp('"').reverse.chomp('"').reverse
        end

        # Quote string. Adds double quotes around.
        #
        # @param str [String] String
        #
        # @return [String] Quoted string
        def self.quote(str)
            return unless str

            '"' + unquote(str) + '"'
        end

        private

        # Returns index from last component of Augeas path. E.g.,
        # for AUTH_MAD_CONF[1]/MAX_TOKEN_TIME[2] returns string '2'.
        #
        # @param str [String] String
        #
        # @return [String] Path index
        def get_index(str)
            return unless str

            match = str.match(/\[([0-9]+)\]$/)

            return unless match

            match[1]
        end

        # Removes index from last component of Augeas path. E.g.,
        # for AUTH_MAD_CONF[1]/MAX_TOKEN_TIME[2]
        # get AUTH_MAD_CONF[1]/MAX_TOKEN_TIME
        #
        # @param str [String] String
        #
        # @return [String] Path index
        def strip_index(str)
            return unless str

            str.sub(/\[[0-9]+\]$/, '')
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren

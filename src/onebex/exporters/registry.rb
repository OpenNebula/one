# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

module OneBEX

    # OneBEX exporters. Every exporter file in this directory registers its
    # implementation when loaded, e.g.:
    #
    #   OneBEX::Exporters.register('nbd', OneBEX::Exporters::NBD)
    module Exporters

        def self.registry
            @registry ||= Registry.new
        end

        def self.register(name, exporter)
            registry.register(name, exporter)
        end

        # Exporter files that failed to load, file name => error message
        def self.load_errors
            @load_errors ||= {}
        end

        # Loads all the exporters in the given directory. An exporter that fails
        # to load is skipped, so it does not prevent the others from working.
        def self.load_all(dir = __dir__)
            Dir[File.join(dir, '*.rb')].sort.each do |file|
                begin
                    require file
                rescue StandardError, ScriptError => e
                    load_errors[File.basename(file)] = e.message
                end
            end
        end

        # Registry of available OneBEX exporter implementations.
        class Registry

            def initialize
                @exporters = {}
            end

            def register(name, exporter)
                @exporters[name.to_s.downcase] = exporter
            end

            def find(name)
                @exporters[name.to_s.downcase]
            end

            def names
                @exporters.keys
            end

        end

    end

end

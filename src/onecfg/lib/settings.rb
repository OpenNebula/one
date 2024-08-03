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

module OneCfg

    # Settings class
    class Settings

        # @defaults  Default content for new file
        # @mode      Operation modes (:auto_load, :read_only, ...)
        # @name      File name
        # @content   Content data
        attr_reader   :defaults
        attr_reader   :mode
        attr_accessor :name
        attr_accessor :content

        def initialize(name, mode = [:auto_load])
            @name = name
            @content = nil
            @mode = mode
            @defaults ||= {}

            load if @mode.include?(:auto_load)
        end

        # Load settings from file
        def load
            reset

            if ::File.exist?(@name)
                if Psych::VERSION > '4.0'
                    @content = YAML.load_file(@name, :aliases => true)
                else
                    @content = YAML.load_file(@name)
                end
            end
        rescue StandardError => e
            OneCfg::LOG.error("Can't load settings from '#{@name}' " \
                                "due to '#{e.message}'")
            raise
        end

        # Save settings into file
        def save
            if @mode.include?(:read_only)
                raise OneCfg::Exception::FileWriteError,
                      "Settings file #{@name} is read-only!"
            end

            begin
                # TODO: use temporary file and rename
                File.open(@name, 'w') do |f|
                    f.write(@content.to_yaml)
                end
            rescue StandardError => e
                OneCfg::LOG.error("Can't save settings from '#{@name}' " \
                                    "due to '#{e.message}'")
                raise
            end
        end

        # Replace content by defaults
        def reset
            @content = @defaults.dup
        end

    end

end

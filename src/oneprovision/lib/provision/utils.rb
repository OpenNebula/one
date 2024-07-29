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

require 'yaml'
require 'nokogiri'
require 'open3'
require 'tempfile'
require 'highline'
require 'highline/import'
require 'securerandom'

# Cleanup Exception
class OneProvisionCleanupException < RuntimeError
end

# Loop Exception
class OneProvisionLoopException < RuntimeError

    attr_reader :text

    def initialize(text = nil)
        @text = text

        super
    end

end

module OneProvision

    # Utils
    module Utils

        class << self

            # Prints command and options in the debug output
            #
            # @param cmd     [String] Command executed
            # @param options [Hash]   Command optioms
            def print_cmd(cmd, options)
                cmd_options = []

                options.each do |key, value|
                    if value
                        cmd_options << "[#{key}, #{value}]"
                    else
                        cmd_options << key
                    end
                end

                cmd_options = cmd_options.join(' ')

                OneProvisionLogger.debug("Executing command: `#{cmd}`")
                OneProvisionLogger.debug("Command options: #{cmd_options}")
            end

            # Checks if the file can be read
            #
            # @param name [String] Path to file to read
            def try_read_file(name)
                File.read(name).strip
            rescue StandardError
                name
            end

            # Shows and error message and exit with fail code
            #
            # @param text [String]  Error message
            # @param code [Integer] Error code
            def fail(text, code = -1)
                STDERR.puts "ERROR: #{text}"
                exit(code)
            end

            # Checks if the return_code is error
            def exception(return_code)
                error = OpenNebula.is_error?(return_code)

                raise OneProvisionLoopException, return_code.message if error
            end

            # Converts XML template to string
            #
            # @param attributes [Hash]    XML attributes
            # @paran indent     [Bollean] True to format indentation
            #
            # @return           [String]  String with the template information
            def template_like_str(attributes, indent = true)
                if indent
                    ind_enter = "\n"
                    ind_tab = '  '
                else
                    ind_enter = ''
                    ind_tab = ' '
                end

                attributes.collect do |key, value|
                    next unless value

                    str_line = ''

                    if value.class == Array

                        value.each do |value2|
                            str_line << key.to_s.upcase << '=[' << ind_enter

                            if value2 && value2.class == Hash
                                str_line << value2.collect do |key3, value3|
                                    str = ind_tab + key3.to_s.upcase + '='

                                    if value3
                                        str += "\"#{value3}\""
                                    end

                                    str
                                end.compact.join(",\n")
                            end
                            str_line << "\n]\n"
                        end

                    elsif value.class == Hash
                        str_line << key.to_s.upcase << '=[' << ind_enter

                        str_line << value.collect do |key3, value3|
                            str = ind_tab + key3.to_s.upcase + '='

                            if value3
                                str += "\"#{value3}\""
                            end

                            str
                        end.compact.join(",\n")

                        str_line << "\n]\n"

                    else
                        str_line << key.to_s.upcase << '=' << "\"#{value}\""
                    end
                    str_line
                end.compact.join("\n")
            end

        end

    end

end

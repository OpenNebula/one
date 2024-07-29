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

require 'strscan'

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::Common

    # HintingParser class
    class HintingParser

        def initialize(string)
            @scanner = StringScanner.new(string)
        end

        # Parse string passed to constructor as single hinting in a format
        #   <cmd> <path> [<value>]
        # and return hash with :command, :path, :value keys.
        #
        # @param normalize [Bool] Check and process parsed values
        #
        # @return [Hash] Hash with parsed data
        def parse(normalize = true)
            # reset pointer to the begining
            @scanner.pointer = 0

            ret = {
                :command => get_word,
                :path    => get_word,
                :value   => get_until_end
            }

            normalize!(ret) if normalize

            ret
        end

        # Parse string passed to constructor as single hinting in a format
        #   <filename> <cmd> <path> [<value>]
        # and return hash with :filename, :command, :path, :value keys.
        #
        # @param normalize [Bool] Check and process parsed values
        #
        # @return [Hash] Hash with parsed data
        def parse_with_filename(normalize = true)
            # reset pointer to the beginning
            @scanner.pointer = 0

            ret = {
                :filename => get_word,
                :command  => get_word,
                :path     => get_word,
                :value    => get_until_end
            }

            normalize!(ret) if normalize

            ret
        end

        private

        QUOTES_STRING = ['"']

        # Validate and normalize parser data. Works on input data.
        #
        # @param parsed [Hash] parsed data
        #
        # @return [Hash] normalized parsed data
        def normalize!(parsed)
            # command
            parsed[:command].downcase!

            if !['rm', 'ins', 'set'].include?(parsed[:command])
                raise OneCfg::Exception::FileParseError,
                      "Invalid patch action '#{parsed[:command]}'"
            end

            # path
            parsed[:path] = parsed[:path].split('/').reject(&:empty?)

            # value
            unless parsed[:value].nil?
                parsed[:value] = JSON.parse(parsed[:value])
            end

            parsed
        end

        # rubocop:disable Naming/AccessorMethodName
        # TODO, uncovered case:
        #    - When get word it's called for strings like: path/\"kvm  \"/path,
        #      it won't parse the scaped quotes in the middle of the word.
        #      Workaround: use single quotes 'path/path/"kvm  "/path'
        def get_word
            return if @scanner.eos?

            # advance until first char difference from space
            if @scanner.match?(/\s/)
                @scanner.scan_until(/\S/)
                @scanner.pointer -= 1
            end

            if QUOTES_STRING.include? @scanner.peek(1)
                # read until next quote
                match = @scanner.scan(/(?:"(?<val>[^"\\]*(?:\\.[^"\\]*)*"))/)

                # remove last quote and unscape them
                match = match.strip[1..-2].gsub('\"', '"') unless match.nil?
            else
                match = @scanner.scan_until(/\s/)
                if match.nil?
                    match = @scanner.scan_until(/$/)
                end

                match.strip! unless match.nil?
            end

            # Advanced until next word
            @scanner.scan(/\s+/)

            match
        end

        def get_until_end
            return if @scanner.eos?

            match = @scanner.scan_until(/$/)

            if !match.nil?
                # unscape elements
                match = match.strip
            end

            match
        end
        # rubocop:enable Naming/AccessorMethodName

    end

end
# rubocop:enable Style/ClassAndModuleChildren

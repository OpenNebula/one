#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                  #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

# Parses RBD diff files as payload records, OneBEX extents, or metadata only.
class RbdDiffParser

    MAGIC_HEADER_V1 = "rbd diff v1\n".freeze
    MAGIC_HEADER_V2 = "rbd diff v2\n".freeze

    RECORD_MODES = [:payload, :extents, :metadata].freeze

    attr_reader :version, :size, :records

    def initialize(opts = {})
        @record_mode = opts.fetch(:record_mode, :payload)

        unless RECORD_MODES.include?(@record_mode)
            raise "Unsupported RBD diff parser mode: #{@record_mode}"
        end

        @records = []
        @size    = nil
        @version = nil
    end

    def parse(file_path)
        File.open(file_path, 'rb') do |file|
            detect_version(file)

            loop do
                tag_byte = file.read(1)
                break unless tag_byte

                tag = tag_byte.chr
                break if tag == 'e'

                process_record(tag, file)
            end
        end

        self
    end

    private

    def detect_version(file)
        header = file.read(MAGIC_HEADER_V1.bytesize)

        @version =
            case header
            when MAGIC_HEADER_V1
                1
            when MAGIC_HEADER_V2
                2
            else
                raise 'Unknown diff header. Not an rbd diff v1 or v2 file.'
            end
    end

    def process_record(tag, file)
        file.read(8) if @version == 2 && ['f', 't', 's'].include?(tag)

        case tag
        when 'f', 't'
            len = file.read(4).unpack1('L<')
            file.seek(len, IO::SEEK_CUR)
        when 's'
            @size = file.read(8).unpack1('Q<')
        when 'w'
            read_write_record(file)
        when 'z'
            read_zero_record(file)
        else
            raise "Unknown diff tag '#{tag}' at position #{file.pos - 1}."
        end
    end

    def read_write_record(file)
        file.read(8) if @version == 2

        offset = file.read(8).unpack1('Q<')
        length = file.read(8).unpack1('Q<')

        case @record_mode
        when :payload
            data = file.read(length)

            @records << {
                :type   => :write,
                :offset => offset,
                :length => length,
                :data   => data
            }
        when :extents
            file.seek(length, IO::SEEK_CUR)
            add_extent_record(offset, length, false)
        when :metadata
            file.seek(length, IO::SEEK_CUR)
        end
    end

    def read_zero_record(file)
        file.read(8) if @version == 2

        offset = file.read(8).unpack1('Q<')
        length = file.read(8).unpack1('Q<')

        case @record_mode
        when :payload
            @records << {
                :type   => :zero,
                :offset => offset,
                :length => length
            }
        when :extents
            add_extent_record(offset, length, true)
        end
    end

    def add_extent_record(offset, length, zero)
        return if length <= 0

        @records << {
            :start  => offset,
            :length => length,
            :dirty  => true,
            :zero   => zero,
            :hole   => false
        }
    end

end

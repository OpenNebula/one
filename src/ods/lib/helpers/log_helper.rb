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

module OpenNebula

    module DocumentServer

        # Logs Helper functions
        module LogsHelper

            def get_log_level(line)
                case line
                when /\[I\]/
                    { 'level' => 'info', 'text' => line.strip }
                when /\[D\]/
                    { 'level' => 'debug', 'text' => line.strip }
                when /\[E\]/
                    { 'level' => 'error', 'text' => line.strip }
                when /\[W\]/
                    { 'level' => 'warn', 'text' => line.strip }
                else
                    { 'level' => 'debug', 'text' => line.strip }
                end
            end

            # Return logs paginated from a file path
            # This is used for initial page load before polling starts.
            #
            # @param file_path [String] path to the log file
            # @param page [Integer] page number (1-based)
            # @param per_page [Integer] number of lines per page
            # @param all [Boolean] if true, return the entire log history
            #
            # @return [Hash] {
            #   :meta  => {
            #     'mode'        => 'all' | nil,
            #     'total_lines' => <Integer>,
            #     'page'        => <Integer>,
            #     'per_page'    => <Integer>,
            #     'total_pages' => <Integer>
            #   },
            #   :lines => [ { 'level' => <String>, 'text' => <String> }, ... ]
            # }
            def get_logs_page(file_path, page = 1, per_page = 100, all = false)
                File.open(file_path, 'r') do |file|
                    # Read all lines and reverse so newest are first
                    lines       = file.each_line.to_a.reverse
                    total_lines = lines.size
                    total_pages = (total_lines / per_page.to_f).ceil

                    if all
                        meta = {
                            'mode'        => 'all',
                            'total_lines' => total_lines
                        }

                        log_lines = []
                        lines.reverse.each do |line|
                            log_lines << get_log_level(line)
                        end
                    else
                        page   = [page, total_pages].min
                        offset = (page - 1) * per_page

                        meta = {
                            'page'        => page,
                            'per_page'    => per_page,
                            'total_pages' => total_pages,
                            'total_lines' => total_lines
                        }

                        log_lines = []
                        lines[offset, per_page].to_a.reverse.each do |line|
                            log_lines << get_log_level(line)
                        end
                    end

                    { :meta => meta, :lines => log_lines }
                end
            end

        end

    end

end

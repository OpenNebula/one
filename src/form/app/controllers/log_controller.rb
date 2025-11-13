# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

module OneFormServer

    # Log Controller
    module LogController

        # Logs Helper functions
        module LogsHelper

            # Parse one log line into a structured hash.
            #
            # @param line [String] a single line from the log file
            # @return [Hash] { 'level' => <String>, 'text' => <String> }
            def parse_log_line(line)
                case line
                when /\[I\]/
                    { 'level' => 'info',  'text' => line.strip }
                when /\[D\]/
                    { 'level' => 'debug', 'text' => line.strip }
                when /\[E\]/
                    { 'level' => 'error', 'text' => line.strip }
                when /\[W\]/
                    { 'level' => 'warn',  'text' => line.strip }
                else
                    { 'level' => 'debug', 'text' => line.strip }
                end
            end

            # Poll log updates. Reads the log file from a given byte offset (start_pos)
            # and returns all new lines plus the new file position.
            #
            # @param file_path [String] path to the log file
            # @param start_pos [Integer, nil] byte offset to start reading from;
            #   if nil or <0, reading starts from EOF and returns no historical data
            #
            # @return [Hash] {
            #   :pos   => <Integer>,  # new byte offset after reading
            #   :lines => [ { 'level' => <String>, 'text' => <String> }, ... ]
            # }
            def poll_logs(file_path, start_pos)
                lines   = []
                new_pos = start_pos

                File.open(file_path, 'r') do |file|
                    # If no valid position is provided, start from EOF so we do not
                    # dump all history at first poll.
                    start_pos = file.size if start_pos.nil? || start_pos < 0

                    file.seek(start_pos, IO::SEEK_SET)
                    chunk = file.read

                    if chunk
                        new_pos = start_pos + chunk.bytesize

                        chunk.each_line do |line|
                            lines << parse_log_line(line)
                        end
                    end
                end

                {
                    :pos   => new_pos,
                    :lines => lines
                }
            end

            # Return a static snapshot of log lines.
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
                            log_lines << parse_log_line(line)
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
                            log_lines << parse_log_line(line)
                        end
                    end

                    { :meta => meta, :lines => log_lines }
                end
            end

        end

        def self.registered(app)
            app.helpers LogsHelper

            # GET /provisions/:id/logs/poll
            # Polls for new log lines of a specific provision
            #
            # Params:
            #   :id  [String]  - Provision ID
            #   :pos [Integer] - Optional byte offset from which to read new data.
            #                     If not provided, the server will start at EOF
            #
            # Returns:
            #   200 OK - JSON:
            #     {
            #       "pos":   <Integer>,  # new file offset for next poll
            #       "lines": [
            #         {"level":"info","text":"..."},
            #         ...
            #       ]
            #     }
            #   500 Internal Server Error - If OpenNebula returns an error
            app.get '/provisions/:id/logs/poll' do
                provision = OneForm::Provision.new_from_id(@client, params[:id])

                return internal_error(
                    provision.message, one_error_to_http(provision.errno)
                ) if OpenNebula.is_error?(provision)

                log_file  = provision.logfile
                start_pos = params[:pos] ? params[:pos].to_i : nil
                logs      = poll_logs(log_file, start_pos)

                status 200
                body process_response(logs)
            end

            # GET /provisions/:id/logs
            # Retrieves an initial log snapshot for a specific provision
            # (paged or full). This is meant for initial load in the UI
            # before switching to /poll.
            #
            # Params:
            #   :id          [String]  - Provision ID
            #   :page        [Integer] - Optional page number (default: 1)
            #   :per_page    [Integer] - Optional page size  (default: 100)
            #   :all         [String]  - "true" to return the full log history
            #
            # Returns:
            #   200 OK - JSON:
            #     {
            #       "meta":   { ... pagination / totals ... },
            #       "events": [
            #         {"level":"info","text":"..."},
            #         ...
            #       ]
            #     }
            #   500 Internal Server Error - If OpenNebula returns an error
            app.get '/provisions/:id/logs' do
                provision = OneForm::Provision.new_from_id(@client, params[:id])

                return internal_error(
                    provision.message, one_error_to_http(provision.errno)
                ) if OpenNebula.is_error?(provision)

                log_file = provision.logfile

                all_logs = params[:all] == 'true'
                page     = (params[:page] || 1).to_i
                per_page = (params[:per_page] || 100).to_i
                logs     = get_logs_page(log_file, page, per_page, all_logs)

                status 200
                body process_response(logs)
            end
        end

    end

end

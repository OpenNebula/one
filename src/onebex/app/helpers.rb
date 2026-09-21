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

    # Helper methods for OneBEX request handling and transfer lifecycle.
    module Helpers

        # ---------------------------------------------------------------- #
        # Exporters
        # ---------------------------------------------------------------- #

        def exporter_registry
            @exporter_registry ||= begin
                registry = OneBEX::Exporters::Registry.new

                registry.register('nbd', OneBEX::Exporters::NBD)
                registry.register('lvm', OneBEX::Exporters::LVM)

                registry
            end
        end

        # -------------------------------------------------------------------- #
        # Request helpers
        # -------------------------------------------------------------------- #

        def log
            settings.logger
        end

        def bex
            settings.bex
        end

        def json_error(message)
            { :error => message }.to_json
        end

        def json_response(payload)
            payload.to_json
        end

        def request_data
            body = request.body.read
            request.body.rewind

            return params if body.nil? || body.empty?

            JSON.parse(body).merge(params)
        rescue JSON::ParserError => e
            halt 400, json_error("Invalid JSON body: #{e.message}")
        end

        def range_data
            range_header = request.env['HTTP_RANGE']

            unless range_header
                halt 416, json_error('Missing Range header')
            end

            match_data = range_header.match(/\Abytes=(\d+)-(\d+)\z/)

            unless match_data
                log.error "Invalid Range format: #{range_header}"

                halt 400, json_error(
                    'Invalid Range format. Expected: bytes=start-end'
                )
            end

            start_byte = match_data[1].to_i
            end_byte   = match_data[2].to_i

            if end_byte < start_byte
                halt 416, json_error('Invalid Range header')
            end

            {
                :start  => start_byte,
                :finish => end_byte,
                :length => end_byte - start_byte + 1
            }
        end

        # ---------------------------------------------------------------- #
        # Transfer state helpers
        # ---------------------------------------------------------------- #

        def with_transfer(dispose: false, &block)
            transfer_id = params[:transfer_id]

            unless block
                halt 500, json_error('with_transfer requires a block')
            end

            if transfer_id.nil?
                halt 400, json_error('Missing TRANSFER_ID')
            end

            found = false

            result = bex.with_transfer(transfer_id, :dispose => dispose) do |transfer|
                found = true
                block.call(transfer)
            end

            halt 404, json_error('Transfer not found') unless found

            result
        end

        def stop_server
            return unless bex.transfers_empty?

            log.info 'All OneBEX transfers finished, stopping server'

            delay = settings.config[:shutdown_delay] || 1

            # rubocop:disable-next Style/GlobalVars
            Thread.new do
                sleep delay.to_f

                $onebex_puma&.stop
            rescue StandardError => e
                log.error "Error stopping OneBEX Puma launcher: #{e.message}"

                $onebex_exit_code = 1
            end
        end

    end

end

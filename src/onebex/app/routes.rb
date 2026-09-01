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

    # App routes configuration
    module AppRoutes

        def self.registered(app)
            # ----------------------------------------------------------------- #
            # App configuration
            # ----------------------------------------------------------------- #
            app.helpers OneBEX::Helpers

            app.before do
                settings.bex.touch

                content_type :json
            end

            app.after do
                log.debug "Request: #{request.request_method} #{request.path} | " \
                          "status=#{response.status}"
            end

            app.error 500 do
                e = env['sinatra.error']
                error_msg = e&.message || 'Internal server error'

                log_msg = if settings.config&.dig(:log, :level) == 3 && e
                              [error_msg, e.backtrace&.join("\n")].compact.join("\n")
                          else
                              error_msg
                          end

                log.error log_msg

                halt 500, json_error(error_msg.sub(/^ERROR:\s*/, ''))
            end

            # ---------------------------------------------------------------- #
            # Routes
            # ---------------------------------------------------------------- #

            app.get '/' do
                [200, json_response(
                    :NAME    => 'OpenNebula OneBEX Server',
                    :VERSION => '0.1',
                    :ROUTES  => {
                        :STATUS           => 'GET /status',
                        :EXPORTERS        => 'GET /exporters',

                        :EXPORT           => 'POST /export',
                        :EXPORT_FINISH    => 'POST /vms/:VM_ID/finish',
                        :EXPORT_CANCEL    => 'POST /vms/:VM_ID/cancel',

                        :TRANSFER_INFO    => 'GET /transfers/:TRANSFER_ID/info',

                        :IMAGE_OPTIONS    => 'OPTIONS /images/:TRANSFER_ID',
                        :IMAGE_EXTENTS    => 'GET /images/:TRANSFER_ID/extents',
                        :IMAGE_READ       => 'GET /images/:TRANSFER_ID',
                        :IMAGE_WRITE      => 'PUT /images/:TRANSFER_ID',
                        :IMAGE_FLUSH      => 'PATCH /images/:TRANSFER_ID',
                        :IMAGE_FINALIZE   => 'POST /transfer/:TRANSFER_ID/finalize'
                    }
                )]
            end

            app.get '/status' do
                data = request_data

                if data['VM_ID'].nil?
                    halt 400, json_error('Missing VM_ID')
                end

                vm_id = data['VM_ID'].to_i

                transfers = bex.vm_transfers(vm_id)
                success   = bex.vm_success(vm_id)

                [200, json_response(
                    :VM_ID     => vm_id,
                    :STATUS    => transfers.empty? ? 'ready' : 'executing',
                    :SUCCESS   => success,
                    :TRANSFERS => transfers
                )]
            end

            app.get '/exporters' do
                [200, json_response(:EXPORTERS => exporter_registry.names)]
            end

            # ---------------------------------------------------------------- #
            # Initialize export
            # ---------------------------------------------------------------- #

            app.post '/export' do
                data = request_data

                if data['VM_ID'].nil? || data['DS_ID'].nil?
                    halt 400, json_error('Missing VM_ID or DS_ID')
                end

                vm_id = data['VM_ID'].to_i
                ds_id = data['DS_ID'].to_i

                export_dir   = File.join(DS_DIR, ds_id.to_s, vm_id.to_s, 'backup')
                exports_path = File.join(export_dir, 'interactive_exports.json')

                unless File.exist?(exports_path)
                    halt 404, json_error("Export file not found: #{exports_path}")
                end

                exports = JSON.parse(File.read(exports_path))
                disks   = data['DISKS'] || exports.keys

                log.info "Starting exports for VM #{vm_id} with disks #{disks}"

                export_specs = disks.map do |disk_id|
                    disk_id = disk_id.to_i
                    disk    = exports[disk_id.to_s]

                    if disk.nil?
                        halt 404, json_error("Disk #{disk_id} not found")
                    end

                    exporter_name  = disk['exporter'].to_s
                    exporter_class = exporter_registry.find(exporter_name)

                    if exporter_class.nil?
                        halt 400, json_error("Unsupported exporter: #{exporter_name}")
                    end

                    {
                        :disk_id        => disk_id,
                        :disk           => disk,
                        :exporter_name  => exporter_name,
                        :exporter_class => exporter_class
                    }
                end

                transfers = export_specs.map do |spec|
                    disk_id        = spec[:disk_id]
                    disk           = spec[:disk]
                    exporter_name  = spec[:exporter_name]
                    exporter_class = spec[:exporter_class]

                    transfer = {
                        :transfer_id   => "one-#{vm_id}-#{disk_id}-#{SecureRandom.hex(4)}",
                        :vm_id         => vm_id,
                        :ds_id         => ds_id,
                        :disk_id       => disk_id,
                        :exporter_name => exporter_name,
                        :export_dir    => export_dir,
                        :format        => disk['format'],
                        :source        => disk['source'],
                        :map           => disk['map'],
                        :disk          => disk,
                        :status        => 'starting'
                    }

                    transfer[:exporter] = exporter_class.new(
                        :config => bex.conf,
                        :logger => log
                    )

                    rc = transfer[:exporter].start(transfer)

                    transfer[:rc]     = rc
                    transfer[:status] = rc ? 'ready' : 'error'

                    bex.add_transfer(transfer)

                    bex.transfer_response(transfer)
                end

                [200, json_response(
                    :VM_ID     => vm_id,
                    :DS_ID     => ds_id,
                    :TRANSFERS => transfers
                )]
            rescue JSON::ParserError => e
                halt 500, json_error("Invalid interactive_exports.json: #{e.message}")
            end

            # ---------------------------------------------------------------- #
            # Transfer info
            # ---------------------------------------------------------------- #

            app.get '/transfers/:transfer_id/info' do
                with_transfer do |transfer|
                    size = transfer[:exporter].info(transfer)

                    [200, json_response(
                        :TRANSFER_ID => transfer[:transfer_id],
                        :SIZE        => size[:SIZE],
                        :FORMAT      => size[:FORMAT]
                    )]
                end
            end

            # ---------------------------------------------------------------- #
            # Veeam routes
            # ---------------------------------------------------------------- #

            app.options '/images/:transfer_id' do
                response = {
                    :features => [
                        'checksum',
                        'extents',
                        'flush',
                        'zero'
                    ],
                    :max_readers => 1,
                    :max_writers => 1
                }

                [200, json_response(response)]
            end

            app.get '/images/:transfer_id/extents' do
                with_transfer do |transfer|
                    log.info "Getting extents for #{transfer[:transfer_id]}"

                    extents = transfer[:exporter].blocks(transfer)

                    [200, extents.to_json]
                end
            end

            app.get '/images/:transfer_id' do
                range = range_data

                with_transfer do |transfer|
                    data = transfer[:exporter].data(transfer, range)

                    content_length = data.respond_to?(:bytesize) ? data.bytesize : range[:length]
                    content_range  = "bytes #{range[:start]}-#{range[:finish]}/*"

                    log.info "Getting data for #{transfer[:transfer_id]} #{content_range}"

                    content_type 'application/octet-stream'

                    headers(
                        'Content-Disposition' => 'attachment',
                        'Content-Length'      => content_length.to_s,
                        'Content-Range'       => content_range,
                        'Accept-Ranges'       => 'bytes',
                        'Server'              => 'imageio/2.5.0'
                    )

                    [206, data]
                end
            end

            app.put '/images/:transfer_id' do
                halt 501, json_error('Write operation not implemented')
            end

            app.patch '/images/:transfer_id' do
                data = request_data

                unless data['op'] == 'flush'
                    halt 400, json_error('Unsupported operation')
                end

                with_transfer do |transfer|
                    log.info "Flush requested for #{transfer[:transfer_id]}"

                    halt 200
                end
            end

            # ---------------------------------------------------------------- #
            # Transfer cancel
            # ---------------------------------------------------------------- #

            app.post '/vms/:vm_id/cancel' do
                vm_id_param = params[:vm_id].to_s
                message     = request_data['MESSAGE'] || 'Backup cancelled'

                vm_id = if vm_id_param.include?('-')
                            vm_id_param.split('-').last.to_i
                        else
                            vm_id_param.to_i
                        end

                bex.dispose_vm_transfers(vm_id).each_value do |transfer|
                    begin
                        transfer[:exporter].finish(transfer) if transfer[:exporter]
                    rescue StandardError => e
                        log.error 'Error stopping exporter for ' \
                                  "#{transfer[:transfer_id]}: #{e.message}"
                    end

                    transfer[:status]  = 'cancelled'
                    transfer[:success] = false
                    transfer[:message] = message

                    bex.del_transfer(
                        {
                            :vm_id       => transfer[:vm_id],
                            :transfer_id => transfer[:transfer_id]
                        },
                        false
                    )
                end

                stop_server

                [200, json_response(
                    :VM_ID             => vm_id,
                    :STATUS            => 'cancelled',
                    :SUCCESS           => false,
                    :PENDING_TRANSFERS => []
                )]
            end

            # ---------------------------------------------------------------- #
            # Transfer finalize
            # ---------------------------------------------------------------- #

            app.post '/transfer/:transfer_id/finalize' do
                data    = request_data
                success = data.fetch('SUCCESS', true).to_s.downcase == 'true'
                message = data['MESSAGE']
                remove  = nil
                response = nil

                with_transfer(:dispose => true) do |transfer|
                    log.info "Finalizing transfer #{transfer[:transfer_id]}: " \
                             "success=#{success}, message=#{message}"

                    begin
                        transfer[:exporter].finish(transfer)
                    rescue StandardError => e
                        success = false

                        log.error 'Error stopping exporter for ' \
                                  "#{transfer[:transfer_id]}: #{e.message}"
                    end

                    transfer[:status]  = 'finished'
                    transfer[:success] = success
                    transfer[:message] = message

                    remove = {
                        :vm_id       => transfer[:vm_id],
                        :transfer_id => transfer[:transfer_id]
                    }

                    response = {
                        :VM_ID             => transfer[:vm_id],
                        :TRANSFER_ID       => transfer[:transfer_id],
                        :STATUS            => 'finished',
                        :SUCCESS           => success,
                        :PENDING_TRANSFERS => []
                    }
                end

                response[:PENDING_TRANSFERS] = bex.del_transfer(remove, success)

                [200, json_response(response)]
            end

            app.post '/vms/:vm_id/finish' do
                vm_id_param = params[:vm_id].to_s

                vm_id = if vm_id_param.include?('-')
                            vm_id_param.split('-').last.to_i
                        else
                            vm_id_param.to_i
                        end

                transfers = bex.vm_transfers(vm_id)
                success   = bex.vm_success(vm_id)

                unless transfers.empty?
                    halt 409, json_response(
                        :VM_ID             => vm_id,
                        :STATUS            => 'executing',
                        :SUCCESS           => success,
                        :PENDING_TRANSFERS => transfers.map {|transfer| transfer[:TRANSFER_ID] }
                    )
                end

                log.info "No pending transfers for VM #{vm_id}, success=#{success}"

                stop_server

                [200, json_response(
                    :VM_ID             => vm_id,
                    :STATUS            => 'finished',
                    :SUCCESS           => success,
                    :PENDING_TRANSFERS => []
                )]
            end

            ['get', 'head', 'post', 'put', 'delete', 'options', 'patch'].each do |method|
                app.send method, '/*' do
                    halt 404, json_error('Unsupported endpoint')
                end
            end
        end

    end

end

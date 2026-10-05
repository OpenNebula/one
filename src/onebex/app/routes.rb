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
                content_type :json
            end

            app.after do
                log.debug "Request: #{request.request_method} #{request.path} | " \
                          "status=#{response.status}"
            end

            app.error 500 do
                e = env['sinatra.error']
                error_msg = e&.message || 'Internal server error'

                log_msg = if bex.conf.dig(:log, :level) == 3 && e
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

                status = bex.xfrs.vm(vm_id)&.status || {
                    :VM_ID     => vm_id,
                    :STATUS    => 'ready',
                    :SUCCESS   => nil,
                    :TRANSFERS => []
                }

                [200, json_response(status)]
            end

            app.get '/exporters' do
                [200, json_response(:EXPORTERS => exporter_registry.names)]
            end

            # ---------------------------------------------------------------- #
            # Initialize export
            # ---------------------------------------------------------------- #

            app.post '/export' do
                data = request_data

                if data['VM_ID'].nil? || data['DS_ID'].nil? ||
                   data['BACKUP_DIR'].to_s.empty?
                    raise BEXState::ExportError.new(400, 'Missing VM_ID, DS_ID or BACKUP_DIR')
                end

                vm_id = data['VM_ID'].to_i
                ds_id = data['DS_ID'].to_i
                export_dir = data['BACKUP_DIR'].to_s

                vm = bex.xfrs.reserve(vm_id)
                vm.prepare do
                    exports_path = File.join(export_dir, 'interactive_exports.json')

                    unless File.exist?(exports_path)
                        raise BEXState::ExportError.new(404,
                                                        "Export file not found: #{exports_path}")
                    end

                    exports = JSON.parse(File.read(exports_path))
                    disks   = data['DISKS'] || exports.keys

                    log.info "Starting exports for VM #{vm_id} with disks #{disks}"

                    export_specs = disks.map do |disk_id|
                        disk_id = disk_id.to_i
                        disk    = exports[disk_id.to_s]

                        if disk.nil?
                            raise BEXState::ExportError.new(404, "Disk #{disk_id} not found")
                        end

                        exporter_name  = disk['exporter'].to_s
                        exporter_class = exporter_registry.find(exporter_name)

                        if exporter_class.nil?
                            raise BEXState::ExportError.new(
                                400, "Unsupported exporter: #{exporter_name}"
                            )
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

                        {
                            :transfer_id   => "one-#{vm_id}-#{disk_id}-#{SecureRandom.hex(4)}",
                            :disk_id       => disk_id,
                            :exporter_name => exporter_name,
                            :export_dir    => export_dir,
                            :format        => disk['format'],
                            :source        => disk['source'],
                            :map           => disk['map'],
                            :disk          => disk,
                            :exporter      => exporter_class.new(:config => bex.conf,
                                                                 :logger => log)
                        }
                    end

                    vm.start(export_dir, transfers)
                end

                [200, json_response(
                    :VM_ID     => vm_id,
                    :DS_ID     => ds_id,
                    :TRANSFERS => vm.status[:TRANSFERS]
                )]
            rescue BEXState::ExportError => e
                halt e.code, json_error(e.message)
            rescue StandardError => e
                log.error "Error exporting VM #{vm_id}: #{e.message}"
                halt 500, json_error(e.message)
            ensure
                stop_server if vm
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
                data        = request_data
                message     = data['MESSAGE'] || 'Backup cancelled'
                force       = data['FORCE'].nil? || data['FORCE'].to_s.downcase == 'true'

                vm_id = if vm_id_param.include?('-')
                            vm_id_param.split('-').last.to_i
                        else
                            vm_id_param.to_i
                        end

                log.info "Cancelling exports for VM #{vm_id}: #{message}"

                vm = bex.xfrs.cancel(vm_id, :force => force)
                complete_vm(vm)

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

                transfer_id = params[:transfer_id]
                log.info "Finalizing transfer #{transfer_id}: " \
                         "success=#{success}, message=#{message}"

                response = bex.xfrs.for_transfer(transfer_id)&.finalize(transfer_id, success)
                halt 404, json_error('Transfer not found') unless response

                [200, json_response(response)]
            end

            app.post '/vms/:vm_id/finish' do
                vm_id_param = params[:vm_id].to_s

                vm_id = if vm_id_param.include?('-')
                            vm_id_param.split('-').last.to_i
                        else
                            vm_id_param.to_i
                        end

                response = complete_vm(bex.xfrs.vm(vm_id)) || {
                    :VM_ID             => vm_id,
                    :STATUS            => 'finished',
                    :SUCCESS           => nil,
                    :PENDING_TRANSFERS => []
                }

                halt 409, json_response(response) if response[:STATUS] == 'executing'

                log.info "No pending transfers for VM #{vm_id}, success=#{response[:SUCCESS]}"

                [200, json_response(response)]
            end

            ['get', 'head', 'post', 'put', 'delete', 'options', 'patch'].each do |method|
                app.send method, '/*' do
                    halt 404, json_error('Unsupported endpoint')
                end
            end
        end

    end

end

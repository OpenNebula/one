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

require 'yaml'
require 'logger'
require 'json'

module OneBEX

    # Process-wide OneBEX server state and shared dependencies.
    class BEXState

        # Expected export errors, handled by one response path in the routes.
        class ExportError < StandardError

            attr_reader :code

            def initialize(code, message)
                @code = code
                super(message)
            end

        end

        # VM registry. Completed VMs retain their result until the server exits.
        class Transfers

            def initialize(logger)
                @logger   = logger
                @vms      = {}
                @stopping = false
                @mutex    = Mutex.new
            end

            def reserve(vm_id)
                @mutex.synchronize do
                    vm_id = Integer(vm_id)
                    raise ExportError.new(503, 'OneBEX is stopping') if @stopping

                    vm = @vms[vm_id] ||= VMTransfers.new(vm_id, @logger)
                    vm.begin_prepare
                    vm
                end
            end

            # Remember cancellation even before export reserves the VM.
            def cancel(vm_id, force: false)
                vm = @mutex.synchronize do
                    vm_id = Integer(vm_id)
                    @vms[vm_id] ||= VMTransfers.new(vm_id, @logger)
                end

                vm.cancel(:force => force)
                vm
            end

            def vm(vm_id)
                @mutex.synchronize { @vms[Integer(vm_id)] }
            end

            def for_transfer(transfer_id)
                match = transfer_id.to_s.match(/\Aone-(\d+)-/)
                vm(match[1]) if match
            end

            # Admission and shutdown use the same registry lock.
            def stop
                @mutex.synchronize do
                    return false if @stopping || !@vms.values.all?(&:finished?)

                    @stopping = true
                end
            end

        end

        # One VM's export and cleanup. Exporter I/O runs outside the VM lock.
        class VMTransfers

            attr_reader :id

            def initialize(vm_id, logger)
                @id           = vm_id
                @backup_dir   = nil
                @logger       = logger
                @transfers    = {}
                @state        = :new
                @success      = true
                @preparing    = false
                @mutex        = Mutex.new
                @changed      = ConditionVariable.new
            end

            # Called under the registry lock so admission excludes shutdown.
            def begin_prepare
                @mutex.synchronize do
                    if @state == :cancelled
                        raise ExportError.new(409, 'Backup cancelled')
                    end

                    unless [:new, :finished].include?(@state)
                        raise ExportError.new(409, "VM #{@id} already has an export")
                    end

                    @state      = :starting
                    @backup_dir = nil
                    @success    = true
                    @preparing  = true
                end
            end

            # Admission is already complete; only this attempt's errors cancel it.
            def prepare
                failed = true

                begin
                    yield

                    @mutex.synchronize do
                        if @state == :cancelled
                            raise ExportError.new(409, 'Backup cancelled')
                        end

                        @state     = :ready
                        @preparing = false
                        @changed.broadcast
                        failed = false
                    end
                ensure
                    if failed
                        @mutex.synchronize do
                            @state     = :cancelled
                            @success   = false
                            @preparing = false
                            @changed.broadcast
                        end

                        abort_export
                    end
                end

                true
            end

            def start(backup_dir, transfers)
                @mutex.synchronize do
                    raise 'Export preparation has not started' unless @preparing

                    @backup_dir = backup_dir
                    return if @state == :cancelled

                    @transfers = transfers.to_h do |transfer|
                        transfer[:closing]    = false
                        transfer[:active_ops] = 0
                        [transfer[:transfer_id], transfer]
                    end
                end

                @transfers.each_value do |transfer|
                    break if @mutex.synchronize { @state == :cancelled }

                    rc = transfer[:exporter].start(transfer)

                    @mutex.synchronize do
                        transfer[:rc]     = rc
                        transfer[:status] = rc ? 'ready' : 'error'
                    end
                end
            end

            # Register an operation before releasing the lock for exporter I/O.
            def with(transfer_id)
                transfer = @mutex.synchronize do
                    xfr = @transfers[transfer_id]
                    next unless @state == :ready && xfr && !xfr[:closing]

                    xfr[:active_ops] += 1
                    xfr
                end

                return unless transfer

                begin
                    yield transfer
                ensure
                    @mutex.synchronize do
                        transfer[:active_ops] -= 1
                        @changed.broadcast if transfer[:active_ops].zero?
                    end
                end
            end

            def finalize(transfer_id, success)
                transfer = @mutex.synchronize do
                    xfr = @transfers[transfer_id]
                    next unless @state == :ready && xfr && !xfr[:closing]

                    xfr[:closing] = true
                    xfr
                end

                return unless transfer

                success, pending = close_transfer(transfer, success)

                {
                    :VM_ID             => @id,
                    :TRANSFER_ID       => transfer_id,
                    :STATUS            => 'finished',
                    :SUCCESS           => success,
                    :PENDING_TRANSFERS => pending
                }
            end

            def cancel(force: false)
                transfers = @mutex.synchronize do
                    return if @state == :finished

                    @state   = :cancelled
                    @success = false
                    @changed.wait(@mutex) while @preparing unless force

                    @transfers.values.reject {|xfr| xfr[:closing] && !force }.each do |xfr|
                        xfr[:closing] = true
                    end
                end

                transfers.each do |transfer|
                    close_transfer(transfer, false, :force => force)
                end

                # Other finalizers may already own some transfers.
                @mutex.synchronize do
                    @changed.wait(@mutex) until @transfers.empty? unless force
                end
            end

            def status
                @mutex.synchronize do
                    executing = @state == :ready && !@transfers.empty?
                    transfers = executing ? @transfers.values.map {|xfr| to_response(xfr) } : []

                    {
                        :VM_ID     => @id,
                        :STATUS    => executing ? 'executing' : 'ready',
                        :SUCCESS   => @success,
                        :TRANSFERS => transfers
                    }
                end
            end

            # Publish only after preparation and transfer cleanup have completed.
            # The lock prevents cancellation from changing the published result.
            def finish
                @mutex.synchronize do
                    pending = @transfers.keys
                    complete = @state != :new && !@preparing && pending.empty?

                    if complete && @state != :finished
                        publish_result if @backup_dir
                        @state = :finished
                    end

                    {
                        :VM_ID             => @id,
                        :STATUS            => complete ? 'finished' : 'executing',
                        :SUCCESS           => @success,
                        :PENDING_TRANSFERS => pending
                    }
                end
            end

            def finished?
                @mutex.synchronize { @state == :finished }
            end

            private

            # Cleanup errors must not replace the original preparation error.
            def abort_export
                cancel
                finish
            rescue StandardError => e
                @logger.error "Error aborting export for VM #{@id}: #{e.message}"
            end

            def to_response(transfer)
                {
                    :TRANSFER_ID => transfer[:transfer_id],
                    :DISK_ID     => transfer[:disk_id],
                    :EXPORTER    => transfer[:exporter_name],
                    :STATUS      => transfer[:closing] ? 'finalizing' : transfer[:status],
                    :RC          => transfer[:rc]
                }
            end

            # Force may reclaim cleanup from a finalizer already closing the transfer.
            def close_transfer(transfer, success, force: false)
                @mutex.synchronize do
                    loop do
                        if @transfers[transfer[:transfer_id]].nil?
                            return [false, @transfers.keys]
                        end

                        break if force || transfer[:active_ops].zero?

                        @changed.wait(@mutex)
                    end
                end

                begin
                    transfer[:exporter].finish(transfer, :force => force)
                rescue StandardError => e
                    success = false
                    @logger.error "Error stopping exporter for #{transfer[:transfer_id]}: " \
                                  "#{e.message}"
                end

                @mutex.synchronize do
                    if @transfers[transfer[:transfer_id]].nil?
                        return [false, @transfers.keys]
                    end

                    success = false if @state == :cancelled
                    @success &&= success
                    @transfers.delete(transfer[:transfer_id])
                    @changed.broadcast

                    [success, @transfers.keys]
                end
            end

            def publish_result
                path = File.join(@backup_dir, 'interactive-result.json')
                tmp  = "#{path}.tmp-#{Process.pid}-#{Thread.current.object_id}"

                File.write(tmp, JSON.generate(@success == true))
                File.rename(tmp, path)
            ensure
                File.delete(tmp) if tmp && File.exist?(tmp)
            end

        end

        attr_reader :conf, :logger, :xfrs
        attr_accessor :exit_code, :puma

        def initialize(config_file: CONFIGURATION_FILE, log_file: ONEBEX_LOG)
            @conf = YAML.safe_load(
                File.read(config_file),
                :permitted_classes => [Symbol],
                :aliases           => false
            )

            @logger = if @conf.dig(:log, :system) == 'syslog'
                          require 'syslog/logger'
                          Syslog::Logger.new('onebex')
                      else
                          Logger.new(log_file)
                      end

            @conf[:debug_level] = @conf.dig(:log, :level) || @conf[:debug_level] || 2

            @logger.level = case @conf[:debug_level].to_i
                            when 0
                                Logger::ERROR
                            when 1
                                Logger::WARN
                            when 3
                                Logger::DEBUG
                            else
                                Logger::INFO
                            end if @logger.respond_to?(:level=)

            @exit_code = 0
            @puma      = nil
            @xfrs      = Transfers.new(@logger)
        end

    end

end

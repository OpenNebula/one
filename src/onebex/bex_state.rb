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

module OneBEX

    # Process-wide OneBEX server state and shared dependencies.
    class BEXState

        # Transfer state protected by registry and per-transfer mutexes. Callers
        # must use the public methods instead of accessing the backing hashes.
        class Transfers

            # Initializes empty transfer and VM success registries.
            def initialize
                @transfers = {}
                @success = {}
                @dispose = {}
                @mutex = Mutex.new
            end

            # Registers a transfer under its VM id.
            def add(transfer)
                @mutex.synchronize do
                    vm_id = Integer(transfer[:vm_id])

                    transfer[:mutex]   = Mutex.new
                    transfer[:dispose] = false

                    @transfers[vm_id] ||= {}
                    @transfers[vm_id][transfer[:transfer_id]] = transfer

                    @dispose[vm_id]&.delete(transfer[:transfer_id])
                    @dispose.delete(vm_id) if @dispose[vm_id] && @dispose[vm_id].empty?

                    @success[vm_id] = true unless @success.key?(vm_id)
                end
            end

            # Removes a transfer and optionally runs a block while it is locked.
            # The block runs under the registry lock; use it only for cleanup
            # paths where blocking new transfer operations is intentional.
            def del(transfer, success, &block)
                @mutex.synchronize do
                    vm_id  = Integer(transfer[:vm_id])
                    xfr_id = transfer[:transfer_id]

                    @success[vm_id] &&= success

                    return [] unless @transfers[vm_id]

                    xfr = @transfers[vm_id][xfr_id]

                    if xfr
                        xfr[:mutex].lock
                        block.call(xfr) if block
                    end

                    @transfers[vm_id].delete(xfr_id)

                    @dispose[vm_id]&.delete(xfr_id)
                    @dispose.delete(vm_id) if @dispose[vm_id] && @dispose[vm_id].empty?

                    if @transfers[vm_id].empty?
                        @transfers.delete(vm_id)
                        return []
                    end

                    @transfers[vm_id].reject do |id, _xfr|
                        @dispose[vm_id]&.key?(id)
                    end.keys
                ensure
                    xfr[:mutex].unlock if xfr
                end
            end

            # Requests disposal for all transfers and returns them grouped by VM.
            def dispose_all
                @mutex.synchronize do
                    @transfers.each_with_object({}) do |(vm_id, xfrs), pending|
                        xfrs.each do |xfr_id, xfr|
                            next if @dispose[vm_id]&.key?(xfr_id)

                            @dispose[vm_id] ||= {}
                            @dispose[vm_id][xfr_id] = true

                            xfr[:mutex].synchronize { xfr[:dispose] = true }

                            pending[vm_id] ||= {}
                            pending[vm_id][xfr_id] = xfr
                        end
                    end
                end
            end

            # Requests disposal for all active transfers of a VM.
            def dispose_vm(vm_id)
                vm_id = Integer(vm_id)

                @mutex.synchronize do
                    xfrs = @transfers[vm_id]

                    return {} unless xfrs

                    xfrs.each_with_object({}) do |(xfr_id, xfr), pending|
                        next if @dispose[vm_id]&.key?(xfr_id)

                        @dispose[vm_id] ||= {}
                        @dispose[vm_id][xfr_id] = true

                        xfr[:mutex].synchronize { xfr[:dispose] = true }

                        pending[xfr_id] = xfr
                    end
                end
            end

            # Runs a block with exclusive access to a transfer.
            def with(xfr_id, dispose: false, &block)
                transfer = nil
                locked   = false

                @mutex.synchronize do
                    found = @transfers.find {|_current_vm_id, xfrs| xfrs.key?(xfr_id) }

                    if found
                        current_vm_id, xfrs = found
                        transfer = xfrs[xfr_id]

                        if @dispose[current_vm_id]&.key?(xfr_id) || transfer.nil?
                            transfer = nil
                        else
                            if dispose
                                @dispose[current_vm_id] ||= {}
                                @dispose[current_vm_id][xfr_id] = true
                            end

                            transfer[:mutex].lock
                            locked = true

                            if transfer[:dispose]
                                transfer[:mutex].unlock
                                locked = false
                                transfer = nil
                            else
                                transfer[:dispose] = true if dispose
                            end
                        end
                    end
                end

                return unless transfer

                begin
                    block.call(transfer)
                ensure
                    transfer[:mutex].unlock if locked
                end
            end

            # Returns API response data for the transfers of a VM.
            def vm_transfers(vm_id)
                @mutex.synchronize do
                    xfrs = @transfers[Integer(vm_id)]

                    return [] unless xfrs

                    active = xfrs.reject do |id, _xfr|
                        @dispose[Integer(vm_id)]&.key?(id)
                    end

                    active.values.map do |xfr|
                        to_response(xfr)
                    end
                end
            end

            # Returns API response data for one transfer.
            def to_response(transfer)
                {
                    :TRANSFER_ID => transfer[:transfer_id],
                    :DISK_ID     => transfer[:disk_id],
                    :EXPORTER    => transfer[:exporter_name],
                    :STATUS      => transfer[:status],
                    :RC          => transfer[:rc]
                }
            end

            # Returns the accumulated success state for a VM.
            def success?(vm_id)
                @mutex.synchronize { @success[vm_id.to_i] }
            end

            # Returns true when no transfers are registered.
            def empty?
                @mutex.synchronize { @transfers.empty? }
            end

        end

        attr_reader :conf, :logger
        attr_accessor :exit_code, :puma

        # Loads configuration, initializes logging, and creates runtime state.
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

            @last_request_at = Time.now
            @idle_timeout    = (@conf[:idle_timeout] || 300).to_i
            @mutex           = Mutex.new

            @xfrs = Transfers.new
        end

        # Records activity for the server idle timeout.
        def touch
            @mutex.synchronize do
                @last_request_at = Time.now
            end
        end

        # Returns seconds elapsed since the last recorded activity.
        def idle_for(now = Time.now)
            @mutex.synchronize do
                now - @last_request_at
            end
        end

        # Returns the configured idle timeout in seconds.
        def idle_timeout
            @mutex.synchronize do
                @idle_timeout
            end
        end

        # Returns API response data for the transfers of a VM.
        def vm_transfers(vm_id)
            @xfrs.vm_transfers(vm_id)
        end

        # Returns the accumulated success state for a VM.
        def vm_success(vm_id)
            @xfrs.success?(vm_id)
        end

        # Returns true when no transfers are registered.
        def transfers_empty?
            @xfrs.empty?
        end

        # Registers a transfer in the process state.
        def add_transfer(transfer)
            @xfrs.add(transfer)
        end

        # Requests disposal for all transfers and returns them grouped by VM.
        def dispose_transfers
            @xfrs.dispose_all
        end

        # Requests disposal for all active transfers of a VM.
        def dispose_vm_transfers(vm_id)
            @xfrs.dispose_vm(vm_id)
        end

        # Removes a transfer and optionally runs a block while it is locked.
        # The block runs under the registry lock; use it only for cleanup
        # paths where blocking new transfer operations is intentional.
        def del_transfer(transfer, success, &block)
            @xfrs.del(transfer, success, &block)
        end

        # Runs a block with exclusive access to a transfer.
        def with_transfer(xfr_id, dispose: false, &block)
            @xfrs.with(xfr_id, :dispose => dispose, &block)
        end

        # Returns API response data for one transfer.
        def transfer_response(transfer)
            @xfrs.to_response(transfer)
        end

        # Logger access methods
        [:debug, :info, :warn, :error, :fatal, :unknown].each do |level|
            define_method(level) do |msg = nil, &block|
                @logger.public_send(level, msg, &block)
            end
        end

    end

end

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

# Helper functions for OpenNebula API controllers
class Helper

    class InvalidParameter < ArgumentError; end

    # Preserve lookup status through controllers and the HTTP error handler.
    class LookupError < StandardError

        attr_reader :status

        def initialize(status, message)
            @status = status
            super(message)
        end

    end

    def self.check_lookup_error(result, detail)
        return unless OpenNebula.is_error?(result)

        status = case result.errno
                 when OpenNebula::Error::EAUTHENTICATION, OpenNebula::Error::EAUTHORIZATION
                     401
                 when OpenNebula::Error::ENO_EXISTS
                     404
                 else
                     500
                 end
        LOGGER.error("#{detail}: #{result.message}")
        raise LookupError.new(status, detail)
    end

    # A read-only inventory snapshot. Create one per controller request; never
    # retain it on the authenticated client or use it for mutation/polling paths.
    class Inventory

        attr_reader :client

        def self.wrap(client)
            client.is_a?(self) ? client : new(client)
        end

        def initialize(client)
            @client = client
            @pools = {}
            @indexes = {}
            @vms = {}
            @hashes = {}.compare_by_identity
            @guest_interfaces = {}.compare_by_identity
        end

        def pool(type, id = nil)
            unless @pools.key?(type)
                result = yield
                @pools[type] = result&.to_a
                @indexes[type] = {}
                @pools[type]&.each {|item| @indexes[type][item.id.to_i] = item }
            end

            id.nil? ? @pools[type] : @indexes[type][id.to_i]
        end

        def vm(id, full: false)
            return @vms[id] if @vms.key?(id)

            if !full && @pools.key?(:vms) && @pools[:vms]
                result = @indexes[:vms][id]
                unless result && result['STATE'].to_i != 6
                    raise VmController::LookupError.new(404, "VM #{id} not found")
                end

                return result
            end

            @vms[id] = yield unless @vms.key?(id)
            @vms[id]
        end

        def resource_hash(resource)
            @hashes[resource] ||= resource.to_hash
        end

        def guest_interfaces(vm)
            @guest_interfaces[vm] ||= yield
        end

    end

    def self.resource_hash(client, resource)
        client.is_a?(Inventory) ? client.resource_hash(resource) : resource.to_hash
    end

    # oVirt list requests use max=N and search="... page P" (pages start at 1).
    class Pagination

        class InvalidParameter < ArgumentError; end

        attr_reader :search

        def initialize(max: nil, search: nil)
            @max = positive_integer(max, 'max') unless max.nil?
            @page = 1
            @search = search

            # Keep quoted search values intact so a name containing "page 2"
            # isn't mistaken for a pagination clause.
            tokens = search.to_s.scan(/(?:[^\s"']+|"[^"]*"|'[^']*')+/)
            if tokens.length >= 2 && tokens[-2].casecmp('page').zero?
                @page = positive_integer(tokens.last, 'page')
                @search = search.sub(/(?:\A|\s)page\s+\S+\s*\z/i, '').strip
            elsif tokens.last.to_s.casecmp('page').zero?
                raise InvalidParameter, 'page must be a positive integer'
            end
        end

        def apply(collection)
            items = collection.to_a
            return items unless @max

            offset = (@page - 1) * @max
            return [] if offset >= items.length

            # Bound the slice length even when max exceeds Ruby's index range.
            items.slice(offset, [@max, items.length - offset].min)
        end

        private

        def positive_integer(value, name)
            unless value.to_s.match?(/\A\d+\z/) && value.to_i.positive?
                raise InvalidParameter, "#{name} must be a positive integer"
            end

            value.to_i
        end

    end

    def self.remove_follow_start(input)
        parts = input.split('.')
        return '' if parts.length == 1

        parts[1..-1].join('.')
    end

    def self.int_to_uuid(int)
        # Handle cases where the function receives already a UUID
        if !int.to_s.include?('-')
            hex = int.to_s.rjust(32, '0')
            uuid = hex.insert(8, '-').insert(13, '-').insert(18, '-').insert(23, '-')
            return uuid
        end
        return int
    end

    def self.uuid_to_int(uuid)
        # int_to_uuid embeds a decimal OpenNebula ID, not a hexadecimal UUID.
        # Keep plain numeric IDs supported, but never truncate malformed input.
        value = uuid.to_s
        unless value.match?(/\A(?:[0-9]+|[0-9]{8}-[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{12})\z/)
            raise LookupError.new(404, "Resource #{value} not found")
        end

        id = value.delete('-').to_i
        # OpenNebula's XML-RPC methods take signed 32-bit integer IDs.
        raise LookupError.new(404, "Resource #{value} not found") if id > 2147483647

        return id
    end

    def self.fault_response(detail, exception = nil)
        enriched_detail = if exception
                              "#{detail} (#{exception.class}: #{exception.message})"
                          else
                              detail
                          end

        {
            :fault => {
                :reason => 'Operation Failed',
                :detail => enriched_detail
            }
        }
    end

    def self.parse_boolean_parameter(value, name, default: false)
        return default if value.nil?

        if value.is_a?(String)
            return true if value.casecmp('true').zero?
            return false if value.casecmp('false').zero?
        end

        raise InvalidParameter, "Invalid #{name}: expected true or false"
    end

    def self.lvm_thin_enabled?(tm_mad, value)
        tm_mad.to_s.downcase.include?('lvm') && value.to_s.downcase == 'yes'
    end

end

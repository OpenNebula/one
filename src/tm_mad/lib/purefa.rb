#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2019-2025, OpenNebula Systems S.L.                               #
#                                                                            #
# Licensed under the OpenNebula Software License                             #
# (the "License"); you may not use this file except in compliance with       #
# the License. You may obtain a copy of the License as part of the software  #
# distribution.                                                              #
#                                                                            #
# See https://github.com/OpenNebula/one/blob/master/LICENSE.onsla            #
# (or copy bundled with OpenNebula in /usr/share/doc/one/).                  #
#                                                                            #
# Unless agreed to in writing, software distributed under the License is     #
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY   #
# KIND, either express or implied. See the License for the specific language #
# governing permissions and  limitations under the License.                  #
# -------------------------------------------------------------------------- #

require 'uri'
require 'json'
require 'digest'
require 'openssl'
require 'net/http'

require_relative 'iscsi'

module TransferManager

    # Class for managing Pure Storage FlashArray resources
    class PureFA

        DEFAULT_API_VERSION = '2.9'

        attr_reader :api, :host, :api_token, :action, :target

        def initialize(opts = {})
            @host        = opts.fetch(:host)
            @target      = opts.fetch(:target) # iSCSI target
            @action      = opts.fetch(:action) # TransferManager::Action object
            @api_token   = opts.fetch(:api_token)
            @api_version = opts.fetch(:api_version, DEFAULT_API_VERSION)
            @api_version = DEFAULT_API_VERSION if @api_version.empty?

            @api = API.new(self)
        end

        def is_uuid?(str)
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.match?(str)
        end

        def base_url
            "https://#{@host}/api/#{@api_version}"
        end

        def monitor
            @api.get('/arrays/space')
        end

        def create_volume(name:, size:)
            parameters = { 'names' => name, 'with_default_protection' => false }
            data       = { 'provisioned' => Utilities.new.parse_size(size) }
            Volume.new(@api.post('/volumes', parameters, data), self)
        end

        # Get a volume by either ID or Name
        def get_volume(ident = nil, name: nil, id: nil)
            ident && (is_uuid?(ident) ? id = ident : name = ident)

            raise ArgumentError, 'Either name or id must be provided' if name.nil? && id.nil?
            raise ArgumentError, 'Only one of name or id can be provided' if name && id

            params = name ? { 'names' => name } : { 'ids' => id }
            Volume.new(@api.get('/volumes', params), self)
        end

        # Manages Pure Storage FlashArray REST API
        class API

            attr_reader :host, :api_token, :x_auth_token

            def initialize(purefa)
                @host         = purefa.host
                @api_token    = purefa.api_token
                @base_url     = purefa.base_url

                @x_auth_token = nil
            end

            def login!
                uri      = URI.parse("#{@base_url}/login")
                request  = Net::HTTP::Post.new(uri)
                request['api-token'] = @api_token
                response = run_http(uri, request)
                @x_auth_token = response['x-auth-token']
                raise "Login to #{@host} failed" if @x_auth_token.nil? || @x_auth_token.empty?

                true
            end

            def get(path, params = nil, unpack: true)
                send_request(Net::HTTP::Get, path, params, nil, :unpack => unpack)
            end

            def post(path, params = nil, body = nil)
                send_request(Net::HTTP::Post, path, params, body)
            end

            def patch(path, params = nil, body = nil)
                send_request(Net::HTTP::Patch, path, params, body)
            end

            def delete(path, params = nil)
                send_request(Net::HTTP::Delete, path, params)
            end

            private

            def build_query_string(parameters)
                return '' if parameters.nil? || parameters.empty?

                '?' + URI.encode_www_form(parameters)
            end

            def send_request(method_class, path, parameters = nil, body = nil, unpack: true)
                login! unless @x_auth_token

                uri     = URI.parse(@base_url + path + build_query_string(parameters))
                request = method_class.new(uri)

                request['Accept']       = 'application/json'
                request['x-auth-token'] = @x_auth_token
                if body
                    request['Content-Type'] = 'application/json'
                    request.body = JSON.generate(body)
                end

                response = run_http(uri, request)
                if response.is_a?(Net::HTTPUnauthorized)
                    login!
                    request['x-auth-token'] = @x_auth_token
                    response = run_http(uri, request)
                end

                unless response.is_a?(Net::HTTPSuccess)
                    raise Net::HTTPError.new(
                        "HTTP Error #{response.code}: #{response.message} ; #{response.body}",
                        response
                    )
                end

                return if response.body.nil? || response.body.empty?

                response = JSON.parse(response.body)
                if unpack && response.key?('items') && response['items'].size == 1
                    response['items'].first
                else
                    response
                end
            end

            def run_http(uri, req)
                http = Net::HTTP.new(uri.host, uri.port)
                http.use_ssl = (uri.scheme == 'https')
                http.verify_mode = OpenSSL::SSL::VERIFY_NONE
                http.request(req)
            end

        end

        # Base Resource class
        class Resource

            include UtilitiesFunctions

            attr_reader :purefa, :name, :id

            def initialize(data, purefa)
                @purefa = purefa
                data = data.to_hash if !data.is_a?(Hash) && data.respond_to?(:to_hash)
                @data = (data || {}).dup
                assign_attributes(@data)
            end

            def [](key)
                @data[key]
            end

            def fetch_data
                raise NotImplementedError, 'fetch_data must be implemented in subclasses'
            end

            def to_hash
                @data.dup
            end

            private

            def assign_attributes(d)
                h = if d.is_a?(Hash)
                        d
                    elsif d.respond_to?(:to_hash)
                        d.to_hash
                    else
                        raise ArgumentError, "Invalid data format: #{d.class}, #{d.inspect}"
                    end

                @id   = h.fetch('id',   nil)
                @name = h.fetch('name', nil)
                @data.merge!(h)
            end

        end

        # Manages Pure Storage FlashArray Volumes
        class Volume < Resource

            SNAP_NAMEF = 'one-snap-%s'
            BACK_NAMEF = 'one-back-%s'
            HOSTNAMEF  = 'one-host-%s'

            attr_reader :purefa

            # Module for iscsiadm command error codes
            module Iscsiadm

                class Error < StandardError; end

                class SessionExists < Error; end
                class LoginAuthFailed < Error; end

                ERROR_DICTIONARY = {
                    15 => SessionExists,
                    24 => LoginAuthFailed
                }

            end

            # def initialize(data, purefa)
            #     super(data, purefa)
            # end

            def size
                @data['provisioned']
            end

            def update(data, parameters = nil)
                parameters ||= {}
                parameters['names'] = @name
                @purefa.api.patch('/volumes', parameters, data)
            end

            def rename(new_name)
                renamed = update({ 'name' => new_name })
                assign_attributes(renamed)
                @name = new_name
                true
            end

            def resize(new_size)
                resized = update({ 'provisioned' => parse_size(new_size) })
                assign_attributes(resized)
                true
            end

            def destroy
                destroyed = update({ 'destroyed' => true })
                assign_attributes(destroyed)
                true
            end

            def delete
                @purefa.api.delete('/volumes', { 'names' => @name })
                true
            rescue Net::HTTPError => e
                return if [400, 404].include?(e.response.code.to_i)

                raise e
            end

            def clone(name)
                parameters = { 'names' => name, 'with_default_protection' => false }
                data       = { 'source' => { 'name' => @name } }
                clone_data = @purefa.api.post('/volumes', parameters, data)
                Volume.new(clone_data, @purefa)
            end

            def create_snapshot(snap_id)
                data       = { 'suffix' => format(SNAP_NAMEF, snap_id) }
                parameters = { 'source_names' => name }
                snap_data  = @purefa.api.post('/volume-snapshots', parameters, data)
                Snapshot.new(snap_data, @purefa, self)
            end

            def list_snapshots
                params = { 'source_names' => name }
                snaps  = @purefa.api.get('/volume-snapshots', params, :unpack => false)
                snaps['items'].map {|data| Snapshot.new(data, @purefa, self) }
            end

            def get_snapshot(snap_id)
                params = { 'names' => "#{name}.#{format(SNAP_NAMEF, snap_id)}" }
                Snapshot.new(@purefa.api.get('/volume-snapshots', params), @purefa, self)
            end

            def create_backsnap(snap_id)
                data       = { 'suffix' => format(BACK_NAMEF, snap_id) }
                parameters = { 'source_names' => name }
                Snapshot.new(@purefa.api.post('/volume-snapshots', parameters, data), @purefa, self)
            end

            def get_backsnap(snap_id)
                params = { 'names' => "#{name}.#{format(BACK_NAMEF, snap_id)}" }
                Snapshot.new(@purefa.api.get('/volume-snapshots', params), @purefa, self)
            end

            def create_connection(hostname)
                pure_hostname = format(HOSTNAMEF, Digest::SHA1.hexdigest(hostname))
                check_host(hostname, pure_hostname)
                parameters = {}
                parameters['volume_names'] = @name
                parameters['host_names'] = pure_hostname
                cxn = @purefa.api.post('/connections', parameters)
                Connection.new(cxn, @purefa)
            rescue Net::HTTPError => e
                message = JSON.parse(e.response.body)['errors'].first['message']
                raise e unless message.start_with?('Connection already exists')

                get_connection(hostname)
            end

            def get_connection(hostname)
                pure_hostname = format(HOSTNAMEF, Digest::SHA1.hexdigest(hostname))
                parameters = {}
                parameters['volume_names'] = @name
                parameters['host_names'] = pure_hostname
                cxn = @purefa.api.get('/connections', parameters)
                return false if cxn.empty?

                Connection.new(cxn, @purefa)
            end

            def mkfs_command(device_path, img_fs, fs_opts = '')
                mkfs_command = 'sudo mkfs'

                if img_fs == 'xfs'
                    mkfs_command += " -t xfs -f #{fs_opts} #{device_path}"
                else
                    mkfs_command += " -F -t #{img_fs} #{fs_opts} #{device_path}"
                end

                if img_fs == 'swap'
                    mkfs_command = "mkswap -L swap #{device_path}"
                end

                mkfs_command
            end

            private

            def login_host(hostname)
                rc = @purefa.action.ssh(
                    :cmds => "sudo iscsiadm -m node -T #{@purefa.target} -l",
                    :host => hostname,
                    :nostderr => false
                )
                raise Iscsiadm::ERROR_DICTIONARY[rc.code] \
                    if Iscsiadm::ERROR_DICTIONARY.keys.include?(rc.code)
                raise "Failed to login host #{hostname}: #{rc.stderr}" if rc.code != 0
            end

            def create_host(hostname, pure_hostname)
                rc = @purefa.action.ssh(
                    :cmds => 'sudo cat /etc/iscsi/initiatorname.iscsi',
                    :host => hostname,
                    :err_msg => 'Failed to get initiator name',
                    :nostdout => false
                )
                initiator_name = rc.stdout.strip.split('=').last
                parameters     = { 'names' => pure_hostname }
                data           = { 'iqns' => [initiator_name] }
                begin
                    created_host = @purefa.api.post('/hosts', parameters, data)

                    raise "Failed to create host #{hostname}" \
                        if created_host.key?('items') && created_host['items'].empty?

                    sleep 0.1
                    login_host(hostname)
                rescue Net::HTTPError => e
                    message = JSON.parse(e.response.body)['errors'].first['message']
                    iqn_taken = message.start_with?('The specified IQN is already in use')

                    raise e unless iqn_taken

                    hosts = @purefa.api.get('/hosts')
                    dupe_host = hosts['items'].find {|h| h['iqns'].include?(initiator_name) }
                    delete_host(dupe_host['name'])
                    create_host(hostname, pure_hostname)
                end
            end

            def delete_host(name)
                @purefa.api.delete('/hosts', { 'names' => name })
            end

            def scsi_session_active?(hostname)
                rc = @purefa.action.ssh(
                    :cmds => 'sudo iscsiadm -m session -P3',
                    :host => hostname,
                    :nostdout => false,
                    :nostderr => false,
                    :silent => true
                )
                return rc.stdout.include?(@purefa.target)
            end

            def check_host(hostname, pure_hostname)
                @purefa.api.get('/hosts', { 'names' => pure_hostname })

                return if scsi_session_active?(hostname)

                login_host(hostname)

                raise "Failed to login host #{hostname}" unless scsi_session_active?(hostname)
            rescue Net::HTTPError => e
                message = JSON.parse(e.response.body)['errors'].first['message']
                missing = message.start_with?('Host does not exist')
                raise e unless [400, 404].include?(e.response.code.to_i) && missing

                create_host(hostname, pure_hostname)
            rescue Iscsiadm::SessionExists
            rescue Iscsiadm::LoginAuthFailed
                host = @purefa.api.get('/hosts', { 'names' => pure_hostname })
                raise "Refusing to recreate host #{pure_hostname}, it has IQN(s) #{host['iqns']}" \
                    unless host['iqns'].empty?

                delete_host(pure_hostname)
                create_host(hostname, pure_hostname)
            end

        end

        # Manages Pure Storage FlashArray Volume Snapshots
        class Snapshot < Resource

            attr_reader :purefa, :volume

            def initialize(data, purefa, volume)
                super(data, purefa)

                @volume = volume
            end

            def update(data, parameters = nil)
                parameters ||= {}
                parameters['names'] = @name
                updated = @purefa.api.patch('/volume-snapshots', parameters, data)
                assign_attributes(updated)
                true
            end

            def restore
                # Copy a snapshot back over the volume with overwrite
                parameters = {
                    'names' => @volume.name,
                    'overwrite' => true
                }
                data = {
                    'source' => { 'name' => @name },
                    'provisioned' => @volume.size
                }
                restored = @purefa.api.post('/volumes', parameters, data)
                Volume.new(restored, @purefa)
            end

            def clone(name)
                parameters = { 'names' => name }
                data       = { 'source' => { 'name' => @name } }
                clone_data = @purefa.api.post('/volumes', parameters, data)
                Volume.new(clone_data, @purefa)
            end

            def destroy
                update({ 'destroyed' => true })
                true
            rescue Net::HTTPError => e
                message = JSON.parse(e.response.body)['errors'].first['message']
                raise e unless message.start_with?('Volume snapshot has been destroyed')

                true
            end

            def delete
                @purefa.api.delete('/volume-snapshots', { 'names' => @name })
                true
            end

            def diff(snap_name, block_size = 4096)
                parameters = {
                    'base_name'      => snap_name,
                    'names'          => @name,
                    'block_size'     => block_size,
                    'segment_length' => @volume['space']['total_provisioned']
                }
                @purefa.api.get('/volumes/diff', parameters)['items']
            end

        end

        # Manages Pure Storage FlashArray Connections
        class Connection < Resource

            include Iscsi

            attr_reader :volume, :host

            def initialize(data, purefa)
                super(data, purefa)

                @host     = data['host']['name']
                @volume   = data['volume']['name']
                @lun_id   = data['lun'].to_i
                @provider = purefa

                # have to precreate this for the iSCSI library
                @by_path_devices = []
            end

            def id
                @lun_id
            end

            def delete
                parameters = {
                    'volume_names' => @volume,
                    'host_names' => @host
                }
                @purefa.api.delete('/connections', parameters)
                true
            end

        end

    end

end

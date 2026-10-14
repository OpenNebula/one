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
require 'net/http'
require 'json'

require 'time'

require_relative 'iscsi'

module TransferManager

    # Class for managing NetApp resources
    class NetApp

        attr_reader :auth, :host, :timeout, :action, :target

        GOLDENSNAP_NAME = 'one_goldensnap'

        def initialize(auth, host, target, timeout: 600, action: nil)
            @auth    = auth
            @host    = host
            @target  = target
            @timeout = timeout
            @action  = action

            raise 'Missing required NetApp attribute: auth' unless @auth
            raise 'Missing required NetApp attribute: host' unless @host

            # validate_connection!
        end

        def validate_connection!
            API.get(@auth, "#{base_url}/cluster")
        rescue StandardError => e
            raise "Unable to connect to NetApp cluster: #{e.message}"
        end

        def fetch_data
            return if @flexclone_licensing

            flexclone_licensing = API.get(@auth, "#{base_url}/cluster/licensing/licenses/flexclone")
            return unless flexclone_licensing['state'] == 'compliant'

            @flexclone_licensing = true
        end

        def base_url
            "https://#{@host}/api"
        end

        def get_svm(uuid, aggregates)
            url = "#{base_url}/svm/svms/#{uuid}"
            response = API.get(@auth, url)
            SVM.new(response, self, aggregates)
        end

        # API class for handling NetApp API requests.
        #
        # This class provides a set of methods for interacting with the NetApp API,
        # including handling job requests and parsing responses.
        class API

            # Represents an error response from the NetApp API.
            class Error < StandardError

                attr_reader :message, :code, :body

                # Error codes
                DUPLICATE_VOLUME     = 917526
                VOLUME_BUSY_CREATING = 524409
                SNAPSHOT_EXISTS      = 525059
                VOLUME_OFFLINE       = 1245265

                def initialize(message, response = nil)
                    super(message)
                    return unless response

                    response = JSON.parse(response) if response.is_a?(String)
                    @code = response.dig('error', 'code').to_s
                    @message = response.dig('error', 'message')
                    @body = response
                rescue JSON::ParserError
                    @code = nil
                    @body = response
                    @message = nil
                end

            end

            def self.with_job_handling(netapp, &_block)
                response = yield
                return false, response unless response.is_a?(Hash) && response.key?('job')

                job = Job.new(response['job'], netapp)
                uuid = job.watch_until_complete
                return true, { 'uuid' => uuid }
            end

            def self.get(auth, url, parameters = nil, unpack: true)
                headers = build_headers(auth, 'GET')
                url = URI.parse(url + build_query_string(parameters))
                send_request(Net::HTTP::Get.new(url, headers), :unpack => unpack)
            end

            def self.post(auth, url, parameters = nil, body = nil)
                parameters ||= {}
                parameters.merge!({ 'return_records' => true })
                url          = URI.parse(url + build_query_string(parameters))
                request      = Net::HTTP::Post.new(url, build_headers(auth, 'POST'))
                request.body = body.to_json if body
                send_request(request)
            end

            def self.patch(auth, url, parameters = nil, body = nil)
                url          = URI.parse(url + build_query_string(parameters))
                request      = Net::HTTP::Patch.new(url, build_headers(auth, 'PATCH'))
                request.body = body.to_json if body
                send_request(request)
            end

            def self.delete(auth, url, parameters = nil)
                headers = build_headers(auth, 'DELETE')
                url = URI.parse(url + build_query_string(parameters))
                send_request(Net::HTTP::Delete.new(url, headers))
            end

            def self.build_headers(auth, method)
                {
                    'Authorization' => "Basic #{auth}",
                    'Accept'        => 'application/hal+json',
                    'Content-Type'  => ['POST', 'PATCH'].include?(method) ? 'application/json' : nil
                }.compact
            end

            def self.build_query_string(parameters)
                return '' if parameters.nil? || parameters.empty?

                '?' + URI.encode_www_form(parameters)
            end

            def self.send_request(request, unpack: true)
                http = Net::HTTP.new(request.uri.host, request.uri.port)
                http.use_ssl = true
                http.verify_mode = OpenSSL::SSL::VERIFY_NONE

                response = http.request(request)
                begin
                    check_response(response)
                rescue Net::HTTPError => e
                    OpenNebula::DriverLogger.log_error(
                        "HTTP Error #{e.response.code}: #{e.response.message}"
                    )
                    OpenNebula::DriverLogger.log_error(
                        "Failed Request: #{request.method} #{request.uri}, #{request.body}"
                    )
                    raise e
                end
                if response.body.empty?
                    nil
                else
                    res = JSON.parse(response.body)
                    if res.key?('job')
                        res
                    elsif res.key?('num_records') && unpack
                        if res['num_records'] == 1
                            res['records'].first
                        elsif res['num_records'] == 0
                            nil
                        else
                            res['records']
                        end
                    else
                        res
                    end
                end
            end

            def self.check_response(response)
                if response.key?('error')
                    raise NetApp::API::Error.new(
                        "API Returned #{response['error']['code']}", response
                    )
                end
                return if response.is_a?(Net::HTTPSuccess)

                raise Net::HTTPError.new(
                    "HTTP Error #{response.code}: #{response.message} ; #{response.body}",
                    response
                )
            end

        end

        # Represents a NetApp resource, providing access to its attributes and behavior.
        class Resource

            include UtilitiesFunctions

            attr_reader :netapp, :name, :uuid, :data

            def initialize(data, netapp)
                data = data.to_hash if !data.is_a?(Hash) && data.respond_to?(:to_hash)
                @data = (data || {}).dup
                @netapp = netapp
                @base_url = @netapp.base_url
                assign_attributes(@data)
            end

            def [](key)
                @data[key]
            end

            def fetch_data(fields = [])
                raise NotImplementedError, 'fetch_data must be implemented in subclasses'
            end

            def to_hash
                @data.dup
            end

            private

            def parse_size(size_str)
                match = size_str.match(/\A([\d.]+)([KMGTP])?B?\z/i)
                raise ArgumentError, "Invalid size format: #{size_str}" unless match

                number = match[1].to_f
                unit = match[2] && match[2].upcase
                multiplier = case unit
                             when 'K' then 1024
                             when 'M' then 1024**2
                             when 'G' then 1024**3
                             when 'T' then 1024**4
                             when 'P' then 1024**5
                             else 1
                             end
                (number * multiplier).to_i
            end

            def assign_attributes(data)
                d = if data.is_a?(Hash)
                        data
                    elsif data.respond_to?(:to_hash)
                        data.to_hash
                    else
                        raise ArgumentError, "Invalid data format: #{data.class}, #{data.inspect}"
                    end

                @uuid = d.fetch('uuid', nil)
                @name = d.fetch('name', nil)
                @data.merge!(d)
            end

        end

        # Represents a NetApp Storage Virtual Machine (SVM),
        # providing access to its attributes and behavior.
        class SVM < Resource

            def initialize(data, netapp, aggregates)
                super(data, netapp)
                if aggregates.is_a?(Array)
                    if aggregates[0].is_a?(Hash)
                        @aggregates = aggregates
                    else
                        @aggregates = aggregates.map {|agg| { 'uuid' => agg.to_s.strip } }
                    end
                elsif aggregates.is_a?(String) && aggregates.include?(',')
                    @aggregates = aggregates.split(',').map {|agg| { 'uuid' => agg.strip } }
                else
                    @aggregates = [{ 'uuid' => aggregates.to_s.strip }]
                end
            end

            def fetch_data(parameters = nil)
                url = "#{@base_url}/svm/svms/#{@uuid}"
                response = API.get(@netapp.auth, url, parameters)
                assign_attributes(response)
            end

            def monitor
                fetch_data({ 'fields' => 'storage' })
                @data['storage']
            end

            def list_volumes(parameters = nil)
                url = "#{@base_url}/storage/volumes"
                filter_parameters = { 'svm.uuid' => @uuid }
                response = API.get(@netapp.auth, url, filter_parameters.merge(parameters || {}))
                response ||= {}
                volumes = response.fetch('records', [])
                volumes.map {|data| Volume.new(data, @netapp) }
            end

            def create_volume(data, parameters = nil)
                vol_data = build_volume_payload(data)
                job, response = create_or_replace(vol_data, parameters)
                build_volume_from(job, response)
            end

            def clone_volume(data, parameters = nil)
                vol_data = build_clone_payload(data)
                job, response = create_or_replace(vol_data, parameters)
                build_volume_from(job, response)
            end

            def get_volume_delete_job(uuid)
                url = "#{@base_url}/cluster/jobs"
                params = { 'description' => "*#{uuid}" }
                response = API.get(@netapp.auth, url, params, :unpack => false)
                job_hash = response['records'].find do |job|
                    job['description'] =~ %r{DELETE \/api\/storage\/volumes\/#{uuid}}
                end
                return unless job_hash

                Job.new(job_hash, @netapp)
            end

            private

            # This function is for when you delete a VM Disk and then re-attach too quickly
            # It's possible it could happen with images as well, but when deleting volumes
            # which are not FlexClone then we don't wait for the job to complete. This will
            # ensure that if we encounter on deleting, we re-create the volume after.
            def create_or_replace(data, parameters = nil)
                url = "#{@base_url}/storage/volumes"

                attempt = lambda do
                    API.with_job_handling(@netapp) do
                        API.post(@netapp.auth, url, parameters, data)
                    end
                end

                # Try to create the volume
                return attempt.call
            rescue API::Error => e
                case e.code.to_i
                when API::Error::DUPLICATE_VOLUME
                    # Volume already exists
                    OpenNebula::DriverLogger.log_error "Volume #{data['name']} exists: #{e.message}"
                    begin
                        existing_volume = Volume.new({ 'name' => data['name'] }, @netapp)
                    rescue Volume::VolumeMissing => _e
                        # Volume was deleted in the meantime
                        return attempt.call
                    end
                    del_job = get_volume_delete_job(existing_volume.uuid)
                    del_job.watch_until_complete if del_job
                    # Try to create the volume again
                    return attempt.call
                when API::Error::VOLUME_BUSY_CREATING
                    # Volume is currently being created
                    OpenNebula::DriverLogger.log_error "Retryable error: #{e.message}"
                    error_job = Job.new(e.body, @netapp)
                    busy_job = Job.new({ 'uuid' => error_job.parse_resource_uuid }, @netapp)
                    begin
                        busy_job.watch_until_complete
                    rescue Net::HTTPError => e
                        # Job finished/deleted while we were checking it
                        raise e unless e.response.code == '404'
                    rescue API::Error => e
                        raise e unless e.code == '4' # entry doesn't exist
                    end
                    begin
                        existing = Volume.new({ 'name' => data['name'] }, @netapp)
                    rescue Volume::VolumeMissing => _e
                        # Volume was deleted in the meantime
                        return attempt.call
                    end

                    return false, existing.to_hash
                else
                    raise e
                end
            end

            def build_volume_payload(data)
                base = {
                    'svm'             => { 'uuid' => @uuid },
                    'aggregates'      => @aggregates,
                    'snapshot_policy' => { 'name' => 'none' },
                    'guarantee'       => { 'type' => 'none' }
                }
                base.merge!(data) if data

                if base['size'] && parse_size(base['size']) < parse_size('20M')
                    base['size'] = '20M'
                end
                base
            end

            def build_clone_payload(data)
                base = {
                    'svm' => { 'uuid' => @uuid }
                }
                if data && data.dig('clone', 'is_flexclone') == false
                    base['snapshot_policy'] = { 'name' => 'none' }
                end
                base.merge!(data) if data.is_a?(Hash)
                base
            end

            def build_volume_from(job, response)
                return response if response.is_a?(Volume)

                if job
                    Volume.new({
                                   'uuid' => response['uuid'],
                                   'svm' => { 'uuid' => @uuid },
                                   'aggregates' => @aggregates
                               }, @netapp)
                else
                    Volume.new(response, @netapp)
                end
            end

        end

        # Represents a NetApp storage volume, providing access to its attributes and behavior.
        class Volume < Resource

            attr_reader :svm

            DEFAULT_GROW_THRESHOLD   = 90
            DEFAULT_GROW_RATIO       = 2
            DEFAULT_SNAPSHOT_RESERVE = 10

            class VolumeMissing < StandardError
            end

            def initialize(data, netapp)
                super(data, netapp)

                fetch_data unless @data.key?('svm')        && @data['svm'] &&
                                  @data.key?('aggregates') && @data['aggregates']
                @svm = SVM.new(@data['svm'], netapp, @data['aggregates'])
            end

            def uuid?
                return !@uuid.nil?
            end

            def fetch_data(parameters = nil)
                if @uuid.nil?
                    raise 'Cannot find volume without UUID or Name.' if @name.nil?

                    response = find_by_name
                    @uuid = response['uuid']
                end

                url = "#{@base_url}/storage/volumes/#{@uuid}"
                response = API.get(@netapp.auth, url, parameters)

                response = response.dup
                response['uuid'] = @uuid
                response['name'] = @name if @name && !response.key?('name')
                assign_attributes(response)
            rescue Net::HTTPError => e
                if e.response.code == '404'
                    raise VolumeMissing, "No volume found with UUID #{@uuid}"
                else
                    raise e
                end
            end

            def find_by_name
                url = "#{@base_url}/storage/volumes"
                response = API.get(@netapp.auth, url, { 'name' => @name })
                if response.is_a?(Array)
                    raise "Multiple volumes found with name #{@name}"
                elsif response.nil?
                    raise VolumeMissing, "No volume found with name #{@name}"
                end

                response
            rescue Net::HTTPError => e
                if e.response.code == '404'
                    raise VolumeMissing, "No volume found with name #{@name}"
                else
                    raise e
                end
            end

            def monitor
                fetch_data({ 'fields' => 'storage' })
                @data['storage']
            end

            def aggregates
                Array(@data['aggregates']).map do |a|
                    a.is_a?(Hash) ? a.dup : { 'uuid' => a.to_s }
                end
            end

            def lun
                return @lun if @lun

                url = "#{@base_url}/storage/luns"
                response = nil
                with_retry do
                    response = API.get(@netapp.auth, url, { 'location.volume.uuid' => @uuid })
                    # should only be 1 LUN per volume, is Hash if there is only 1.
                    # empty arrays should return nil
                    raise "Multiple LUNs found for volume #{@uuid}" if response.is_a?(Array)
                    raise "No LUN found for volume #{@uuid}" if response.empty? || response.nil?
                end

                @lun = LUN.new(response, @netapp, self)
                @lun
            end

            def get_snapshots(parameters = nil)
                url = "#{@base_url}/storage/volumes/#{@uuid}/snapshots"
                response = API.get(@netapp.auth, url, parameters, :unpack => false)
                response['records'].map {|data| Snapshot.new(data, @netapp, self) }
            end

            def update(data, parameters = nil)
                url = "#{@base_url}/storage/volumes/#{@uuid}"
                API.with_job_handling(@netapp) do
                    API.patch(@netapp.auth, url, parameters, data)
                end
                fetch_data
            end

            def resize(new_size, autosize = nil)
                if parse_size(new_size) < parse_size('20M')
                    new_size = '20M'
                end
                post_data = {
                    'size' => new_size,
                    'autosize' => {
                        'grow_threshold' => DEFAULT_GROW_THRESHOLD,
                        'maximum'        => "#{(new_size.to_f * DEFAULT_GROW_RATIO).ceil}MB",
                        'minimum'        => "#{new_size}MB",
                        'mode'           => 'grow_shrink'
                    }
                }
                post_data.merge!(autosize) if autosize
                update(post_data) # Physical size of the volume, in bytes.
            end

            def rename(new_name)
                new_name = new_name.to_s
                update({ 'name' => new_name })
                return if @data['name'] == new_name

                with_retry(:retries => 10, :delay => 6) do
                    fetch_data
                    raise "Volume name not updated to #{new_name}" if @data['name'] != new_name
                end
            end

            def restore_snapshot(uuid: false, name: false)
                raise 'You must specify a snapshot UUID or name' unless uuid || name

                if uuid
                    update({}, { 'restore_to.snapshot.uuid' => uuid })
                elsif name
                    update({}, { 'restore_to.snapshot.name' => name })
                end
            end

            def create_snapshot(data, parameters = nil)
                url = "#{@base_url}/storage/volumes/#{@uuid}/snapshots"
                job, response = API.with_job_handling(@netapp) do
                    API.post(@netapp.auth, url, parameters, data)
                end
                if job
                    Snapshot.new({ 'uuid' => response['uuid'] }, @netapp, self).tap(&:fetch_data)
                else
                    Snapshot.new(response, @netapp, self)
                end
            end

            def create_lun(data, parameters = nil)
                data.merge!('location' => { 'volume' => { 'uuid' => @uuid } })
                data.merge!('svm' => { 'uuid' => @svm.uuid })
                url = "#{@base_url}/storage/luns"
                job, response = API.with_job_handling(@netapp) do
                    API.post(@netapp.auth, url, parameters, data)
                end
                if job
                    LUN.new({ 'uuid' => response['uuid'] }, @netapp, self).tap(&:fetch_data)
                else
                    LUN.new(response, @netapp, self)
                end
            end

            def delete(parameters = nil, wait: false)
                params = { 'force' => true }
                params.merge!(parameters) if parameters
                url = "#{@base_url}/storage/volumes/#{@uuid}"
                if wait
                    API.with_job_handling(@netapp) do
                        API.delete(@netapp.auth, url, params)
                    end
                else
                    API.delete(@netapp.auth, url, params)
                end
            end

            def split_flexclone
                url = "#{@base_url}/storage/volumes/#{@uuid}"
                split_data = { 'clone' => { 'split_initiated' => true } }
                API.with_job_handling(@netapp) do
                    API.patch(@netapp.auth, url, {}, split_data)
                end
            end

            def watch_flexclone_split
                url = "#{@base_url}/storage/volumes/#{@uuid}"
                start_time = Time.now
                until Time.now - start_time > @netapp.timeout
                    response = API.get(@netapp.auth, url)
                    if response.dig('clone', 'split_complete_percent')
                        return true if response['clone']['split_complete_percent'].to_i == 100
                    else
                        return true if response['clone']['is_flexclone'] == false
                    end
                    sleep 2
                end
                return false
            end

        end

        # Represents a snapshot of a NetApp volume
        class Snapshot < Resource

            def initialize(data, netapp, volume = nil)
                super(data, netapp)
                if volume.is_a?(Volume)
                    @volume = volume
                elsif volume.is_a?(String)
                    @volume = Volume.new({
                                             'uuid' => volume,
                                             'svm' => { 'uuid' => volume.svm.uuid },
                                             'aggregates' => volume.aggregates
                                         }, netapp)
                else
                    raise 'Volume object is required for Snapshot Resource'
                end
            end

            def fetch_data(parameters = nil)
                @volume.fetch_data unless @volume.uuid?
                url = "#{@base_url}/storage/volumes/#{@volume.uuid}/snapshots/#{@uuid}"
                response = API.get(@netapp.auth, url, parameters)
                assign_attributes(response)
            end

            def delete(parameters = nil, wait: true)
                @volume.fetch_data unless @volume.uuid?
                url = "#{@base_url}/storage/volumes/#{@volume.uuid}/snapshots/#{@uuid}"
                if wait
                    API.with_job_handling(@netapp) do
                        API.delete(@netapp.auth, url, parameters)
                    end
                else
                    API.delete(@netapp.auth, url, parameters)
                end
            end

            def clones(parameters = nil)
                url = "#{@base_url}/storage/volumes?clone.parent_snapshot.uuid=#{@uuid}"
                response = API.get(@netapp.auth, url, parameters, :unpack => false)

                (response['records'] || []).map do |record|
                    vol_data = { 'uuid' => record['uuid'] }
                    vol_data['svm']        = { 'uuid' => @volume.svm.uuid }
                    vol_data['aggregates'] = @volume.aggregates
                    Volume.new(vol_data, @netapp)
                end
            end

        end

        # Represents a Logical Unit Number (LUN) on a NetApp storage system.
        #
        # This class provides methods for managing LUNs, including creating, deleting,
        # and updating LUNs, as well as retrieving information about LUNs.
        # This class also includes methods for finding LUN devices by serial number.
        class LUN < Resource

            attr_reader :volume

            def initialize(data, netapp, volume)
                super(data, netapp)
                if volume.is_a?(Volume)
                    @volume = volume
                elsif volume.nil?
                    @volume = nil
                else
                    @volume = Volume.new({ 'uuid' => volume }, @netapp)
                end

                @action  = netapp.action
                @lun_map = nil
            end

            def fetch_data(parameters = nil)
                url = "#{@base_url}/storage/luns/#{@uuid}"
                response = API.get(@netapp.auth, url, parameters)
                assign_attributes(response)
            end

            def monitor
                fetch_data({ 'fields' => 'storage' })
            end

            def update(data, parameters = nil)
                url = "#{@base_url}/storage/luns/#{@uuid}"
                API.with_job_handling(@netapp) do
                    API.patch(@netapp.auth, url, parameters, data)
                end
                fetch_data
            end

            def rename(new_name)
                fetch_data({ 'fields' => 'name' })
                new_name = @data['name'].split('/').tap {|a| a[-1] = new_name }.join('/')
                update({ 'name' => new_name })
                with_retry do
                    fetch_data({ 'fields' => 'name' })
                    raise "LUN name not updated to #{new_name}" if @data['name'] != new_name
                end
            end

            def resize(new_size)
                update({ 'space' => { 'size' => new_size } }) # in Bytes
            end

            def move_to_volume(destination_volume)
                update({
                           'movement' => {
                               'paths' => {
                                   'destination' => destination_volume.uuid
                               }
                           }
                       })
            end

            def copy_from_lun(source_lun)
                copy_data = {
                    'copy' => {
                        'source' => { 'uuid' => source_lun.uuid }
                    }
                }
                url = "#{@base_url}/storage/luns/#{@uuid}"
                API.with_job_handling(@netapp) do
                    _ = API.post(@netapp.auth, url, nil, copy_data)
                end
                fetch_data
            end

            def watch_copy(timeout = 600, delay = 3)
                params = {
                    'fields' => ['copy']
                }
                url = "#{@base_url}/storage/luns/#{@uuid}"
                copy_status = API.get(@netapp.auth, url, params)['copy']['source']['progress']
                start_time = Time.now
                until copy_status['percent_complete'] == 100 || Time.now - start_time > timeout
                    if copy_status.key?('failure') && copy_status['failure'].key?('message')
                        raise copy_status['failure']['message']
                    end

                    sleep delay
                    copy_status = API.get(@netapp.auth, url)['copy']['source']['progress']
                end
                if copy_status['percent_complete'] < 100 && Time.now - start_time > timeout
                    raise "Copy of LUN #{@uuid} to volume #{@volume.uuid} timed out"
                end
            end

            def delete(parameters = nil, wait: true)
                url = "#{@base_url}/storage/luns/#{@uuid}"
                if wait
                    API.with_job_handling(@netapp) do
                        API.delete(@netapp.auth, url, parameters)
                    end
                else
                    API.delete(@netapp.auth, url, parameters)
                end
            end

            def delete_with_map(wait: true)
                delete({ 'allow_delete_while_mapped' => true }, :wait => wait)
            end

            def lun_map
                return @lun_map unless @lun_map.nil?

                url = "#{@base_url}/protocols/san/lun-maps"
                response = API.get(@netapp.auth, url, { 'lun.uuid' => @uuid })
                return if response.nil?

                @lun_map = LUNMap.new(response, @netapp, self)
                @lun_map
            end

            alias map lun_map

            def create_lun_map(data, parameters = nil)
                data.merge!({ 'lun' => { 'uuid' => @uuid } })
                data.merge!({ 'svm' => { 'uuid' => @volume.svm.uuid } })
                url = "#{@base_url}/protocols/san/lun-maps"
                API.with_job_handling(@netapp) do
                    API.post(@netapp.auth, url, parameters, data)
                end
                return if lun_map

                attempts = 0
                until !lun_map.nil? || attempts > 10
                    sleep 1
                    attempts += 1
                end

                raise 'Failed to create LUN map' if lun_map.nil?
            end

            def delete_lun_map
                url = "#{@base_url}/protocols/san/lun-maps/#{@uuid}/#{lun_map['igroup']['uuid']}"
                API.with_job_handling(@netapp) do
                    API.delete(@netapp.auth, url, nil)
                end
            rescue API::Error => e
                if e.code.to_i == API::Error::VOLUME_OFFLINE
                    return
                else
                    raise e
                end
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

            def id
                unless @data.key?('lun_maps') && @data['lun_maps'].first.key?('logical_unit_number')
                    fetch_data({ 'fields' => 'lun_maps.logical_unit_number' })
                end
                @data['lun_maps'].first['logical_unit_number']
            end

        end

        # Represents a LUN Map, manage the iSCSI connections
        class LUNMap < Resource

            include Iscsi # all the iSCSI device handling functions

            attr_reader :lun, :igroup

            def initialize(data, netapp, lun)
                super(data, netapp)
                @lun = lun
                @by_path_devices = []

                @provider = netapp

                fetch_data unless data.key?('igroup') && data['igroup']
            end

            def fetch_data(parameters = {})
                url = "#{@base_url}/protocols/san/lun-maps"
                parameters.merge!({ 'lun.uuid' => @lun.uuid })
                response = API.get(@netapp.auth, url, parameters)
                assign_attributes(response)
            end

            def delete
                fetch_data if @data.nil?
                url  = "#{@base_url}/protocols/san/lun-maps/"
                url << "#{@data['lun']['uuid']}/#{@data['igroup']['uuid']}"
                API.with_job_handling(@netapp) do
                    API.delete(@netapp.auth, url, nil)
                end
            end

            def id
                @lun.id
            end

            private

            def assign_attributes(data)
                return if data.nil?

                super(data)
                @igroup = data['igroup']
            end

        end

        # Represents a NetApp job, providing methods to watch its completion and retrieve its status
        class Job < Resource

            # Default job timeout 10 minutes? hmmm
            def watch_until_complete(timeout = nil)
                timeout ||= @netapp.timeout
                start_time = Time.now
                loop do
                    fetch_data
                    case @data['state']
                    # [-state {
                    # Initial|Queued|Running|Waiting|Pausing|Paused|
                    # Quitting|Success|Failure|Reschedule|Error|Quit|
                    # Dead|Unknown|Restart|Dormant}]
                    #
                    # API returns lower case
                    when 'completed', 'success'
                        return parse_resource_uuid
                    when 'failure', 'cancelled', 'error', 'quit', 'dead'
                        raise API::Error.new(
                            "Job #{@uuid} '#{@data['description']}' #{@data['state']}", @data
                        )
                    end
                    break if Time.now - start_time > timeout

                    sleep 1
                end
                raise "Job #{@uuid} '#{@data['description']}' timed out after #{timeout} seconds"
            end

            def fetch_data(_parameters = nil)
                url = "#{@base_url}/cluster/jobs/#{@uuid}"
                response = API.get(@netapp.auth, url)
                assign_attributes(response)
            end

            # Finds the target resource ID from the Job description
            def parse_resource_uuid
                match = @data['description'].scan(/\b\h{8}-\h{4}-\h{4}-\h{4}-\h{12}\b/).last
                raise "Unable to extract UUID from job description: #{@data['description']}" \
                    unless match

                match
            end

        end

    end

end

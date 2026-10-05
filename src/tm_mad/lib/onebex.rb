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

require 'json'
require 'net/http'
require 'shellwords'
require 'uri'
require 'yaml'

module TransferManager

    # OneBEX client used by interactive backups.
    class OneBEX

        # Remote TM scripts run with /var/lib/one-remotes/tm/lib as their installed libdir.
        REMOTE_LIB_DIR = '/var/lib/one-remotes/tm/lib'

        CONFIG_FILE = File.expand_path(
            '../../etc/onebex/onebex-server.conf',
            __dir__
        )

        SERVER = File.expand_path(
            '../../onebex/onebex-server.rb',
            __dir__
        )

        def initialize(vm_id:, ds_id:, backup_dir:, config_file: CONFIG_FILE)
            @vm_id          = vm_id
            @ds_id          = ds_id
            @backup_dir     = backup_dir
            @result_file    = File.join(backup_dir, 'interactive-result.json')

            conf = self.class.load_config(config_file)

            @uri = URI("http://#{conf[:host]}:#{conf[:port]}")
        end

        def self.start(vm_id:, ds_id:, backup_dir:, exports: nil,
                       config_file: CONFIG_FILE)
            new(
                :vm_id          => vm_id,
                :ds_id          => ds_id,
                :backup_dir     => backup_dir,
                :config_file    => config_file
            ).start(exports)
        end

        def self.start_sh(vm_id:, ds_id:, backup_dir:)
            code = <<~RUBY
                Signal.trap('TERM') { exit 0 }
                Signal.trap('INT')  { exit 0 }

                begin
                    TransferManager::OneBEX.start(
                        :vm_id      => ARGV[0],
                        :ds_id      => ARGV[1],
                        :backup_dir => ARGV[2]
                    )
                rescue Errno::EPIPE, IOError
                    exit 0
                end
            RUBY

            [
                'ruby',
                '-I',
                REMOTE_LIB_DIR,
                '-r',
                'onebex',
                '-e',
                code,
                vm_id.to_s,
                ds_id.to_s,
                backup_dir.to_s
            ].shelljoin
        end

        def self.write_exports(exports_path, disk_id, data)
            exports = if File.exist?(exports_path) && !File.empty?(exports_path)
                          JSON.parse(File.read(exports_path))
                      else
                          {}
                      end

            exports[disk_id.to_s] = data

            File.open(exports_path, 'w') do |f|
                f.write(JSON.pretty_generate(exports))
            end
        end

        def self.write_exports_sh(backup_dir, disk_id, data)
            exports_path = "#{backup_dir}/interactive_exports.json"
            code = <<~RUBY
                TransferManager::OneBEX.write_exports(
                    ARGV[0],
                    ARGV[1],
                    JSON.parse(ARGV[2])
                )
            RUBY

            [
                'ruby',
                '-I',
                REMOTE_LIB_DIR,
                '-r',
                'onebex',
                '-e',
                code,
                exports_path,
                disk_id.to_s,
                JSON.generate(data)
            ].shelljoin
        end

        def self.load_config(config_file)
            conf = YAML.load_file(config_file)

            unless conf.is_a?(Hash)
                raise "Invalid OneBEX configuration file #{config_file}"
            end

            missing = [:host, :port].select do |key|
                conf[key].nil? || conf[key].to_s.empty?
            end

            unless missing.empty?
                raise 'Missing required OneBEX configuration key(s) in ' \
                      "#{config_file}: #{missing.join(', ')}"
            end

            conf
        end

        # Starts the OneBEX server, writes the exports, and waits for completion.
        def start(exports = nil)
            File.delete(@result_file) if File.exist?(@result_file)

            write_all_exports(exports) if exports

            2.times do |attempt|
                start_server unless running?
                break if start_export

                raise 'OneBEX is stopping' if attempt == 1

                wait_for_stop
            end

            wait_for_finish
        end

        private

        def write_all_exports(exports)
            File.open("#{@backup_dir}/interactive_exports.json", 'w') do |f|
                f.write(JSON.pretty_generate(exports))
            end
        end

        def get(path)
            uri = @uri + path

            Net::HTTP.start(
                uri.host,
                uri.port,
                :open_timeout => 2,
                :read_timeout => 5
            ) do |http|
                http.get(uri.request_uri)
            end
        end

        def running?
            get('/').code.to_i == 200
        rescue StandardError
            false
        end

        def start_server
            rc = system(
                "nohup ruby #{Shellwords.escape(SERVER)} >/dev/null 2>&1 &"
            )

            raise "Error starting OneBEX server: #{SERVER}" unless rc

            ready?
        end

        def ready?(timeout = 60)
            started_at = Time.now

            until Time.now - started_at > timeout
                return true if running?

                sleep 1
            end

            raise "Timeout waiting for OneBEX server to start for VM #{@vm_id}"
        end

        def start_export
            uri = @uri + '/export'

            req = Net::HTTP::Post.new(uri)

            req['Content-Type'] = 'application/json'
            req.body = JSON.generate(
                :VM_ID => @vm_id,
                :DS_ID => @ds_id,
                :BACKUP_DIR => @backup_dir
            )

            res = Net::HTTP.start(
                uri.host,
                uri.port,
                :open_timeout => 2,
                :read_timeout => 300
            ) {|http| http.request(req) }

            # No export was admitted.
            return false if res.code.to_i == 503

            raise "Error starting OneBEX export: #{res.body}" unless res.code.to_i == 200

            true
        rescue Errno::ECONNREFUSED
            false
        end

        def wait_for_stop(timeout = 60)
            started_at = Time.now

            while running?
                raise 'Timeout waiting for OneBEX server to stop' if Time.now - started_at > timeout

                sleep 1
            end
        end

        def wait_for_finish
            # OneBEX publishes the result only after the VM backup finishes.
            until File.exist?(@result_file)
                unless running?
                    break if File.exist?(@result_file)

                    raise 'Backup failed'
                end

                sleep 1
            end

            raise 'Backup failed' unless JSON.parse(File.read(@result_file)) == true

            true
        rescue StandardError
            raise 'Backup failed'
        end

    end

end

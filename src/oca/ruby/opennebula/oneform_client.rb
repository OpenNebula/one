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

require 'uri'
require 'base64'

require 'opennebula/form/helpers'
require 'opennebula/form/drivers'
require 'opennebula/form/providers'
require 'opennebula/form/provisions'
require 'cloud/CloudClient'

include CloudCLI

module OneForm

    # OneForm API client
    class Client

        DEFAULT_OPTIONS = [
            ENDPOINT = {
                :name => 'server',
                :short => '-s url',
                :large => '--server url',
                :format => String,
                :description => 'OneForm endpoint'
            },
            USERNAME={
                :name => 'username',
                :short => '-u name',
                :large => '--username name',
                :format => String,
                :description => 'User name'
            },
            PASSWORD={
                :name => 'password',
                :short => '-p pass',
                :large => '--password pass',
                :format => String,
                :description => 'User password'
            },
            API_VERSION={
                :name => 'api_version',
                :large => '--api-version version',
                :format => String,
                :description => 'OneForm API Version to use'
            }
        ]

        include OneForm::Drivers
        include OneForm::Providers
        include OneForm::Provisions

        def initialize(opts = {})
            endpoint  = '/.one/oneform_endpoint'
            @username = opts[:username] || ENV['ONEFORM_USER']
            @password = opts[:password] || ENV['ONEFORM_PASSWORD']

            # By default oneform uses JSON as content type
            @content_type = opts[:content_type] || 'application/json'

            # Set API version
            @version = opts[:api_version] || ENV['ONEFORM_VERSION'] || 'v1'

            if opts[:url]
                url = opts[:url]
            elsif ENV['ONEFORM_URL']
                url = ENV['ONEFORM_URL']
            elsif Dir.home && File.exist?(Dir.home + endpoint)
                url = File.read(Dir.home + endpoint).strip
            elsif File.exist?('/var/lib/one/.one/oneform_endpoint')
                url = File.read('/var/lib/one/.one/oneform_endpoint').strip
            else
                url = 'http://localhost:13013'
            end

            url = url.chomp('/') + "/api/#{@version}"

            if @username.nil? && @password.nil?
                if Dir.home && !Dir.home.empty? && ENV['ONE_AUTH'] && File.file?(ENV['ONE_AUTH'])
                    one_auth = File.read(ENV['ONE_AUTH'])
                elsif Dir.home && File.file?(Dir.home + '/.one/one_auth')
                    one_auth = File.read(Dir.home + '/.one/one_auth')
                elsif File.file?('/var/lib/one/.one/one_auth')
                    one_auth = File.read('/var/lib/one/.one/one_auth')
                else
                    raise 'ONE_AUTH file not present'
                end

                one_auth = one_auth.rstrip
                @username, @password = one_auth.split(':')
            end

            @uri = URI.parse(url)

            @user_agent = "OpenNebula #{CloudClient::VERSION} " <<
                "(#{opts[:user_agent]||'Ruby'})"

            @host = nil
            @port = nil

            return unless ENV['http_proxy']

            uri_proxy = URI.parse(ENV['http_proxy'])
            flag = false

            #  Check if we need to bypass the proxy
            if ENV['no_proxy']
                ENV['no_proxy'].split(',').each do |item|
                    item = item.strip

                    if (IPAddress @uri.host rescue nil).nil?
                        if (IPAddress(item) rescue nil).nil?
                            flag |= (item == @uri.host)
                        end
                    else
                        unless (IPAddress item rescue nil).nil?
                            flag |= IPAddress(item).include? IPAddress(@uri.host)
                        end
                    end
                end
            end

            return if flag

            @host = uri_proxy.host
            @port = uri_proxy.port
        end

        private

        def get(path, params = {})
            uri = build_uri(path, params)
            request = Net::HTTP::Proxy(@host, @port)::Get.new(uri, default_headers)
            perform_request(uri, request)
        end

        def post(path, body = {})
            uri = build_uri(path)
            request = Net::HTTP::Proxy(@host, @port)::Post.new(uri, default_headers)
            request.body = body.is_a?(String) ? body : body.to_json
            perform_request(uri, request)
        end

        def put(path, body = {})
            uri = build_uri(path)
            request = Net::HTTP::Proxy(@host, @port)::Put.new(uri, default_headers)
            request.body = body.is_a?(String) ? body : body.to_json
            perform_request(uri, request)
        end

        def patch(path, body = {})
            uri = build_uri(path)
            request = Net::HTTP::Proxy(@host, @port)::Patch.new(uri, default_headers)
            request.body = body.is_a?(String) ? body : body.to_json
            perform_request(uri, request)
        end

        def delete(path, params = {})
            uri = build_uri(path, params)
            request = Net::HTTP::Proxy(@host, @port)::Delete.new(uri, default_headers)
            perform_request(uri, request)
        end

        def poll_logs(path, params = {})
            uri     = build_uri(path, params)
            request = Net::HTTP::Proxy(@host, @port)::Get.new(uri, default_headers)

            raw_body = nil

            Net::HTTP.start(
                uri.host,
                uri.port,
                :use_ssl => (uri.scheme == 'https')
            ) do |http|
                response = http.request(request)

                raise "Request failed: #{response.code} #{response.message}" \
                unless response.is_a?(Net::HTTPSuccess)

                raw_body = response.body
            end

            json =
                begin
                    JSON.parse(raw_body)
                rescue JSON::ParserError => e
                    raise "Invalid JSON response: #{e.message}"
                end

            {
                :pos   => json['pos'],
                :meta  => json['meta'],
                :lines => json['lines'] || []
            }
        end

        def follow_logs(path, params = {})
            pos      = params[:all] ? 0 : nil
            interval = params[:interval] || 1.0

            loop do
                begin
                    response = poll_logs(path, { :pos => pos })

                    response[:lines].each do |entry|
                        level = entry['level'] || 'info'
                        text  = entry['text']  || ''
                        puts "[#{level}] #{text}"
                    end

                    pos = response[:pos] || pos
                    sleep interval
                rescue Interrupt
                    break
                rescue StandardError => e
                    warn "Polling error: #{e.class}: #{e.message}"
                    sleep interval
                end
            end
        end

        def build_uri(path, params = {})
            uri = @uri.dup
            path = path.sub(%r{^/}, '')
            uri.path = [@uri.path, path].join('/').gsub(%r{/{2,}}, '/')
            uri.query = URI.encode_www_form(params) unless params.empty?
            uri
        end

        def default_headers
            auth = Base64.strict_encode64("#{@username}:#{@password}")
            {
                'Authorization' => "Basic #{auth}",
                'Content-Type'  => @content_type,
                'Accept'        => @content_type,
                'User-Agent'    => @user_agent
            }
        end

        def perform_request(uri, request)
            Net::HTTP.start(uri.host, uri.port, :use_ssl => uri.scheme == 'https') do |http|
                response = http.request(request)
                handle_response(response)
            end
        end

        def handle_response(response)
            json = nil

            begin
                body = response.body && !response.body.strip.empty? ? response.body : '{}'
                json = JSON.parse(body, :symbolize_names => true)
            rescue JSON::ParserError
                raise "OneForm Error: #{body.inspect}"
            end

            case response
            when Net::HTTPSuccess
                if json.is_a?(Array)
                    json.map do |item|
                        item.is_a?(Hash) && item.key?(:DOCUMENT) ? item[:DOCUMENT] : item
                    end
                elsif json.is_a?(Hash) && json.key?(:DOCUMENT)
                    json[:DOCUMENT]
                else
                    json
                end
            else
                err_code      = json[:err_code] || 'UNKNOWN'
                error_message = json[:message]  || 'No message provided'
                err_ctx       = json[:context]  || {}

                if err_ctx && !err_ctx.empty?
                    context_str = format_context(err_ctx)

                    msg = <<~MSG
                        OneForm Error (#{err_code}): #{error_message}
                        #{context_str}
                    MSG
                else
                    msg = "OneForm Error (#{err_code}): #{error_message}"
                end

                raise msg
            end
        end

        def format_context(hash, indent = 0, top_level = true)
            prefix = ' ' * indent

            hash.map do |key, value|
                line_prefix = top_level ? "#{prefix}- " : "#{prefix}  "

                if value.is_a?(Hash)
                    nested = format_context(value, indent + 2, false)
                    "#{line_prefix}#{key}:\n#{nested}"
                else
                    "#{line_prefix}#{key}: #{value}"
                end
            end.join("\n")
        end

    end

end

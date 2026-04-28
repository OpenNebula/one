require 'uri'
require 'base64'
require 'json'
require 'net/http'

require 'cloud/CloudClient'

module OpenNebula

    module DocumentServer

        # ODSClient is a generic HTTP client for ODS-style REST APIs.
        # The client provides a reusable abstraction for services that expose
        # versioned APIs authenticated via HTTP Basic Auth and configured through
        # environment variables
        class Client

            DEFAULT_CONTENT_TYPE = 'application/json'
            DEFAULT_API_VERSION  = 'v1'
            DEFAULT_USER_AGENT   = 'Ruby OCA'
            POOLS                = {}

            DEFAULT_OPTIONS = [
                ENDPOINT = {
                    :name => 'server',
                    :short => '-s url',
                    :large => '--server url',
                    :format => String,
                    :description => 'Server endpoint'
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
                    :description => 'Server API Version to use'
                }
            ]

            attr_reader :uri, :username, :version

            def initialize(app_name:, username: nil, password: nil, endpoint: nil, opts: {})
                @app_name = app_name.to_s.upcase

                # Options
                @content_type = opts[:content_type] || DEFAULT_CONTENT_TYPE
                @version      = opts[:version] || ENV["#{@app_name}_VERSION"] || DEFAULT_API_VERSION
                user_agent    = opts[:user_agent] || USER_AGENT || DEFAULT_USER_AGENT

                # Connection details
                @username, @password = resolve_auth(
                    username || ENV["#{@app_name}_USER"],
                    password || ENV["#{@app_name}_PASSWORD"]
                )

                base_url = resolve_endpoint(endpoint)
                url      = base_url.chomp('/') + "/api/#{@version}"
                @uri     = URI.parse(url)

                @user_agent = "OpenNebula #{CloudClient::VERSION} (#{user_agent})"

                @host = nil
                @port = nil

                configure_proxy
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

            def follow_logs(path, params = {})
                interval    = params[:interval] || 3.0
                shown_lines = params[:all] ? 0 : nil
                request_params = params.reject {|key, _| key == :interval }

                unless params[:all]
                    begin
                        response = get(path, request_params)
                        lines    = Array(response[:lines])

                        print_log_entries(lines)
                        meta        = response[:meta]    || {}
                        shown_lines = meta[:total_lines] || lines.size
                    rescue Interrupt
                        return
                    rescue StandardError => e
                        warn "Polling error: #{e.class}: #{e.message}"
                    end
                end

                loop do
                    begin
                        response = get(path, request_params.merge(:all => true))
                        lines    = Array(response[:lines])

                        shown_lines = lines.size if shown_lines.nil?
                        shown_lines = 0 if lines.size < shown_lines

                        new_lines = lines[shown_lines, lines.size] || []
                        print_log_entries(new_lines)

                        shown_lines = lines.size
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
                    raise "#{@app_name} Error: #{body.inspect}"
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
                    err_ctx       = { :details => err_ctx.to_s } unless err_ctx.is_a?(Hash)

                    if err_ctx && !err_ctx.empty?
                        context_str = format_context(err_ctx)

                        msg = <<~MSG
                            #{@app_name} Error (#{err_code}): #{error_message}
                            #{context_str}
                        MSG
                    else
                        msg = "#{@app_name} Error (#{err_code}): #{error_message}"
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

            def print_log_entries(entries)
                entries.each do |entry|
                    level  = entry[:level] || entry['level'] || 'info'
                    text   = entry[:text]  || entry['text']  || ''

                    if $stdout.tty? && level == 'error'
                        puts "\33[31m#{text}\33[0m"
                    elsif $stdout.tty? && level == 'warn'
                        puts "\33[33m#{text}\33[0m"
                    else
                        puts text
                    end
                end
            end

            def configure_proxy
                return unless ENV['http_proxy']

                uri_proxy = URI.parse(ENV['http_proxy'])
                bypass    = false

                if ENV['no_proxy']
                    ENV['no_proxy'].split(',').each do |item|
                        item = item.strip

                        if (IPAddress(@uri.host) rescue nil).nil?
                            if (IPAddress(item) rescue nil).nil?
                                bypass ||= (item == @uri.host)
                            end
                        else
                            unless (IPAddress(item) rescue nil).nil?
                                bypass ||= IPAddress(item).include?(IPAddress(@uri.host))
                            end
                        end
                    end
                end

                return if bypass

                @host = uri_proxy.host
                @port = uri_proxy.port
            end

            def resolve_endpoint(endpoint)
                return endpoint unless blank?(endpoint)

                env_url = ENV["#{@app_name}_URL"]
                return env_url unless blank?(env_url)

                endpoint_file = "/.one/#{@app_name.downcase}_endpoint"

                return File.read(Dir.home + endpoint_file).strip \
                if Dir.home && File.exist?(Dir.home + endpoint_file)

                sys_file = "/var/lib/one/.one/#{@app_name.downcase}_endpoint"
                return File.read(sys_file).strip if File.exist?(sys_file)
                return self.class::DEFAULT_ENDPOINT unless blank?(self.class::DEFAULT_ENDPOINT)

                raise(
                    ArgumentError,
                    "Unable to resolve #{@app_name} endpoint. "\
                    "Provide :endpoint, set #{@app_name}_URL, or define "\
                    'a default endpoint in the client subclass.'
                )
            end

            def resolve_auth(username, password)
                return [username, password] if username && password

                if ENV['ONE_AUTH'] && File.file?(ENV['ONE_AUTH'])
                    auth = File.read(ENV['ONE_AUTH'])
                elsif Dir.home && File.file?(Dir.home + '/.one/one_auth')
                    auth = File.read(Dir.home + '/.one/one_auth')
                elsif File.file?('/var/lib/one/.one/one_auth')
                    auth = File.read('/var/lib/one/.one/one_auth')
                else
                    raise 'ONE_AUTH file not present'
                end

                auth = auth.rstrip
                auth.split(':', 2)
            end

            def blank?(value)
                value.nil? || value.to_s.strip.empty?
            end

        end

    end

end

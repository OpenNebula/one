# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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
require 'curb'
require 'base64'
require 'nokogiri'

# Too hard to get rid of $conf variable
# rubocop:disable Style/GlobalVars

UNSUPPORTED_RUBY = !(RUBY_VERSION =~ /^1.8/).nil?
GITHUB_TAGS_URL = 'https://api.github.com/repos/opennebula/one/tags'
ENTERPRISE_REPO_URL = 'https://downloads.opennebula.io/repo/'

begin
    require 'zendesk_api'
rescue LoadError
    STDERR.puts '[OpenNebula Support] Missing zendesk_api gem'
    ZENDESK_API_GEM = false
else
    ZENDESK_API_GEM = true
end

if RUBY_VERSION < '2.1'
    require 'scrub_rb'
end

def invalid_user_with_id(client)
    client.current_user.nil? || client.current_user.id.nil?
end

helpers do
    def zendesk_client
        client = ZendeskAPI::Client.new do |config|
            # Mandatory:
            config.url = SUPPORT[:zendesk_url]

            # Basic / Token Authentication
            config.username = session['zendesk_email']

            # Choose one of the following depending on your auth choice
            # config.token = 'your zendesk token'
            config.password = session['zendesk_password']

            # OAuth Authentication
            # config.access_token = 'your OAuth access token'

            # Optional:

            # Retry uses middleware to notify the user
            # when hitting the rate limit, sleep automatically,
            # then retry the request.
            config.retry = true

            # Logger prints to STDERR by default, to e.g. print to stdout:
            # require 'logger'
            # config.logger = Logger.new(STDOUT)

            # Changes Faraday adapter
            # config.adapter = :patron

            # When getting the error
            #   'hostname does not match the server certificate'
            # use the API at https://yoursubdomain.zendesk.com/api/v2
        end

        if invalid_user_with_id(client)
            error 401, 'Incorrect Zendesk account credentials'
        end

        client
    end

    def zrequest_to_one(zrequest)
        one_zrequest = {
            'id' => zrequest.id,
            'url' => zrequest.url,
            'subject' => zrequest.subject,
            'description' => zrequest.description,
            'status' => zrequest.status,
            'created_at' => zrequest.created_at,
            'updated_at' => zrequest.updated_at,
            'comments' => []
        }

        zrequest.custom_fields.each do |field|
            case field.id
            when SUPPORT[:custom_field_version]
                one_zrequest['opennebula_version'] = field.value
            when SUPPORT[:custom_field_severity]
                one_zrequest['severity'] = field.value
            end
        end

        if zrequest.comments
            htmlcomment = zrequest.comments.delete_at(0)
            one_zrequest['html_description'] = htmlcomment.html_body

            zrequest.comments.each do |comment|
                one_zrequest['comments'] << {
                    'created_at' => comment.created_at,
                    'html_body' => comment.html_body,
                    'author_id' => comment.author_id,
                    'body' => comment.body
                }
            end
        end

        one_zrequest
    end

    def check_zendesk_api_gem
        error 500, 'Ruby version >= 1.9 is required' if UNSUPPORTED_RUBY

        error 500, 'zendesk_api gem missing' unless ZENDESK_API_GEM
    end
end

get '/support/request' do
    check_zendesk_api_gem

    zrequests = zendesk_client.requests(:status => 'new,open,pending')

    open_requests = 0
    pending_requests = 0
    one_zrequests = {
        'REQUEST_POOL' => {}
    }

    if !zrequests.empty?
        one_zrequests['REQUEST_POOL']['REQUEST'] = []
    end

    zrequests.each do |zrequest|
        case zrequest.status
        when 'pending'
            pending_requests += 1
        when 'open'
            open_requests += 1
        end

        one_zrequests['REQUEST_POOL']['REQUEST'] << zrequest_to_one(zrequest)
    end

    one_zrequests['open_requests'] = open_requests
    one_zrequests['pending_requests'] = pending_requests

    [200, JSON.pretty_generate(one_zrequests)]
end

get '/support/request/:id' do
    check_zendesk_api_gem

    zrequest = zendesk_client.requests.find(:id => params[:id])

    error 404, "Cannot find request with #{params[:id]}" if zrequest.nil?

    one_zrequest = {
        'REQUEST' => zrequest_to_one(zrequest)
    }

    [200, JSON.pretty_generate(one_zrequest)]
end

post '/support/request' do
    check_zendesk_api_gem

    body_hash = JSON.parse(@request_body)

    zen_api = ZendeskAPI::Request

    zrequest = zen_api.new(
        zendesk_client,
        :subject => body_hash['subject'],
        :comment => { :value => body_hash['description'] },
        :custom_fields => [
            { :id => SUPPORT[:custom_field_severity],
              :value => body_hash['severity'] },
            { :id => SUPPORT[:custom_field_version],
              :value => body_hash['opennebula_version'] }
        ],
        :tags => [body_hash['severity']]
    )

    if zrequest.save
        [201, JSON.pretty_generate(zrequest_to_one(zrequest))]
    else
        [403, Error.new(zrequest.errors['base'][0]['description']).to_json]
    end
end

# Returns whether this OpenNebula instances is supported or not
get '/support/check' do
    one_version = OpenNebula::VERSION
    if !one_version.empty? &&
       !$conf[:token_remote_support].nil? &&
       !$conf[:token_remote_support].empty?

        $conf[:one_support_time] = 0 if $conf[:one_support_time].nil?
        validate_time = Time.now.to_i - $conf[:one_support_time]

        if validate_time < 86400
            return [200, JSON.pretty_generate(:pass => true)]
        end

        begin
            http = Curl.get(ENTERPRISE_REPO_URL) do |request|
                if !$conf[:proxy].nil? && !$conf[:proxy].empty?
                    request.proxy_url = $conf[:proxy]
                end
                token_enc = Base64.strict_encode64($conf[:token_remote_support])
                request.headers['Authorization'] = 'Basic ' + token_enc
                request.headers['User-Agent'] =
                    'OpenNebula Subscription Validation'
            end
        rescue StandardError
            [400, JSON.pretty_generate(:pass => false, :error => 'error curl')]
        end

        if !http.nil? && http.response_code < 400
            $conf[:one_support_time] = Time.now.to_i
            [200, JSON.pretty_generate(:pass => true)]
        else
            [400, JSON.pretty_generate(:pass => false, :error => "http code \
                  #{http}")]
        end
    else
        [400, JSON.pretty_generate(:pass => false, :error => 'empty/nil \
              version or token')]
    end
end

# Returns latest available version
get '/support/check/version' do
    token = $conf[:token_remote_support]

    def return_route(version, http_code = 200)
        [http_code, JSON.pretty_generate(:version => version)]
    end

    begin
        http = Curl::Easy.new
        if token.nil?
            http.url = 'https://downloads.opennebula.io/repo/'
        else
            http.url = 'https://enterprise.opennebula.io/repo/'
            http.http_auth_types = :basic
            http.username = token.split(':')[0]
            http.password = token.split(':')[1]
        end

        # support behind proxy
        if !$conf[:proxy].nil? && !$conf[:proxy].empty?
            http.proxy_url = $conf[:proxy]
        end
        http.headers['User-Agent'] = 'OpenNebula Version Validation'

        http.perform

        if http.nil? || http.response_code != 200
            return return_route(0, 400)
        end

        html = http.body_str
    rescue StandardError
        return return_route(0, 400)
    end

    doc = Nokogiri::HTML(html)
    values = doc.xpath('//table/tr/td/a/text()')
    data = values.map do |value|
        if value.to_s.split('.')[1].to_i.even?
            value.to_s.delete('/')
        end
    end

    data = data.grep(/[0-9]/)

    return_route(data.max)
end

post '/support/request/:id/action' do
    check_zendesk_api_gem

    body_hash = JSON.parse(@request_body)
    if body_hash['action']['params']['comment']
        comment_value = body_hash['action']['params']['comment']['value']
    else
        logger.error('[OpenNebula Support] Missing comment message')
        error = Error.new(e.message)
        error 403, error.to_json
    end

    zrequest = zendesk_client.requests.find(:id => params[:id])

    error 404, "Cannot find request with #{params[:id]}" if zrequest.nil?

    zrequest.comment = { 'value' => comment_value }
    zrequest.solved = true if body_hash['action']['params']['solved']
    zrequest.save!

    one_zrequest = {
        'REQUEST' => zrequest_to_one(zrequest)
    }

    [201, JSON.pretty_generate(one_zrequest)]
end

post '/support/request/:id/upload' do
    check_zendesk_api_gem

    name = params[:tempfile]

    if !name
        [500, OpenNebula::Error.new('There was a problem uploading the file, \
                please check the permissions on the file').to_json]
    else
        tmpfile = File.join(Dir.tmpdir, name)

        zrequest = zendesk_client.requests.find(:id => params[:id])
        error 404, "Cannot find request with #{params[:id]}" if zrequest.nil?

        comment = ZendeskAPI::Request::Comment.new(zendesk_client,
                                                   'value' => name)
        comment.uploads << tmpfile

        zrequest.comment = comment
        zrequest.save

        one_zrequest = {
            'REQUEST' => zrequest_to_one(zrequest)
        }

        FileUtils.rm(tmpfile)

        [201, JSON.pretty_generate(one_zrequest)]
    end
end

post '/support/credentials' do
    check_zendesk_api_gem

    body_hash = JSON.parse(@request_body)
    if body_hash['email'].nil? || body_hash['password'].nil?
        error 401, 'Zendesk credentials not provided'
    end

    session['zendesk_email'] = body_hash['email']
    session['zendesk_password'] = Base64.decode64(body_hash['password'])

    zendesk_client

    [204, '']
end

delete '/support/credentials' do
    check_zendesk_api_gem

    session['zendesk_email'] = nil
    session['zendesk_password'] = nil

    [204, '']
end

# rubocop:enable Style/GlobalVars

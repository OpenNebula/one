# -------------------------------------------------------------------------- #
# Copyright 2010-2015, C12G Labs S.L.                                        #
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

UNSUPPORTED_RUBY = (RUBY_VERSION =~ /^1.8/) != nil

begin
    require 'zendesk_api'
rescue LoadError
    STDERR.puts "[OpenNebula Support] Missing zendesk_api gem"
    ZENDESK_API_GEM = false
else
    ZENDESK_API_GEM = true
end

helpers do
    def zendesk_client
        client = ZendeskAPI::Client.new do |config|
          # Mandatory:

          config.url = "https://opennebula.zendesk.com/api/v2" # e.g. https://mydesk.zendesk.com/api/v2

          # Basic / Token Authentication
          config.username = session["zendesk_email"]

          # Choose one of the following depending on your authentication choice
          # config.token = "your zendesk token"
          config.password = session["zendesk_password"]

          # OAuth Authentication
          # config.access_token = "your OAuth access token"

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

          # Merged with the default client options hash
          if ENV['http_proxy']
            config.client_options = { :proxy => ENV['http_proxy'] }
          end

          # When getting the error 'hostname does not match the server certificate'
          # use the API at https://yoursubdomain.zendesk.com/api/v2
        end

        if client.current_user.nil? || client.current_user.id.nil?
            error 401, "Zendesk account credentials are incorrect"
        else
            return client
        end
    end

    def zrequest_to_one(zrequest)
        one_zrequest = {
            "id" => zrequest.id,
            "url" => zrequest.url,
            "subject" => zrequest.subject,
            "description" => zrequest.description,
            "status" => zrequest.status,
            "created_at" => zrequest.created_at,
            "updated_at" => zrequest.updated_at,
            "comments" => []
        }

        zrequest.custom_fields.each { |field|
            case field.id
            when 391130
                one_zrequest["opennebula_version"] = field.value
            when 391197
                one_zrequest["severity"] = field.value
            end
        }

        if zrequest.comments
            comment = zrequest.comments.delete_at(0)
            one_zrequest["html_description"] = comment.html_body

            zrequest.comments.each{ |comment|
                one_zrequest["comments"] << {
                    "created_at" => comment.created_at,
                    "html_body" => comment.html_body,
                    "author_id" => comment.author_id,
                    "body" => comment.body
                }
            }
        end

        return one_zrequest
    end

    def check_zendesk_api_gem
        if UNSUPPORTED_RUBY
            error 500, "Ruby version >= 1.9 is required"
        end

        if !ZENDESK_API_GEM
            error 500, "zendesk_api gem missing"
        end
    end
end

get '/support/request' do
    check_zendesk_api_gem

    zrequests = zendesk_client.requests({:status => "open,pending"})

    open_requests = 0
    pending_requests = 0
    one_zrequests = {
        "REQUEST_POOL" => {
        }
    }

    if zrequests.size > 0
        one_zrequests["REQUEST_POOL"]["REQUEST"] = []
    end

    zrequests.each { |zrequest|
        if zrequest.status == "pending"
            pending_requests += 1
        elsif zrequest.status == "open"
            open_requests +=1
        end

        one_zrequests["REQUEST_POOL"]["REQUEST"] << zrequest_to_one(zrequest)
    }

    one_zrequests["open_requests"] = open_requests
    one_zrequests["pending_requests"] = pending_requests

    [200, JSON.pretty_generate(one_zrequests)]
end

get '/support/request/:id' do
    check_zendesk_api_gem

    zrequest = zendesk_client.requests.find(:id => params[:id])
    # TODO check error
    one_zrequest = {
        "REQUEST" => zrequest_to_one(zrequest)
    }

    [200, JSON.pretty_generate(one_zrequest)]
end

post '/support/request' do
    check_zendesk_api_gem

    body_hash = JSON.parse(@request_body)

    zrequest = ticket = ZendeskAPI::Request.new(zendesk_client, {
            :subject => body_hash['subject'],
            :comment => { :value => body_hash['description'] },
            :custom_fields => [
              {:id => 391197, :value => body_hash['severity']},
              {:id => 391130, :value => body_hash['opennebula_version']}
            ]
          })

    if zrequest.save
        [201, JSON.pretty_generate(zrequest_to_one(zrequest))]
    else
        [403, Error.new(zrequest.errors["base"][0]["description"]).to_json]
    end
end

post '/support/request/:id/action' do
    check_zendesk_api_gem

    body_hash = JSON.parse(@request_body)
    if body_hash["action"]["params"]['comment']
        comment_value = body_hash["action"]["params"]['comment']['value']
    else
        logger.error("[OpenNebula Support] Missing comment message")
        error = Error.new(e.message)
        error 403, error.to_json
    end

    zrequest = zendesk_client.requests.find(:id => params[:id])
    # TODO check error

    zrequest.comment = {"value" => body_hash["action"]["params"]['comment']['value']}
    zrequest.solved = true if body_hash["action"]["params"]["solved"]
    zrequest.save!

    one_zrequest = {
        "REQUEST" => zrequest_to_one(zrequest)
    }

    [201, JSON.pretty_generate(one_zrequest)]
end


post '/support/request/:id/upload' do
    check_zendesk_api_gem

    tmpfile = nil

    name = params[:tempfile]

    if !name
        [500, OpenNebula::Error.new("There was a problem uploading the file, " \
                "please check the permissions on the file").to_json]
    else
        tmpfile = File.join(Dir.tmpdir, name)

        zrequest = zendesk_client.requests.find(:id => params[:id])
        # TODO check error

        comment = ZendeskAPI::Request::Comment.new(zendesk_client, {"value" => name})
        comment.uploads << tmpfile

        zrequest.comment = comment
        zrequest.save

        one_zrequest = {
            "REQUEST" => zrequest_to_one(zrequest)
        }

        FileUtils.rm(tmpfile)

        [201, JSON.pretty_generate(one_zrequest)]
    end
end

post '/support/credentials' do
    check_zendesk_api_gem

    body_hash = JSON.parse(@request_body)
    if body_hash["email"].nil? || body_hash["password"].nil?
        error 401, "Zendesk credentials not provided"
    end

    session["zendesk_email"] = body_hash["email"]
    session["zendesk_password"] = body_hash["password"]

    zendesk_client

    [204, ""]
end

delete '/support/credentials' do
    check_zendesk_api_gem

    session["zendesk_email"] = nil
    session["zendesk_password"] = nil

    [204, ""]
end

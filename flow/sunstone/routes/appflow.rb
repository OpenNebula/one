$: << RUBY_LIB_LOCATION+"/apptools/flow"

require 'appflow_client'

##############################################################################
# Login
##############################################################################
post '/login' do
    code, body = build_session
    if code == 204
        auth = Rack::Auth::Basic::Request.new(request.env)

        if auth.provided? && auth.basic?
            username, password = auth.credentials

            client = Service::Client.new(
                :username   => username,
                :password   => password,
                :url        => settings.config[:appflow_server],
                :user_agent => "Sunstone")

            response = client.login
            if CloudClient::is_error?(response)
                settings.logger "[AppFlow] " + response.to_s
            else
                session[:appflow_cookie] = response['set-cookie'].split('; ')[0]
            end
        else
            settings.logger "[AppFlow] " + "Unauthorized AppFlow login attempt"
        end

        [204, ""]
    else
        [code, body]
    end
end

post '/logout' do
    client = Service::Client.new(
        :url        => settings.config[:appflow_server],
        :user_agent => "Sunstone",
        :cookie     => session[:appflow_cookie])

    client.logout
    # TBD Check http code

    destroy_session
end

helpers do
    def build_client
        Service::Client.new(
                :url        => settings.config[:appflow_server],
                :user_agent => "Sunstone",
                :cookie     => session[:appflow_cookie])
    end

    def format_response(resp)
        if CloudClient::is_error?(resp)
            logger.error("[AppFlow] " + resp.to_s)
            # TBD format error messages in JSON
            error 500, resp.to_s
        else
            body resp.body.to_s
        end
    end
end

##############################################################################
# Service
##############################################################################

get '/service' do
    client = build_client

    resp = client.get('/service')

    format_response(resp)
end

get '/service/:id' do
    client = build_client

    resp = client.get('/service/' + params[:id])

    format_response(resp)
end

delete '/service/:id' do
    client = build_client

    resp = client.delete('/service/' + params[:id])

    format_response(resp)
end

post '/service/:id/action' do
    client = build_client

    resp = client.post('/service/' + params[:id] + '/action', request.body.read)

    format_response(resp)
end

##############################################################################
# Service Template
##############################################################################

get '/service_template' do
    client = build_client

    resp = client.get('/service_template')

    format_response(resp)
end

get '/service_template/:id' do
    client = build_client

    resp = client.get('/service_template/' + params[:id])

    format_response(resp)
end

delete '/service_template/:id' do
    client = build_client

    resp = client.delete('/service_template/' + params[:id])

    format_response(resp)
end

post '/service_template/:id/action' do
    client = build_client

    resp = client.post('/service_template/' + params[:id] + '/action', request.body.read)

    format_response(resp)
end
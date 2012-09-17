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
                settings.logger "[AppFlow]" + response.to_s
            else
                session[:appflow_cookie] = response['set-cookie'].split('; ')[0]
            end
        else
            settings.logger "[AppFlow]" + "Unauthorized AppFlow login attempt"
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

##############################################################################
# Service
##############################################################################

get '/service' do
    client = Service::Client.new(
        :url        => settings.config[:appflow_server],
        :user_agent => "Sunstone",
        :cookie     => session[:appflow_cookie])

    response = client.get('/service')

    if CloudClient::is_error?(response)
        settings.logger "[AppFlow]" + response.to_s
        [500, response.to_s]
    else

    body response.to_s
end
APPFLOW_CONF_FILE = ETC_LOCATION + "/sunstone-appflow.conf"

$: << RUBY_LIB_LOCATION+"/apptools/flow"

require 'appflow_client'

begin
    appflow_conf = YAML.load_file(APPFLOW_CONF_FILE)
rescue Exception => e
    STDERR.puts "Error parsing config file #{APPFLOW_CONF_FILE}: #{e.message}"
    exit 1
end

set :appflow_config, appflow_conf

helpers do
    def build_client
        flow_client = settings.cloud_auth.client(session[:user])
        split_array = flow_client.one_auth.split(':')

        Service::Client.new(
                :url        => settings.appflow_config[:appflow_server],
                :user_agent => "Sunstone",
                :username   => split_array.shift,
                :password   => split_array.join(':'))
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

post '/service_template' do
    client = build_client

    resp = client.post('/service_template', request.body.read)

    format_response(resp)
end